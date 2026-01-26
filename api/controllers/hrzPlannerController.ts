import {
  queryDatabase,
  queryDatabaseInTransaction,
  withTransaction,
} from "../utils/queryDatabase";

// ---------------------------------------------------------------------------
// PLANNER (LEVEL 2)
// ---------------------------------------------------------------------------

// Fetch planner rows from vw_Hrz_SalesOrder_CapacityPlanning
// so      -> SORef2
// year    -> Years
// from/to -> WeekNum range (numeric part)
export async function getPlannerData(filters: {
  so?: string;
  itemNo?: string;
  year?: number;
  fromWeek?: number;
  toWeek?: number;
  mode?: string;
}) {
  if (filters.mode === "level1") {
    const sql = `
      SELECT DISTINCT
        rou.MchProcess,
        bom.PartID,
        bom.Part
      FROM iot.dbo.Hrz_BOMStd bom
      LEFT JOIN (
        SELECT MaterialID, MchProcess
        FROM iot.dbo.Hrz_ROUTING
      ) AS rou
        ON rou.MaterialID = bom.PartID
      LEFT JOIN (
        SELECT SODoc, SOItem, SORef2, MaterialID
        FROM iot.dbo.Hrz_SalesOrderVA05Trx
      ) AS so
        ON so.MaterialID = bom.ProdukID OR so.MaterialID = bom.PartID
      WHERE so.SORef2 = @so;
    `;

    const rows = await queryDatabase(sql, {
      so: filters.so ?? null,
    });

    return rows.map((r: any) => ({
      process: r.MchProcess,
      itemNo: r.PartID,
      description: r.Part,
    }));
  }

  const sql = `
    SELECT DISTINCT
      v.MchProcess,
      v.MaterialID,
      v.MaterialDesc,
      v.TotalOpenOrder AS totalOpenOrder,
      v.TotalLoad,
      v.TotalAvail,
      v.UAP,
      v.GroupName,
      v.InitScheduleWeek,
      v.Years,
      v.WeekNum,
      v.SORef2,
      cap.Capacity,
      cap.AvailCapacity
    FROM vw_Hrz_SalesOrder_CapacityPlanning v
    LEFT JOIN iot.dbo.Hrz_GroupCapacity grp
      ON v.GroupName = grp.GroupName
    LEFT JOIN iot.dbo.hrz_capacitymch cap
      ON cap.GroupID = grp.GrupId
      AND cap.MchProcess = v.MchProcess
      AND cap.UAP = v.UAP
      AND cap.Years = v.Years
      AND cap.WeekNum = v.WeekNum
      AND cap.Active = 1
    WHERE (@so IS NULL OR v.SORef2 = @so)
      AND (@itemNo IS NULL OR v.MaterialID = @itemNo)
      AND (@year IS NULL OR v.Years = @year)
      AND (
        @fromWeek IS NULL
        OR TRY_CAST(RIGHT(v.WeekNum, 2) AS INT) >= @fromWeek
      )
      AND (
        @toWeek IS NULL
        OR TRY_CAST(RIGHT(v.WeekNum, 2) AS INT) <= @toWeek
      );
  `;

  const rows = await queryDatabase(sql, {
    so: filters.so ?? null,
    itemNo: filters.itemNo ?? null,
    year: filters.year ?? null,
    fromWeek: filters.fromWeek ?? null,
    toWeek: filters.toWeek ?? null,
  });

  // Map ke shape yang dipakai frontend (SalesOrderDetailPlanner)
  return rows.map((r: any) => ({
    so: r.SORef2,
    soItem: null,
    process: r.MchProcess,
    itemNo: r.MaterialID,
    description: r.MaterialDesc,
    openOrder: Number(r.totalOpenOrder ?? r.TotalOpenOrder) || 0,
    initScheduleWeek: r.InitScheduleWeek,
    // Untuk saat ini STD/baseQty belum ada di view -> set 0 dulu
    std: Number(r.TotalLoad) || 0,
    baseQty: 0,
    // pakai loaddspt sebagai nilai awal DSPT di level 2
    dspt: Number(r.TotalAvail) || 0,
    uap: r.UAP,
    group: r.GroupName,
    // PRO_name tidak ada di view, jadi kosong dulu
    pro: "",
    weekNum: r.WeekNum,
    capacity: Number(r.Capacity),
    availCapacity: Number(r.AvailCapacity),
  }));
}

