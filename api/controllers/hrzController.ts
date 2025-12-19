import { queryDatabase } from '../utils/queryDatabase';

export interface HRZDataFilters {
  customer?: string;
  uap?: string;
}

export async function getHRZData(filters?: HRZDataFilters) {
  const customer = filters?.customer;
  const uap = filters?.uap;
  // Select only columns that exist on SalesOrderMST (based on /api/hrz/columns)
  // and try to get description from MaterialMST if available.
  const sqlQuery = `
select sova05.SORef2, 
       sova05.MaterialID,
       sova05.DescriptionProduct, 
       sova05.OrderQty, 
       sova05.DlvDate, 
       sova05.Customer, 
       sova05.OrderVal, 
       sova05.Stock, 
       sova05.TBP, 
       sotrx.QtyUnrest, 
       sotrx.QtyQuality, 
       sotrx.QtyBlocked,
       sova05.UAP,
       rou.NewProject as NewProjectFlag
from hrz_salesorderva05trx sova05
left join (
  select distinct materialid, QtyUnrest, QtyQuality, QtyBlocked, orderstatus
  from hrz_salesordertrx
) sotrx on sova05.MaterialID = sotrx.materialid
left join (
  select distinct MaterialID, NewProject
  from Hrz_ROUTING
) rou on sova05.MaterialID = rou.MaterialID
where sotrx.orderstatus is not null
  AND (@uap IS NULL OR sova05.UAP = @uap)
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
  const rows = await queryDatabase(sqlQuery, { uap: uap ?? null });

  // Log for debugging - how many rows returned
  console.log(`getHRZData: fetched ${rows.length} rows`);

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

  if (customer) {
    const keyword = String(customer).toLowerCase();
    data = data.filter((d: any) => d.Customer?.toLowerCase().includes(keyword));
  }

  return data;
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
