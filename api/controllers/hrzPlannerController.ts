import { queryDatabase } from "../utils/queryDatabase";

// Fetch planner rows based on Sales Order or Item
export async function getPlannerData(filters: { so?: string; itemNo?: string }) {
  const sql = `
    SELECT 
      so.SODoc,
      so.SOItem,
      so.PRO_name AS pro,
      so.MaterialID,
      so.MaterialDesc,
      so.Customer,
      so.OpenOrder,
      so.InitScheduleWeek,
      rou.mchprocess,
      rou.BaseQty,
      so.OpenOrder / NULLIF(rou.BaseQty, 0) AS STD,
      rou.grupid,
      g.groupname,
      k.UAP 
    FROM SalesOrderTRX so
left join ( select distinct MchID, materialid, mchprocess, baseqty, grupid from Routing ) rou on so.MaterialID = rou.materialid

left join ( select distinct grupid, groupname from groupcapacity ) g on rou.grupid = g.grupID

left join(select distinct MchID, uap from MachineMST) AS k on rou.MchID = k.MchID
    WHERE (@so IS NULL OR so.SODoc = @so)
      AND (@itemNo IS NULL OR so.MaterialID = @itemNo)
  `;

  const rows = await queryDatabase(sql, { so: filters.so ?? null, itemNo: filters.itemNo ?? null });

  // Map to frontend-friendly shape
  return rows.map((r: any) => ({
    so: r.SODoc,
    soItem: r.SOItem,
    process: r.mchprocess,
    itemNo: r.MaterialID,
    description: r.MaterialDesc,
    openOrder: Number(r.OpenOrder) || 0,
    //orderValue: Number(r.OrderVal) || 0,
    //dlvDate: r.DlvDate,
    initScheduleWeek: r.InitScheduleWeek,
    std: Number(r.STD) || 0,
    baseQty: Number(r.BaseQty) || 0,
    dspt: 22, // hard-coded placeholder
    uap: r.UAP,
    group: r.groupname , // fallback placeholder
    pro: r.pro,
  }));
}