export async function getPlannerAvailData(filters?: {
  so?: string;
  itemNo?: string;
  year?: number;
  fromWeek?: number;
  toWeek?: number;
}) {
  const so = filters?.so ?? null;
  const itemNo = filters?.itemNo ?? null;
  const year = filters?.year ?? null;
  const fromWeek = filters?.fromWeek ?? null;
  const toWeek = filters?.toWeek ?? null;

  const sqlQuery = `
    SELECT
      v.SORef2,
      v.MaterialID,
      MAX(v.TotalAvail) AS TotalAvail
    FROM vw_Hrz_SalesOrder_CapacityPlanning v
    WHERE (@so IS NULL OR v.SORef2 = @so)
      AND (@itemNo IS NULL OR v.MaterialID = @itemNo)
      AND (@year IS NULL OR v.Years = @year)
      AND (
        @fromWeek IS NULL
        OR TRY_CAST(RIGHT(v.WeekNum, 2) AS INT) >= @fromWeek
      )
      AND (
        @toWeek IS NULL
        OR TRY_CAST(RIGHT(v.WeekNum, 2) AS INT) <= @toWeek
      )
    GROUP BY v.SORef2, v.MaterialID;
  `;

  const rows = await queryDatabase(sqlQuery, {
    so,
    itemNo,
    year,
    fromWeek,
    toWeek,
  });

  return rows.map((r: any) => ({
    so: r.SORef2,
    itemNo: r.MaterialID,
    totalAvail: Number(r.TotalAvail) || 0,
  }));
}

// ---------------------------------------------------------------------------
// PLANNER (LEVEL 3 - DETAIL PROSES)
// ---------------------------------------------------------------------------

// Detail proses per MaterialID (level 3)
// hanya mengambil kolom: MchProcess, PRO_name, OpenOrder, loaddspt, availdspt
export async function getPlannerProcessDetail(filters: {
  so: string;
  materialId: number;
  year?: number;
  fromWeek?: number;
  toWeek?: number;
}) {
  const sql = `
    SELECT
      MchProcess,
      PRO_name,
      OpenOrder,
      loaddspt,
      availdspt
    FROM vw_Hrz_SalesOrder_CapacityPlanning
    WHERE SORef2 = @so
      AND MaterialID = @materialId
      AND (@year IS NULL OR Years = @year)
      AND (
        @fromWeek IS NULL
        OR TRY_CAST(RIGHT(WeekNum, 2) AS INT) >= @fromWeek
      )
      AND (
        @toWeek IS NULL
        OR TRY_CAST(RIGHT(WeekNum, 2) AS INT) <= @toWeek
      )
    ORDER BY MaterialDesc DESC;
  `;

  const rows = await queryDatabase(sql, {
    so: filters.so,
    materialId: filters.materialId,
    year: filters.year ?? null,
    fromWeek: filters.fromWeek ?? null,
    toWeek: filters.toWeek ?? null,
  });

  return rows.map((r: any) => ({
    process: r.MchProcess,
    itemNo: r.PRO_name,
    openOrder: Number(r.OpenOrder) || 0,
    std: Number(r.loaddspt) || 0,
    dspt: Number(r.availdspt) || 0,
  }));
}

// ---------------------------------------------------------------------------
// PLANNER DISPATCH DATA (AMBIL DARI Hrz_DispatchPlan)
// ---------------------------------------------------------------------------

export async function getPlannerDispatchSlots(filters: {
  so: string;
  materialId: number;
  year: number;
  fromWeek?: number;
  toWeek?: number;
}) {
  const sql = `
    SELECT
      PRO_name AS proName,
      MchProcess AS process,
      TRY_CAST(RIGHT(WeekNum, 2) AS INT) AS week,
      Dispatch AS dispatch
    FROM Hrz_DispatchPlan
    WHERE SORef2     = @so
      AND MaterialID = @materialId
      AND Years      = @year
      AND (
        @fromWeek IS NULL
        OR TRY_CAST(RIGHT(WeekNum, 2) AS INT) >= @fromWeek
      )
      AND (
        @toWeek IS NULL
        OR TRY_CAST(RIGHT(WeekNum, 2) AS INT) <= @toWeek
      );
  `;

  const rows = await queryDatabase(sql, {
    so: filters.so,
    materialId: filters.materialId,
    year: filters.year,
    fromWeek: filters.fromWeek ?? null,
    toWeek: filters.toWeek ?? null,
  });

  return rows.map((r: any) => ({
    proName: r.proName,
    process: r.process,
    week: Number(r.week) || 0,
    dispatch: Number(r.dispatch) || 0,
  }));
}

