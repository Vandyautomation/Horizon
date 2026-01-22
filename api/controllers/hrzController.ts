import { queryDatabase } from '../utils/queryDatabase';

export interface HRZDataFilters {
  customer?: string;
  uap?: string;
  itemPrefix?: string;
  search?: string;
  searchBy?: 'salesOrder' | 'itemNo' | 'description' | 'customer';
  page?: number;
  limit?: number;
  year?: number;
  month?: number;
  day?: number;
}

export async function getHRZData(filters?: HRZDataFilters) {
  const customer = filters?.customer;
  const uap = filters?.uap;
  const itemPrefix = filters?.itemPrefix ?? null;
  const search = filters?.search?.trim() || null;
  const searchBy = filters?.searchBy ?? null;
  const page = Math.max(1, Number(filters?.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(filters?.limit ?? 50)));
  const offset = (page - 1) * limit;
  const year = filters?.year ?? null;
  const month = filters?.month ?? null;
  const day = filters?.day ?? null;
  // Select only columns that exist on SalesOrderMST (based on /api/hrz/columns)
  // and try to get description from MaterialMST if available.
  const sqlQuery = `
select 
       CAST(sova05.SORef2 AS NVARCHAR(50)) AS SORef2,
       CAST(sova05.MaterialID AS NVARCHAR(50)) AS MaterialID,
       CAST(sova05.DescriptionProduct AS NVARCHAR(255)) AS DescriptionProduct,
       CAST(sova05.OrderQty AS NVARCHAR(50)) AS OrderQty,
       CAST(sova05.DlvDate AS NVARCHAR(30)) AS DlvDate,
       CAST(sova05.Customer AS NVARCHAR(255)) AS Customer,
       CAST(sova05.OrderVal AS NVARCHAR(50)) AS OrderVal,
       CAST(sova05.Stock AS NVARCHAR(50)) AS Stock,
       CAST(sova05.TBP AS NVARCHAR(50)) AS TBP,
       CAST(DlvQty.DlvQty AS NVARCHAR(30)) AS dlvqty,
       CAST(sto.QtyUnrest AS NVARCHAR(50)) AS QtyUnrest,
       CAST(sto.QtyQuality AS NVARCHAR(50)) AS QtyQuality,
       CAST(sto.QtyBlocked AS NVARCHAR(50)) AS QtyBlocked,
       CAST(grp.UAP AS NVARCHAR(50)) AS UAP,
       CAST(rou.newproject AS NVARCHAR(10)) AS newproject,
       CAST(sova05.active AS NVARCHAR(10)) AS active
from hrz_salesorderva05trx sova05
left join ( select distinct SORef2, MaterialID, QtyUnrest, QtyQuality, QtyBlocked from hrz_stocktrx ) sto on sova05.soref2 = sto.soref2 and sto.MaterialID = sova05.MaterialID
left join ( select distinct MaterialID, NewProject, GrupId from Hrz_ROUTING ) rou on sova05.materialid = rou.materialid
left join ( select distinct GrupId, UAP from Hrz_GroupCapacity) grp on grp.GrupId = rou.GrupId
left join ( select distinct SORef2, MaterialID, DlvQty from Hrz_DlvQty ) DlvQty on DlvQty.soref2 = sova05.soref2 and DlvQty.materialid = sova05.materialid
where (
    (@year IS NULL AND @month IS NULL AND @day IS NULL AND CAST(sova05.DlvDate AS date) = CAST(GETDATE() AS date))
    OR
    (@year IS NOT NULL AND @month IS NULL AND @day IS NULL AND YEAR(sova05.DlvDate) = @year)
    OR
    (@year IS NOT NULL AND @month IS NOT NULL AND @day IS NULL AND YEAR(sova05.DlvDate) = @year AND MONTH(sova05.DlvDate) = @month)
    OR
    (@year IS NOT NULL AND @month IS NOT NULL AND @day IS NOT NULL
      AND YEAR(sova05.DlvDate) = @year AND MONTH(sova05.DlvDate) = @month AND DAY(sova05.DlvDate) = @day)
  )
  AND (@uap IS NULL OR grp.UAP = @uap)
  AND (@itemPrefix IS NULL OR sova05.MaterialID LIKE @itemPrefix + '%')
  AND (
    @search IS NULL OR (
      (@searchBy = 'salesOrder' AND (CAST(sova05.SORef2 AS NVARCHAR(50)) LIKE @search + '%' OR CAST(sova05.SORef2 AS NVARCHAR(50)) LIKE '%' + @search)) OR
      (@searchBy = 'itemNo' AND (CAST(sova05.MaterialID AS NVARCHAR(50)) LIKE @search + '%' OR CAST(sova05.MaterialID AS NVARCHAR(50)) LIKE '%' + @search)) OR
      (@searchBy = 'description' AND (CAST(sova05.DescriptionProduct AS NVARCHAR(255)) LIKE @search + '%' OR CAST(sova05.DescriptionProduct AS NVARCHAR(255)) LIKE '%' + @search)) OR
      (@searchBy = 'customer' AND (CAST(sova05.Customer AS NVARCHAR(255)) LIKE @search + '%' OR CAST(sova05.Customer AS NVARCHAR(255)) LIKE '%' + @search))
    )
  )
  AND (@customer IS NULL OR sova05.Customer LIKE '%' + @customer + '%')
 order by sova05.DlvDate desc, sova05.SORef2
 offset @offset rows fetch next @limit rows only
  `;
  //SELECT A.SODoc as SODoc,
  //         A.SOLine as SOLine,
  //         A.ItemNo as ItemNo,
  //         MAX(C.ItemDesc) as ItemDesc,
  //         A.Customer as Customer,
  //         A.DlvDate as DlvDate,
  //         A.OrderQty as OrderQty,
  //         A.OrderValue as OrderValue,
  //         A.Active as Active,
  //         SUM(ISNULL(B.QtyQuality, 0)) as QtyQuality,
  //         SUM(ISNULL(B.QtyUnrest, 0)) as QtyUnrest
  //  FROM SalesOrderMST A
  //  LEFT JOIN StockTRX B on A.ItemNo = B.ItemNo
  //  LEFT JOIN MaterialMST C on A.ItemNo = C.ItemNo
  //  GROUP BY A.SODoc, A.SOLine, A.ItemNo, A.Customer, A.DlvDate, A.OrderQty, A.OrderValue, A.Active
  const rows = await queryDatabase(sqlQuery, {
    uap: uap ?? null,
    itemPrefix,
    search,
    searchBy,
    customer: customer ?? null,
    offset,
    limit,
    year,
    month,
    day,
  });

  const countQuery = `
  select count(1) as total
  from hrz_salesorderva05trx sova05
  left join ( select distinct SORef2, MaterialID, QtyUnrest, QtyQuality, QtyBlocked from hrz_stocktrx ) sto on sova05.soref2 = sto.soref2 and sto.MaterialID = sova05.MaterialID
  left join ( select distinct MaterialID, NewProject, GrupId from Hrz_ROUTING ) rou on sova05.materialid = rou.materialid
  left join ( select distinct GrupId, UAP from Hrz_GroupCapacity) grp on grp.GrupId = rou.GrupId
  where (
      (@year IS NULL AND @month IS NULL AND @day IS NULL AND CAST(sova05.DlvDate AS date) = CAST(GETDATE() AS date))
      OR
      (@year IS NOT NULL AND @month IS NULL AND @day IS NULL AND YEAR(sova05.DlvDate) = @year)
      OR
      (@year IS NOT NULL AND @month IS NOT NULL AND @day IS NULL AND YEAR(sova05.DlvDate) = @year AND MONTH(sova05.DlvDate) = @month)
      OR
      (@year IS NOT NULL AND @month IS NOT NULL AND @day IS NOT NULL
        AND YEAR(sova05.DlvDate) = @year AND MONTH(sova05.DlvDate) = @month AND DAY(sova05.DlvDate) = @day)
    )
    AND (@uap IS NULL OR grp.UAP = @uap)
    AND (@itemPrefix IS NULL OR sova05.MaterialID LIKE @itemPrefix + '%')
    AND (
      @search IS NULL OR (
        (@searchBy = 'salesOrder' AND (CAST(sova05.SORef2 AS NVARCHAR(50)) LIKE @search + '%' OR CAST(sova05.SORef2 AS NVARCHAR(50)) LIKE '%' + @search)) OR
        (@searchBy = 'itemNo' AND (CAST(sova05.MaterialID AS NVARCHAR(50)) LIKE @search + '%' OR CAST(sova05.MaterialID AS NVARCHAR(50)) LIKE '%' + @search)) OR
        (@searchBy = 'description' AND (CAST(sova05.DescriptionProduct AS NVARCHAR(255)) LIKE @search + '%' OR CAST(sova05.DescriptionProduct AS NVARCHAR(255)) LIKE '%' + @search)) OR
        (@searchBy = 'customer' AND (CAST(sova05.Customer AS NVARCHAR(255)) LIKE @search + '%' OR CAST(sova05.Customer AS NVARCHAR(255)) LIKE '%' + @search))
      )
    )
    AND (@customer IS NULL OR sova05.Customer LIKE '%' + @customer + '%')
  `;

  const countRows = await queryDatabase(countQuery, {
    uap: uap ?? null,
    itemPrefix,
    search,
    searchBy,
    customer: customer ?? null,
    year,
    month,
    day,
  });
  const total = Number(countRows?.[0]?.total ?? 0);

  // Log for debugging - how many rows returned
  console.log(`getHRZData: fetched ${rows.length} rows (page ${page})`);

  let data = rows.map((row: any) => ({
    SalesOrder: row.SORef2,
    ItemNo: row.MaterialID,
    Description: row.DescriptionProduct,
    Customer: row.Customer,
    DlvDate: row.DlvDate,
    OrderQty: row.OrderQty || 0,
    OrderValue: row.OrderVal || 0,
    // fields not present in this schema - provide sensible defaults
    Stock: row.Stock || 0,
    tbp: row.TBP,
    dlvqty: row.dlvqty,
    QtyQuality: row.QtyQuality || 0,
    QtyUnrest: row.QtyUnrest || 0,
    UAP: row.UAP || null,
    // Flag project baru (0/1, bit, atau string)
    Project:
      row.NewProjectFlag ??
      row.NewProject ??
      row.newproject ??
      0,
  }));

  return { data, total, page, limit };
}

export async function getHRZColumns() {
  const sqlQuery = `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'SalesOrderMST'
    ORDER BY ORDINAL_POSITION
  `;
  const rows = await queryDatabase(sqlQuery);
  return rows.map((r: any) => r.COLUMN_NAME);
}

export async function getTableColumns(tableName: string) {
  const sqlQuery = `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = @tableName
    ORDER BY ORDINAL_POSITION
  `;
  const rows = await queryDatabase(sqlQuery, { tableName });
  return rows.map((r: any) => r.COLUMN_NAME);
}
