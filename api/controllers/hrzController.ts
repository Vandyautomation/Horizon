import { queryDatabase } from '../utils/queryDatabase';

export async function getHRZData(customer?: string) {
  // Select only columns that exist on SalesOrderMST (based on /api/hrz/columns)
  // and try to get description from MaterialMST if available.
  const sqlQuery = `
    SELECT A.SODoc as SODoc,
           A.SOLine as SOLine,
           A.ItemNo as ItemNo,
           MAX(C.ItemDesc) as ItemDesc,
           A.Customer as Customer,
           A.DlvDate as DlvDate,
           A.OrderQty as OrderQty,
           A.OrderValue as OrderValue,
           A.Active as Active,
           SUM(ISNULL(B.QtyQuality, 0)) as QtyQuality,
           SUM(ISNULL(B.QtyUnrest, 0)) as QtyUnrest
    FROM SalesOrderMST A
    LEFT JOIN StockTRX B on A.ItemNo = B.ItemNo
    LEFT JOIN MaterialMST C on A.ItemNo = C.ItemNo
    GROUP BY A.SODoc, A.SOLine, A.ItemNo, A.Customer, A.DlvDate, A.OrderQty, A.OrderValue, A.Active
  `;

  const rows = await queryDatabase(sqlQuery);

  // Log for debugging - how many rows returned
  console.log(`getHRZData: fetched ${rows.length} rows`);

  let data = rows.map((row: any) => ({
    SalesOrder: row.SODoc,
    ItemNo: row.ItemNo,
    Description: row.ItemDesc || '',
    Customer: row.Customer,
    DlvDate: row.DlvDate,
    OrderQty: row.OrderQty || 0,
    OrderValue: row.OrderValue || 0,
    // fields not present in this schema - provide sensible defaults
    QtyQuality: row.QtyQuality || 0,
    QtyUnrest: row.QtyUnrest || 0,
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