// ---------------------------------------------------------------------------
// CAPACITY DATA (GROUP/UAP/PROCESS)
// ---------------------------------------------------------------------------

export async function getPlannerCapacity(filters: {
  year: number;
  fromWeek?: number;
  toWeek?: number;
  process?: string;
  uap?: string;
  group?: string;
}) {
  const sql = `
    SELECT
      cap.GroupName,
      cap.UAP,
      cap.MchProcess,
      cap.Years,
      cap.WeekNum,
      cap.Capacity,
      cap.AvailCapacity
    FROM iot.dbo.hrz_capacitymch cap
    WHERE cap.Active = 1
      AND cap.Years = @year
      AND (@process IS NULL OR cap.MchProcess = @process)
      AND (@uap IS NULL OR cap.UAP = @uap)
      AND (@group IS NULL OR cap.GroupName = @group)
      AND (
        @fromWeek IS NULL
        OR TRY_CAST(RIGHT(cap.WeekNum, 2) AS INT) >= @fromWeek
      )
      AND (
        @toWeek IS NULL
        OR TRY_CAST(RIGHT(cap.WeekNum, 2) AS INT) <= @toWeek
      );
  `;

  return await queryDatabase(sql, {
    year: filters.year,
    fromWeek: filters.fromWeek ?? null,
    toWeek: filters.toWeek ?? null,
    process: filters.process ?? null,
    uap: filters.uap ?? null,
    group: filters.group ?? null,
  });
}

// ---------------------------------------------------------------------------
// PLANNER DISPATCH UPDATE (LEVEL 3 -> SIMPAN PER MINGGU DI Hrz_DispatchPlan)
// ---------------------------------------------------------------------------

export type PlannerDispatchUpdateBody =
  | {
      mode: "modal";
      so: string;
      materialId: number;
      process: string;
      year: number;
      week: number; // numeric week, mis: 51
      oldQty: number;
      newQty: number;
      delta?: number;
      // identitas PRO_name / itemNo di level 3
      proName: string;
      dsptTotal?: number;
    }
  | {
      mode: "move";
      so: string;
      materialId: number;
      process: string;
      year: number;
      fromWeek: number;
      toWeek: number;
      qty: number;
      delta?: number;
      // identitas PRO_name / itemNo di level 3
      proName: string;
      dsptTotal?: number;
    };

const formatWeek = (w: number) => `W${String(w).padStart(2, "0")}`;

// ---------------------------------------------------------------------------
// Helper: validasi WeekNum terhadap view kapasitas
// ---------------------------------------------------------------------------

// Cek apakah kombinasi SO + Material + Process + Year + WeekNum
// memang ada di vw_Hrz_SalesOrder_CapacityPlanning.
// Jika tidak ada, lempar error supaya FE tahu week tersebut tidak valid
// untuk proses yang dimaksud.
async function ensureWeekExistsInView(params: {
  so: string;
  materialId: number;
  process: string;
  year: number;
  weekNum: string; // format 'Wxx'
}) {
  const { so, materialId, process, year, weekNum } = params;

  const sql = `
    SELECT TOP 1 1 AS found
    FROM vw_Hrz_SalesOrder_CapacityPlanning
    WHERE SORef2     = @so
      AND MaterialID = @materialId
      AND MchProcess = @process
      AND Years      = @year
      AND WeekNum    = @weekNum;
  `;

  const rows = await queryDatabase(sql, {
    so,
    materialId,
    process,
    year,
    weekNum,
  });

  if (!rows.length) {
    // Catatan: sebelum validasi ini ditambahkan, backend langsung
    // menyimpan ke Hrz_DispatchPlan tanpa mengecek view sama sekali.
    // Jika ingin kembali ke perilaku lama, cukup comment throw ini
    // dan/atau pemanggilan ensureWeekExistsInView.
    throw new Error(
      `Week ${weekNum} tidak tersedia untuk proses ${process} (SO ${so}, Material ${materialId}).`
    );
  }
}

