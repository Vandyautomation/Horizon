import { queryDatabase } from "../utils/queryDatabase";

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
}) {
  const sql = `
    SELECT DISTINCT
      MchProcess,
      MaterialID,
      MaterialDesc,
      OpenOrder,
      loaddspt,
      availdspt,
      UAP,
      GroupName,
      InitScheduleWeek,
      Years,
      WeekNum,
      SORef2
    FROM vw_Hrz_SalesOrder_CapacityPlanning
    WHERE (@so IS NULL OR SORef2 = @so)
      AND (@itemNo IS NULL OR MaterialID = @itemNo)
      AND (@year IS NULL OR Years = @year)
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
    openOrder: Number(r.OpenOrder) || 0,
    initScheduleWeek: r.InitScheduleWeek,
    // Untuk saat ini STD/baseQty belum ada di view -> set 0 dulu
    std: Number(r.loaddspt) || 0,
    baseQty: 0,
    // pakai loaddspt sebagai nilai awal DSPT di level 2
    dspt: Number(r.availdspt) || 0,
    uap: r.UAP,
    group: r.GroupName,
    // PRO_name tidak ada di view, jadi kosong dulu
    pro: "",
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
      // identitas PRO_name / itemNo di level 3
      proName: string;
      dsptTotal?: number;
    };

const formatWeek = (w: number) => `W${String(w).padStart(2, "0")}`;

// Hitung ulang availdspt di Hrz_SalesOrderTRX berdasarkan total Dispatch
// yang tersimpan di Hrz_DispatchPlan untuk kombinasi SO + Material + PRO_name.
async function recomputeAvailDspt(params: {
  so: string;
  materialId: number;
  proName: string;
  year: number;
}) {
  const { so, materialId, proName, year } = params;

  // 1) Ambil total dispatch dari Hrz_DispatchPlan
  const sumSql = `
    SELECT ISNULL(SUM(dp.Dispatch), 0) AS totalDispatch
    FROM Hrz_DispatchPlan dp
    WHERE dp.SORef2     = @so
      AND dp.MaterialID = @materialId
      AND dp.PRO_name   = @proName
      AND dp.Years      = @year;
  `;

  const rows = await queryDatabase(sumSql, { so, materialId, proName, year });
  const totalDispatch = Number(rows[0]?.totalDispatch ?? 0);

  // 2) Update availdspt di Hrz_SalesOrderTRX
  const updateSql = `
    UPDATE Hrz_SalesOrderTRX
    SET availdspt = CASE
        WHEN loaddspt - @totalDispatch < 0 THEN 0
        ELSE loaddspt - @totalDispatch
      END
    WHERE SORef2     = @so
      AND MaterialID = @materialId
      AND PRO_name   = @proName;
  `;

  await queryDatabase(updateSql, { so, materialId, proName, totalDispatch });
}

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
    const existing = await queryDatabase(selectSql, baseParams);

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
      await queryDatabase(updateSql, { ...baseParams, dispatch: newQty });
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
      await queryDatabase(insertSql, { ...baseParams, dispatch: newQty });
    }

    // Setelah update dispatch per minggu, hitung ulang availdspt
    await recomputeAvailDspt({ so, materialId, proName, year });

    return { mode: "modal", week: weekStr, dispatch: newQty };
  }

  // mode === "move": pindahkan qty dari fromWeek ke toWeek
  const fromWeekStr = formatWeek(body.fromWeek);
  const toWeekStr = formatWeek(body.toWeek);
  const qty = Number(body.qty) || 0;

  if (qty <= 0) {
    return { mode: "move", ignored: true };
  }

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
  const fromRows = await queryDatabase(selectFromSql, fromParams);

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
      await queryDatabase(updateFromSql, { ...fromParams, dispatch: newFrom });
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
      await queryDatabase(deleteFromSql, fromParams);
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
  const toRows = await queryDatabase(selectToSql, toParams);

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
    await queryDatabase(updateToSql, { ...toParams, dispatch: newTo });
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
    await queryDatabase(insertToSql, { ...toParams, dispatch: qty });
  }

  // Perpindahan antar minggu tidak mengubah total Dispatch,
  // tapi untuk keamanan tetap hitung ulang availdspt dari total di Hrz_DispatchPlan.
  await recomputeAvailDspt({ so, materialId, proName, year });

  return {
    mode: "move",
    fromWeek: fromWeekStr,
    toWeek: toWeekStr,
    qty,
  };
}