// Update availdspt di Hrz_SalesOrderTRX berdasarkan delta perubahan dispatch.
// delta > 0: avail berkurang, delta < 0: avail bertambah.
async function applyAvailDsptDelta(params: {
  so: string;
  materialId: number;
  proName: string;
  delta: number;
}, transaction?: any) {
  const { so, materialId, proName, delta } = params;

  if (!Number.isFinite(delta) || delta === 0) {
    return;
  }

  const execQuery = transaction
    ? (sqlQuery: string, queryParams: { [key: string]: any }) =>
        queryDatabaseInTransaction(transaction, sqlQuery, queryParams)
    : queryDatabase;

  const updateSql = `
    UPDATE Hrz_SalesOrderTRX
    SET availdspt = CASE
        WHEN availdspt - @delta < 0 THEN 0
        WHEN availdspt - @delta > loaddspt THEN loaddspt
        ELSE availdspt - @delta
      END
    WHERE SORef2     = @so
      AND MaterialID = @materialId
      AND PRO_name   = @proName;
  `;

  await execQuery(updateSql, { so, materialId, proName, delta });
}

// Update loading & available capacity for all groups/weeks (full refresh)
// async function updateAllCapacity() {
//   const sql = `
//     WITH LoadingSummary AS (
//       SELECT
//         rou.GrupId,
//         dplan.WeekNum,
//         SUM(dplan.Dispatch) AS TotalLoading
//       FROM iot.dbo.Hrz_DispatchPlan dplan
//       LEFT JOIN (
//         SELECT DISTINCT MaterialID, GrupId
//         FROM iot.dbo.Hrz_ROUTING
//       ) rou
//         ON dplan.MaterialID = rou.MaterialID
//       GROUP BY rou.GrupId, dplan.WeekNum
//     )
//     UPDATE cap
//     SET
//       cap.LoadingCapacity = ls.TotalLoading,
//       cap.AvailCapacity = cap.Capacity - ls.TotalLoading
//     FROM iot.dbo.Hrz_CapacityMch cap
//     INNER JOIN LoadingSummary ls
//       ON cap.GroupID = ls.GrupId
//       AND cap.WeekNum = ls.WeekNum;
//   `;
//
//   try {
//     await queryDatabase(sql, {});
//   } catch (error: any) {
//     console.error("Failed to update capacity (full refresh):", {
//       message: error?.message ?? error,
//     });
//   }
// }

export async function updatePlannerDispatch(body: PlannerDispatchUpdateBody) {
  const { so, materialId, process, year, proName } = body;

  // Pastikan numeric week valid
  if (body.mode === "modal" && (body.week < 1 || body.week > 52)) {
    throw new Error(`Invalid week value: ${body.week}`);
  }
  if (
    body.mode === "move" &&
    (body.fromWeek < 1 || body.fromWeek > 52 || body.toWeek < 1 || body.toWeek > 52)
  ) {
    throw new Error(
      `Invalid fromWeek/toWeek value: ${body.fromWeek} -> ${body.toWeek}`
    );
  }

  if (body.mode === "modal") {
    // Set nilai dispatch di satu minggu (overwrite)
    const weekStr = formatWeek(body.week);
    const newQty = Number(body.newQty) || 0;
    const oldQty = Number(body.oldQty) || 0;
    const delta = Number(body.delta ?? newQty - oldQty) || 0;

    // Validasi: hanya izinkan week yang benar-benar ada di view kapasitas
    // Sebelum penambahan ini, kode langsung menyimpan ke Hrz_DispatchPlan tanpa cek.
    await ensureWeekExistsInView({ so, materialId, process, year, weekNum: weekStr });

    const selectSql = `
      SELECT Dispatch
      FROM Hrz_DispatchPlan
      WHERE SORef2     = @so
        AND MaterialID = @materialId
        AND PRO_name   = @proName
        AND MchProcess = @process
        AND Years      = @year
        AND WeekNum    = @weekNum;
    `;

    const baseParams = { so, materialId, proName, process, year, weekNum: weekStr };
    return await withTransaction(async (tx) => {
      const existing = await queryDatabaseInTransaction(tx, selectSql, baseParams);

      if (existing.length) {
        const updateSql = `
          UPDATE Hrz_DispatchPlan
          SET Dispatch = @dispatch
          WHERE SORef2     = @so
            AND MaterialID = @materialId
            AND PRO_name   = @proName
            AND MchProcess = @process
            AND Years      = @year
            AND WeekNum    = @weekNum;
        `;
        await queryDatabaseInTransaction(tx, updateSql, { ...baseParams, dispatch: newQty });
      } else {
        const insertSql = `
          INSERT INTO Hrz_DispatchPlan (
            SORef2,
            MaterialID,
            PRO_name,
            MchProcess,
            Years,
            WeekNum,
            Dispatch
          )
          VALUES (
            @so,
            @materialId,
            @proName,
            @process,
            @year,
            @weekNum,
            @dispatch
          );
        `;
        await queryDatabaseInTransaction(tx, insertSql, { ...baseParams, dispatch: newQty });
      }

      // Setelah update dispatch per minggu, update availdspt pakai delta
      await applyAvailDsptDelta({ so, materialId, proName, delta }, tx);

      return { mode: "modal", week: weekStr, dispatch: newQty };
    });
  }

  // mode === "move": pindahkan qty dari fromWeek ke toWeek
  const fromWeekStr = formatWeek(body.fromWeek);
  const toWeekStr = formatWeek(body.toWeek);
  const qty = Number(body.qty) || 0;

  if (qty <= 0) {
    return { mode: "move", ignored: true };
  }

  // Validasi week tujuan: hanya izinkan week yang ada di view
  // (week asal diasumsikan valid karena datanya sudah tersimpan sebelumnya).
  await ensureWeekExistsInView({ so, materialId, process, year, weekNum: toWeekStr });

  // 1) Kurangi dari week asal (kalau ada)
  const selectFromSql = `
    SELECT Dispatch
    FROM Hrz_DispatchPlan
    WHERE SORef2     = @so
      AND MaterialID = @materialId
      AND PRO_name   = @proName
      AND MchProcess = @process
      AND Years      = @year
      AND WeekNum    = @weekNum;
  `;
  const fromParams = {
    so,
    materialId,
    proName,
    process,
    year,
    weekNum: fromWeekStr,
  };
  return await withTransaction(async (tx) => {
    const fromRows = await queryDatabaseInTransaction(tx, selectFromSql, fromParams);

    if (fromRows.length) {
      const currentFrom = Number(fromRows[0].Dispatch) || 0;
      const newFrom = currentFrom - qty;

      if (newFrom > 0) {
        const updateFromSql = `
          UPDATE Hrz_DispatchPlan
          SET Dispatch = @dispatch
          WHERE SORef2     = @so
            AND MaterialID = @materialId
            AND PRO_name   = @proName
            AND MchProcess = @process
            AND Years      = @year
            AND WeekNum    = @weekNum;
        `;
        await queryDatabaseInTransaction(tx, updateFromSql, {
          ...fromParams,
          dispatch: newFrom,
        });
      } else {
        const deleteFromSql = `
          DELETE FROM Hrz_DispatchPlan
          WHERE SORef2     = @so
            AND MaterialID = @materialId
            AND PRO_name   = @proName
            AND MchProcess = @process
            AND Years      = @year
            AND WeekNum    = @weekNum;
        `;
        await queryDatabaseInTransaction(tx, deleteFromSql, fromParams);
      }
    }

    // 2) Tambah ke week tujuan (upsert)
    const selectToSql = `
      SELECT Dispatch
      FROM Hrz_DispatchPlan
      WHERE SORef2     = @so
        AND MaterialID = @materialId
        AND PRO_name   = @proName
        AND MchProcess = @process
        AND Years      = @year
        AND WeekNum    = @weekNum;
    `;
    const toParams = {
      so,
      materialId,
      proName,
      process,
      year,
      weekNum: toWeekStr,
    };
    const toRows = await queryDatabaseInTransaction(tx, selectToSql, toParams);

    if (toRows.length) {
      const currentTo = Number(toRows[0].Dispatch) || 0;
      const newTo = currentTo + qty;

      const updateToSql = `
        UPDATE Hrz_DispatchPlan
        SET Dispatch = @dispatch
        WHERE SORef2     = @so
          AND MaterialID = @materialId
          AND PRO_name   = @proName
          AND MchProcess = @process
          AND Years      = @year
          AND WeekNum    = @weekNum;
      `;
      await queryDatabaseInTransaction(tx, updateToSql, { ...toParams, dispatch: newTo });
    } else {
      const insertToSql = `
        INSERT INTO Hrz_DispatchPlan (
          SORef2,
          MaterialID,
          PRO_name,
          MchProcess,
          Years,
          WeekNum,
          Dispatch
        )
        VALUES (
          @so,
          @materialId,
          @proName,
          @process,
          @year,
          @weekNum,
          @dispatch
        );
      `;
      await queryDatabaseInTransaction(tx, insertToSql, { ...toParams, dispatch: qty });
    }

    // Perpindahan antar minggu tidak mengubah total Dispatch,
    // jadi tidak perlu update availdspt (delta = 0).

    return {
      mode: "move",
      fromWeek: fromWeekStr,
      toWeek: toWeekStr,
      qty,
    };
  });
}

