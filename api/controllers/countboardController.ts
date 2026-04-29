import { queryDatabase } from '../utils/queryDatabase'

export async function getRejectLists() {
  const sqlQuery = `
SELECT id, name from RejectMST where active = 1
  `
  return await queryDatabase(sqlQuery)
}
export async function getUsers() {
  const sqlQuery = `
  SELECT *
    FROM IoT.dbo.UsersOpt
  `

  return await queryDatabase(sqlQuery)
}
export async function getAssignUsers() {
  const sqlQuery = `
    SELECT 
      UserRFID,
      UserName,
      UserDept,
      UserUAP
    FROM IoT.dbo.useraccessmst
    WHERE UserDept IN (
      'OperatorBahan',
      'Mechanic',
      'SPV Production'
    )
  `

  return await queryDatabase(sqlQuery)
}

// console.log('Users:', getUsers());
export async function editScrap(hourlyId: number, scrap: number) {
  const sqlQuery = `
    DECLARE @oldScrap INT;
    DECLARE @deltaScrap INT;

    SELECT @oldScrap = ISNULL(scrap, 0)
    FROM IoT.dbo.hourly
    WHERE id = @hourlyId;

    SET @deltaScrap = @scrap - @oldScrap;

    UPDATE IoT.dbo.hourly
    SET
      scrap = @scrap,
      running_actual_qty = running_actual_qty - @deltaScrap
    WHERE id = @hourlyId;
  `

  try {
    return await queryDatabase(sqlQuery, {
      hourlyId,
      scrap,
    })
  } catch (error: any) {
    console.error('Error updating scrap:', error)
    throw new Error(`Failed to update scrap: ${error.message}`)
  }
}

export async function editRework(hourlyId: number, rework: number) {
  const sqlQuery = `
    DECLARE @oldRework INT;
    DECLARE @deltaRework INT;

    SELECT @oldRework = ISNULL(rework, 0)
    FROM IoT.dbo.hourly
    WHERE id = @hourlyId;

    SET @deltaRework = @rework - @oldRework;

    UPDATE IoT.dbo.hourly
    SET
      rework = @rework,
      running_actual_qty = running_actual_qty - @deltaRework
    WHERE id = @hourlyId;
  `

  try {
    return await queryDatabase(sqlQuery, {
      hourlyId,
      rework,
    })
  } catch (error: any) {
    console.error('Error updating rework:', error)
    throw new Error(`Failed to update rework: ${error.message}`)
  }
}

export async function addRouting(data: any[][]) {
  const validData = data.slice(1).filter((row) => {
    const [
      Scheduler,
      ,
      MRPController,
      OldMaterialNo,
      Material,
      MaterialDescription,
      GrC,
      BaseQuantity,
      Un1,
      Un2,
      OpAc,
      WorkCtr,
      WorkCenterDescription,
      Machine,
      Unit1,
      Labor,
      Unit2,
      NoEmpl,
      CycleTime,
      CtrK,
      Cavities,
    ] = row

    // Check for null or undefined values and ensure the data types are correct
    // if (
    //   !Scheduler || !Material || !MaterialDescription || !CycleTime || !Cavities ||
    //    typeof CycleTime !== 'number' || typeof Cavities !== 'number'
    // ) {
    //   return false;
    // }

    return true
  })

  if (validData.length === 0) {
    throw new Error('Data tidak valid untuk di insert, periksa kembali')
  }

  // console.log('Backend Valid data length:', validData.length)

  // Escape single quotes by replacing ' with ''
  const escapeSingleQuote = (value: string) => value.replace(/'/g, "''")

  const sqlQuery = `
      WITH deduplicated_source AS (
        SELECT
          scheduler,
          material_id,
          material_name,
          ct,
          cvt,
          created_at,
          modified_at,
          is_sync,
          ROW_NUMBER() OVER (PARTITION BY material_id ORDER BY material_id) as rn
        FROM (
          VALUES
            ${validData
              .map(
                (row) =>
                  `('${escapeSingleQuote(row[0])}', '${escapeSingleQuote(row[4])}', '${escapeSingleQuote(row[5])}', ${row[18]}, ${row[20]}, getdate(), getdate(), 0)`
              )
              .join(', ')}
        ) AS source(scheduler, material_id, material_name, ct, cvt, created_at, modified_at, is_sync)
      )
      MERGE INTO IoT.dbo.routing AS target
      USING (
        SELECT * FROM deduplicated_source WHERE rn = 1
      ) AS unique_source
      ON target.material_id = unique_source.material_id 
         AND ISNULL(target.is_deleted, 0) = 0
      WHEN MATCHED THEN
        UPDATE SET
          scheduler = unique_source.scheduler,
          material_name = unique_source.material_name,
          created_at = unique_source.created_at,
          modified_at = unique_source.modified_at,
          is_sync = unique_source.is_sync
      WHEN NOT MATCHED THEN
        INSERT (scheduler, material_id, material_name, ct, cvt, created_at, modified_at, is_sync)
        VALUES (unique_source.scheduler, unique_source.material_id, unique_source.material_name, unique_source.ct, unique_source.cvt, unique_source.created_at, unique_source.modified_at, unique_source.is_sync);
    `

  return await queryDatabase(sqlQuery)
}

export async function addCoois(data: any[][]) {
  const validData = data.slice(1).filter((row) => {
    const [
      po_number,
      so_item,
      ,
      type,
      pn,
      produk,
      order_qty,
      hasil_qty,
      minus_qty,
    ] = row

    // Check for null or undefined values and ensure the data types are correct
    if (
      !po_number ||
      !pn ||
      !produk ||
      typeof order_qty !== 'number' ||
      typeof hasil_qty !== 'number' ||
      typeof minus_qty !== 'number'
    ) {
      return false
    }

    return true
  })

  if (validData.length === 0) {
    throw new Error('Data tidak valid untuk di insert, periksa kembali')
  }

  const sqlQuery = `
    MERGE INTO IoT.dbo.coois AS target
    USING (
      VALUES 
        ${validData
          .map(
            (row) =>
              `('${row[0]}', '${row[1]}', '${row[2]}', '${row[3]}', '${row[4]}', '${row[5]}', ${row[6]}, ${row[7]}, getdate(), getdate(), 0)`
          )
          .join(', ')}
    ) AS source(po_name, so_name, op_no, type, material_id, material_name, required_qty, produced_qty, uploaded_at, modified_at, is_sync)
    ON target.po_name = source.po_name AND ISNULL(target.is_deleted, 0) = 0
    WHEN MATCHED THEN
      UPDATE SET
        so_name = source.so_name,
        op_no = source.op_no,
        type = source.type,
        material_id = source.material_id,
        material_name = source.material_name,
        required_qty = source.required_qty,
        produced_qty = source.produced_qty,
        modified_at = source.modified_at,
        is_sync = source.is_sync
    WHEN NOT MATCHED THEN
      INSERT (po_name, so_name, op_no, type, material_id, material_name, required_qty, produced_qty, uploaded_at, modified_at, is_sync)
      VALUES (source.po_name, source.so_name, source.op_no, source.type, source.material_id, source.material_name, source.required_qty, source.produced_qty, source.uploaded_at, source.modified_at, source.is_sync);
  `

  try {
    return await queryDatabase(sqlQuery)
  } catch (error: any) {
    console.error('Error inserting coois data:', error)
    throw new Error(`Failed to insert coois data: ${error.message}`)
  }
}

export async function editTopScrap(
  hourlyId: number,
  reject_a: number,
  reject_b: number,
  reject_c: number,
  reject_d: number
) {
  const sqlQuery = `

  UPDATE IoT.dbo.hourly_uv
      SET reject_a_id = @reject_a, reject_b_id = @reject_b, reject_c_id = @reject_c, reject_d_id = @reject_d
      WHERE id = @hourlyId;
  UPDATE IoT.dbo.Reject_Machine_Relationship
      set reject_a_id = @reject_a, reject_b_id = @reject_b, reject_c_id = @reject_c, reject_d_id = @reject_d
      where mchid = (select machine_id from IoT.dbo.hourly_uv where id = @hourlyId)
  `
  return await queryDatabase(sqlQuery, {
    hourlyId,
    reject_a,
    reject_b,
    reject_c,
    reject_d,
  })
}

export async function editProcess(hourlyId: number, process: string) {
   const mchQuery = `SELECT machine_id FROM IoT.dbo.hourly_uv WHERE id = @hourlyId`
  const mchResult = await queryDatabase(mchQuery, { hourlyId })
  const MchID = mchResult[0]?.machine_id
  const sqlQuery = `
  UPDATE IoT.dbo.hourly_uv
      SET process = @process
      WHERE id = @hourlyId;
      
  UPDATE IoT.dbo.Reject_Machine_Relationship
      set process = @process
      where mchid = (select machine_id from IoT.dbo.hourly_uv where id = @hourlyId)

  INSERT INTO IoT.dbo.UvProcessTrx (hourly_id, process, created_at, MchID)
  SELECT @hourlyId, @process, GETDATE(), machine_id
  FROM IoT.dbo.hourly_uv
  WHERE id = @hourlyId
  `
  try {
      const result = await queryDatabase(sqlQuery, { hourlyId, process })
    return { ...result, MchID }
  } catch (error: any) {
    console.error('Error updating process:', error)
    throw new Error(`Failed to update process: ${error.message}`)
  }
}

export async function getCoois(
  poName: string | undefined,
  type: string | undefined
) {
  const whereType =
    type === 'Metalizing, Spray Painting, Coating'
      ? "'Metalizing', 'Spray Painting', 'Coating'"
      : `'${type}'`
  const sqlQuery = `
    SELECT 
    TOP 10
        MAX(coois.Id) AS poId,
        coois.po_name AS poNumber,
        coois.material_id AS materialId,
        coois.material_name AS materialName
    FROM 
        IoT.dbo.coois
    LEFT JOIN IoT.dbo.routing ON coois.material_id = routing.material_id
    WHERE 
        ISNULL(coois.is_deleted, 0) = 0
        AND coois.po_name IS NOT NULL
        AND coois.po_name != ''
        AND coois.po_name like '%'+ @poName + '%'
        AND (routing.scheduler in (${whereType}) or routing.scheduler is null)
    GROUP BY 
        coois.po_name, coois.material_id, coois.material_name
    ORDER BY 
        poId DESC;

  `
  try {
    return await queryDatabase(sqlQuery, { poName, type })
  } catch (error: any) {
    console.error('Error getting coois:', error)
    throw new Error(`Failed to get coois: ${error.message}`)
  }
}

export async function getCooisComplete(
  poName: string | undefined,
  uploadedAt: string | null,
  page: number
) {
  const numberOfData = uploadedAt ? '' : ''
  const offset = (page - 1) * 15
  const totalItems = await queryDatabase(
    `SELECT COUNT(*) as count FROM IoT.dbo.coois WHERE po_name like '%'+ @poName + '%' AND (cast(uploaded_at as date) = cast(@uploadedAt as date) or @uploadedAt is null)`,
    { poName, uploadedAt }
  )
  const totalPages = Math.ceil(totalItems[0].count / 15)
  const sqlQuery = `
    SELECT  ${numberOfData} * FROM IoT.dbo.coois
    WHERE po_name like '%'+ @poName + '%'
    AND (cast(uploaded_at as date) = cast(@uploadedAt as date) or @uploadedAt is null)
    ORDER BY id DESC
    OFFSET ${offset} ROWS FETCH NEXT 15 ROWS ONLY
  `
  try {
    const data = await queryDatabase(sqlQuery, { poName, uploadedAt })
    return {
      data,
      totalPages,
      totalItems,
    }
  } catch (error: any) {
    console.error('Error getting coois:', error)
    throw new Error(`Failed to get coois: ${error.message}`)
  }
}
export async function getRouting(
  materialId: string | undefined,
  uploadedAt: string | null,
  page: number
) {
  // const whereType = type === 'Metalizing, Spray Painting, Coating' ? "'Metalizing', 'Spray Painting', 'Coating'" : `'${type}'`;
  const numberOfData = uploadedAt ? '' : ''
  const offset = (page - 1) * 15
  const totalItems = await queryDatabase(
    `SELECT COUNT(*) as count FROM IoT.dbo.routing WHERE material_id like '%'+ @materialId + '%' AND (cast(created_at as date) = cast(@uploadedAt as date) or @uploadedAt is null)`,
    { materialId, uploadedAt }
  )
  const totalPages = Math.ceil(totalItems[0].count / 15)
  const sqlQuery = `
    SELECT ${numberOfData} * FROM IoT.dbo.routing
    WHERE material_id like '%'+ @materialId + '%'
    AND (cast(created_at as date) = cast(@uploadedAt as date) or @uploadedAt is null)
    ORDER BY id DESC
    OFFSET ${offset} ROWS FETCH NEXT 15 ROWS ONLY
  `
  // console.log(sqlQuery)
  // console.log(uploadedAt)
  try {
    const data = await queryDatabase(sqlQuery, { materialId, uploadedAt })
    return {
      data,
      totalPages,
      totalItems,
    }
  } catch (error: any) {
    console.error('Error getting coois:', error)
    throw new Error(`Failed to get coois: ${error.message}`)
  }
}

export async function attachPo(poName: string, machineName: string) {
  const sqlQuery = `
  DECLARE
    @materialId VARCHAR(50),
    @machineDesc NVARCHAR(255),
    @errorMessage NVARCHAR(MAX),
    @taskId INT;

  DECLARE @InsertedIds TABLE (id INT);

  SELECT TOP 1
    @materialId = c.material_id
  FROM IoT.dbo.coois c
  WHERE c.po_name = @poName
  ORDER BY c.id DESC;

  SELECT TOP 1
    @machineDesc = m.MchDesc
  FROM IoT.dbo.MachineMST m
  WHERE m.MchID = @machineName;

  IF @machineDesc IS NULL
  BEGIN
    RAISERROR ('Machine not found by MchID: %s', 16, 1, @machineName);
    RETURN;
  END

  IF EXISTS (SELECT 1 FROM IoT.dbo.routing WHERE material_id = @materialId)
  BEGIN
    BEGIN TRY
      BEGIN TRANSACTION;

      INSERT INTO IoT.dbo.countboard_tasks
        (po_name, machine_name, required_qty, produced_qty, cvt, ct, actual_cvt, actual_ct, created_at, updated_at, mchId, material_name)
        OUTPUT INSERTED.id INTO @InsertedIds
      SELECT TOP 1
        @poName,
        @machineDesc,
        CAST(coois.required_qty AS INT),
        CAST(coois.produced_qty AS INT),
        routing.cvt,
        routing.ct,
        routing.cvt AS actual_cvt,
        routing.ct AS actual_ct,
        GETDATE(),
        GETDATE(),
        @machineName,
        coois.material_name
      FROM IoT.dbo.coois
      JOIN IoT.dbo.routing ON coois.material_id = routing.material_id
      WHERE coois.po_name = @poName
      ORDER BY coois.id DESC;

      SELECT TOP 1 @taskId = id FROM @InsertedIds;

      IF @taskId IS NULL
      BEGIN
        RAISERROR ('Failed to insert countboard task for PO: %s', 16, 1, @poName);
      END

      INSERT INTO IoT.dbo.DailymoldTRX (
        created_at,
        task_id,
        machine_id,
        mold_id,
        mold_name,
        material_id,
        material_name,
        daily_shoot,
        statusCILT,
        note,
        updated_at
      )
      SELECT
        CAST(GETDATE() AS DATE),
        @taskId,
        mch.MchID,
        mo.mold_id,
        mo.mold_name,
        coois.material_id,
        coois.material_name,
        0,
        NULL,
        NULL,
        GETDATE()
      FROM IoT.dbo.coois
      JOIN IoT.dbo.routing ro ON coois.material_id = ro.material_id
      JOIN IoT.dbo.MoldMST mo ON mo.mold_id = ro.mold_id
      JOIN IoT.dbo.MachineMST mch ON mch.MchID = @machineName
      WHERE
        coois.po_name = @poName
        AND mch.MchProcess = 'INJECTION'
        AND NOT EXISTS (
          SELECT 1
          FROM IoT.dbo.DailymoldTRX d
          WHERE d.task_id = @taskId
            AND d.mold_id = mo.mold_id
            AND CAST(d.created_at AS DATE) = CAST(GETDATE() AS DATE)
        );

      COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
      IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
      THROW;
    END CATCH
  END
  ELSE
  BEGIN
    SET @errorMessage = 'Routing not found for material number : ' + @materialId + ' , please sync Routing !';
    RAISERROR (@errorMessage, 16, 1);
  END
  `
  try {
    return await queryDatabase(sqlQuery, { poName, machineName })
  } catch (error: any) {
    console.error('Error attaching PO:', error)
    throw new Error(`Failed to attach PO: ${error.message}`)
  }
}
// menambahkan untuk ticketdate dan actual finish
// menambahkan get ticket untuk fill start tiket dan finish ketika hijau
// Menggunakan view yang sudah meng-convert datetime ke varchar agar aman untuk driver SQL.
// Jika terjadi error (misalnya masalah tipe data), untuk saat ini kita kembalikan array kosong
// supaya tidak menjatuhkan halaman utama.
export async function getTickets() {
  // NOTE:
  // Saat ini query ke SQL Server untuk view vw_TicketTRX_ForDashboard
  // memicu error driver `tedious` ("Unknown type: 48"), yang sifatnya
  // low‑level di protokol TDS dan di luar kontrol query biasa.
  // Untuk mencegah backend crash sementara, endpoint ini dikembalikan
  // sebagai stub kosong sampai driver/konfigurasi SQL diperbaiki.
  //
  // Begitu masalah driver sudah beres, blok di bawah bisa diaktifkan lagi:
  //
  // const sqlQuery = `
  //   SELECT
  //     TicketDate,
  //     ActualFinish
  //   FROM dbo.vw_TicketTRX_ForDashboard
  //   ORDER BY TicketDate DESC
  // `;
  // try {
  //   return await queryDatabase(sqlQuery);
  // } catch (error) {
  //   console.error('Error getting tickets from vw_TicketTRX_ForDashboard:', error);
  //   return [];
  // }

  return []
}
export async function getTicketByEskalasi(fromDate?: string, toDate?: string) {
  let sqlQuery = `
    SELECT
   CONVERT(varchar, t.TicketDate, 120) AS TicketDate,
     t.MchID,
     m.MchNumber,
     m.MchLoc,
     t.Problem,
     t.ActionPlan,
     t.AssignToDept,
     t.Message,
     t.EskalasiStatus,
     t.EskalasiFlag,
     t.ActualSubmit,
     t.ActualEskalasiFinish
   FROM IoT.dbo.TicketTRX t
   LEFT JOIN IoT.dbo.MachineMST m
     ON t.MchID = m.MchID
   WHERE t.EskalasiFlag = 1 and t.Active = 1
  `

  const params: Record<string, any> = {}

  if (fromDate && toDate) {
    sqlQuery += `
      AND t.TicketDate >= @fromDate
      AND t.TicketDate < DATEADD(DAY, 1, @toDate)
    `
    params.fromDate = fromDate
    params.toDate = toDate
  }

  sqlQuery += ` ORDER BY t.TicketDate ASC`

  return await queryDatabase(sqlQuery, params)
}

export async function updateTicketEskalasi(
  mchId: string,
  ticketDate: string,
  message: string,
  eskalasiStatus: 'open' | 'close' | 'status'
) {
  const sqlQuery = `
  UPDATE iot.dbo.TicketTRX
  SET 
    Message = @message,
    EskalasiStatus = @eskalasiStatus,
    ActualEskalasiFinish = CASE
      WHEN LOWER(@eskalasiStatus) = 'close'
      THEN SYSDATETIME()
      ELSE ActualEskalasiFinish
    END
  WHERE MchID = @mchId
    AND TicketDate = @ticketDate
  `

  return await queryDatabase(sqlQuery, {
    mchId,
    ticketDate,
    message,
    eskalasiStatus,
  })
}

// NOTE: versi tanpa ticketId (fallback berdasarkan MchID + ORANGE + tanggal terdekat)
export async function submitOrangeTicket(
  machineId: string,
  ticketDate: string,
  categoryId: string | null,
  problem: string,
  actionPlan: string,
  assignToId: string,
  assignById: string,
  eskalasiFlag: 0 | 1,
  eskalasiDept: string | null,
  ticketColorId: 'ORANGE' | 'RED' | null = null
) {
  const sqlQuery = `
    DECLARE @ticketDateParam DATETIME2(0) = CAST(@ticketDate AS DATETIME2(0));

    DECLARE @AssignToUserName NVARCHAR(100);
    DECLARE @FinalAssignToDept NVARCHAR(100);
    DECLARE @AssignByUserName NVARCHAR(100);
    DECLARE @EskalasiStatus NVARCHAR(20);
    DECLARE @ResolvedColorID NVARCHAR(20);
    DECLARE @IsNonQualityOrScrap BIT = 0;

    SELECT @AssignToUserName = UserName
    FROM IoT.dbo.useraccessmst
    WHERE UserRFID = @assignToId;

    SELECT @AssignByUserName = UserName
    FROM IoT.dbo.useraccessmst
    WHERE UserRFID = @assignById;

    SET @FinalAssignToDept =
      CASE 
        WHEN @eskalasiFlag = 1 THEN @eskalasiDept
        ELSE NULL
      END;

    -- Tentukan EskalasiStatus
    SET @EskalasiStatus =
      CASE
        WHEN @eskalasiFlag = 1 THEN 'open'
        ELSE NULL
      END;

    SET @ResolvedColorID = COALESCE(NULLIF(@ticketColorId, ''), 'ORANGE');
    IF (@categoryId IS NOT NULL)
    BEGIN
      SELECT @IsNonQualityOrScrap =
        CASE
          WHEN LOWER(pg.name) LIKE '%non quality%' OR LOWER(pg.name) LIKE '%scrap%' THEN 1
          ELSE 0
        END
      FROM IoT.dbo.problem_problem_group pg
      WHERE CAST(pg.id AS NVARCHAR(50)) = @categoryId;
    END;

    -- Khusus Non Quality/Scrap: warna ditentukan dari category (RED)
    IF (@IsNonQualityOrScrap = 1)
    BEGIN
      SET @ResolvedColorID = 'RED';
    END;

  UPDATE T
SET 
  Problem          = @problem,
  ActionPlan       = @actionPlan,
  AssignTo         = @AssignToUserName,
  AssignToDept     = @FinalAssignToDept,
  AssignBy         = @AssignByUserName,
  ColorID          = @ResolvedColorID,
  EskalasiFlag     = @eskalasiFlag,
  EskalasiStatus   = @EskalasiStatus,
  ActualSubmit     = CASE 
                       WHEN @eskalasiFlag = 1 THEN SYSDATETIME()
                       ELSE ActualSubmit
                     END
FROM (

      SELECT TOP (1) *
      FROM IoT.dbo.TicketTRX
      WHERE 
        MchID = @machineId
        AND ColorID = 'ORANGE'
        AND CAST(TicketDate AS date) = CAST(@ticketDateParam AS date)
      ORDER BY ABS(DATEDIFF(SECOND, TicketDate, @ticketDateParam))
    ) AS T;

    SELECT @@ROWCOUNT AS affected;
  `

  try {
    const result = await queryDatabase(sqlQuery, {
      machineId,
      ticketDate,
      categoryId,
      problem,
      actionPlan,
      assignToId,
      assignById,
      eskalasiFlag,
      eskalasiDept,
      ticketColorId,
    })

    return result?.[0] ?? { affected: 0 }
  } catch (error: any) {
    console.error('Error submitting orange ticket:', error)
    throw new Error(`Failed to submit ticket: ${error.message}`)
  }
}
// export async function submitOrangeTicket(
//   machineId: string,
//   ticketDate: string,
//   problem: string,
//   actionPlan: string,
//   assignToId: string,
//   assignById: string,
//   eskalasiFlag: 0 | 1,
//   eskalasiDept: string | null
// ) {
//   const sqlQuery = `
//     DECLARE @ticketDateParam DATETIME2(0) = CAST(@ticketDate AS DATETIME2(0));

//     DECLARE @AssignToUserName NVARCHAR(100);
//     DECLARE @FinalAssignToDept NVARCHAR(100);
//     DECLARE @AssignByUserName NVARCHAR(100);
//     DECLARE @EskalasiStatus NVARCHAR(20);

//     SELECT @AssignToUserName = UserName
//     FROM IoT.dbo.useraccessmst
//     WHERE UserRFID = @assignToId;

//     SELECT @AssignByUserName = UserName
//     FROM IoT.dbo.useraccessmst
//     WHERE UserRFID = @assignById;

//     SET @FinalAssignToDept =
//       CASE 
//         WHEN @eskalasiFlag = 1 THEN @eskalasiDept
//         ELSE NULL
//       END;

//     -- Tentukan EskalasiStatus
//     SET @EskalasiStatus =
//       CASE
//         WHEN @eskalasiFlag = 1 THEN 'open'
//         ELSE NULL
//       END;

//   UPDATE T
// SET 
//   Problem          = @problem,
//   ActionPlan       = @actionPlan,
//   AssignTo         = @AssignToUserName,
//   AssignToDept     = @FinalAssignToDept,
//   AssignBy         = @AssignByUserName,
//   EskalasiFlag     = @eskalasiFlag,
//   EskalasiStatus   = @EskalasiStatus,
//   ActualSubmit     = CASE 
//                        WHEN @eskalasiFlag = 1 THEN SYSDATETIME()
//                        ELSE ActualSubmit
//                      END
// FROM (

//       SELECT TOP (1) *
//       FROM IoT.dbo.TicketTRX
//       WHERE 
//         MchID = @machineId
//         AND ColorID = 'ORANGE'
//         AND CAST(TicketDate AS date) = CAST(@ticketDateParam AS date)
//       ORDER BY ABS(DATEDIFF(SECOND, TicketDate, @ticketDateParam))
//     ) AS T;

//     SELECT @@ROWCOUNT AS affected;
//   `

//   try {
//     const result = await queryDatabase(sqlQuery, {
//       machineId,
//       ticketDate,
//       problem,
//       actionPlan,
//       assignToId,
//       assignById,
//       eskalasiFlag,
//       eskalasiDept,
//     })

//     return result?.[0] ?? { affected: 0 }
//   } catch (error: any) {
//     console.error('Error submitting orange ticket:', error)
//     throw new Error(`Failed to submit ticket: ${error.message}`)
//   }
// }

// export async function submitOrangeTicket(
//     machineId: string,
//     ticketDate: string,
//     problem: string,
//     actionPlan: string,
//   ) {
//     const sqlQuery = `
//       DECLARE @ticketDateParam DATETIME2(0) = CAST(@ticketDate AS DATETIME2(0));

//       UPDATE T
//       SET
//         Problem = @problem,
//         ActionPlan = @actionPlan
//       FROM (
//         SELECT TOP (1) *
//         FROM IoT.dbo.TicketTRX
//         WHERE
//           MchID = @machineId
//           AND ColorID = 'ORANGE'
//           AND CAST(TicketDate AS date) = CAST(@ticketDateParam AS date)
//         ORDER BY ABS(DATEDIFF(SECOND, TicketDate, @ticketDateParam))
//       ) AS T;

//     SELECT @@ROWCOUNT AS affected;
//   `;

//   try {
//     const result = await queryDatabase(sqlQuery, {
//       machineId,
//       ticketDate,
//       problem,
//       actionPlan,
//     });
//     return result?.[0] ?? { affected: 0 };
//   } catch (error: any) {
//     console.error('Error submitting orange ticket:', error);
//     throw new Error(`Failed to submit ticket: ${error.message}`);
//   }
// }

export async function updateCVT(taskId: number, newCvt: number) {
  const sqlQuery = `
    UPDATE IoT.dbo.countboard_tasks 
        SET actual_cvt = @newCvt,
            updated_at = getdate()
        WHERE id = @taskId;
    `
  try {
    return await queryDatabase(sqlQuery, { taskId, newCvt })
  } catch (error) {
    console.error('Error updating CVT:', error)
    throw new Error('Failed to update CVT')
  }
}

export async function updateComment(
  hourlyId: number,
  type: string,
  content: string,
  uap: string | null
) {
  if (uap == 'uv') {
    const sqlQuery = `
    IF (@type = 'causes')
    BEGIN
    UPDATE IoT.dbo.hourly_uv
        SET cause = @content
        WHERE id = @hourlyId;
    END
    ELSE IF (@type = 'comments')
    BEGIN
    UPDATE IoT.dbo.hourly_uv
        SET note = @content
        WHERE id = @hourlyId;
    END
    `
    try {
      return await queryDatabase(sqlQuery, { hourlyId, type, content })
    } catch (error: any) {
      console.error('Error updating comment:', error)
      throw new Error(`Failed to update comment: ${error.message}`)
    }
  } else {
    const sqlQuery = `
    IF (@type = 'causes')
    BEGIN
    UPDATE IoT.dbo.hourly 
        SET cause = @content
        WHERE id = @hourlyId;
    END
    ELSE IF (@type = 'comments')
    BEGIN
    UPDATE IoT.dbo.hourly 
        SET note = @content
        WHERE id = @hourlyId;
    END
    `
    try {
      return await queryDatabase(sqlQuery, { hourlyId, type, content })
    } catch (error: any) {
      console.error('Error updating comment:', error)
      throw new Error(`Failed to update comment: ${error.message}`)
    }
  }
}
export const getLostTime = async (fromDate: Date, toDate: Date) => {
  const query = `
    ;WITH InjectionMachines AS (
      SELECT M.MchID
      FROM iot.dbo.MachineMST M
      WHERE M.Active = 1
        AND M.MchProcess = 'INJECTION'
    ),
    LatestMachineStatus AS (
      SELECT
        S.MchID,
        S.StatusDate,
        S.StatusLight,
        ROW_NUMBER() OVER (
          PARTITION BY S.MchID
          ORDER BY S.StatusDate DESC
        ) AS rn
      FROM MchStatusTRX S
      INNER JOIN InjectionMachines IM
        ON S.MchID = IM.MchID
      WHERE S.MchID <> ''
        AND S.StatusDate >= @fromDate
        AND S.StatusDate < @toDate
    )
    SELECT
      LS.StatusDate,
      DATEDIFF(MINUTE, LS.StatusDate, GETDATE()) AS DuraMin,
      LS.MchID,
      M.MchLoc,
      M.MchNumber,
      M.Brand,
      M.MchTon,
      (M.MchLoc + '-' + M.MchNumber) AS Location
    FROM LatestMachineStatus LS
    INNER JOIN iot.dbo.MachineMST M
      ON LS.MchID = M.MchID
    WHERE
      LS.rn = 1
      AND LS.StatusLight = 'ORANGE'
    ORDER BY M.MchLoc
  `

  const result = await queryDatabase(query, { fromDate, toDate })
  return result
}
export const getProblem = async (fromDate: Date, toDate: Date) => {
  const query = `
    ;WITH InjectionMachines AS (
      SELECT M.MchID
      FROM iot.dbo.MachineMST M
      WHERE M.Active = 1
        AND M.MchProcess = 'INJECTION'
    ),
    LatestMachineStatus AS (
      SELECT
        S.MchID,
        S.StatusDate,
        S.StatusLight,
        ROW_NUMBER() OVER (
          PARTITION BY S.MchID
          ORDER BY S.StatusDate DESC
        ) AS rn
      FROM MchStatusTRX S
      INNER JOIN InjectionMachines IM
        ON S.MchID = IM.MchID
      WHERE S.MchID <> ''
        AND S.StatusDate >= @fromDate
        AND S.StatusDate < @toDate
    ),
    LatestOrangeMachines AS (
      SELECT
        LS.MchID,
        LS.StatusDate AS LatestStatusDate
      FROM LatestMachineStatus LS
      WHERE LS.rn = 1
        AND LS.StatusLight = 'ORANGE'
    ),
    FilteredTickets AS (
      SELECT
        X.MchID,
        X.Problem,
        X.ActionPlan,
        X.TicketStatus,
        X.EskalasiStatus,
        X.Message,
        COALESCE(X.TicketDate, LOM.LatestStatusDate) AS TicketDate,
        M.MchLoc,
        M.MchNumber,
        M.Brand,
        M.MchTon,
        ROW_NUMBER() OVER (
          PARTITION BY X.MchID, UPPER(LTRIM(RTRIM(X.TicketStatus)))
          ORDER BY COALESCE(X.TicketDate, LOM.LatestStatusDate) DESC
        ) AS rnMachineStatus
      FROM TicketTRX X
      INNER JOIN InjectionMachines IM
        ON X.MchID = IM.MchID
      INNER JOIN LatestOrangeMachines LOM
        ON X.MchID = LOM.MchID
      INNER JOIN iot.dbo.MachineMST M
        ON X.MchID = M.MchID
      WHERE
        X.TicketDate >= @fromDate
        AND X.TicketDate < @toDate
        AND X.TicketStatus IN ('NEW','ESKALASI','ONPROG','ASSIGNED','OPEN')
        AND X.ColorID = 'ORANGE'
        AND X.Active = 1
    )
    SELECT
      X.MchID,
      X.Problem,
      X.ActionPlan,
      X.TicketDate,
      PG.name AS Type,
      PT.name AS Action,
      PT.pic,
      X.TicketStatus,
      X.EskalasiStatus,
      X.Message,
      LTRIM(RTRIM(X.MchLoc)) AS MchLoc,
      LTRIM(RTRIM(X.MchNumber)) AS MchNumber,
      X.Brand,
      X.MchTon,
      (LTRIM(RTRIM(X.MchLoc)) + '-' + LTRIM(RTRIM(X.MchNumber))) AS Location
    FROM FilteredTickets X
    LEFT JOIN problem_problem PP
      ON X.Problem = PP.name
      AND PP.color = 'ORANGE'
      AND PP.process = 'INJECTION'
    LEFT JOIN problem_problem_group PG
      ON PP.problem_group_id = PG.id
    OUTER APPLY (
      SELECT TOP 1
        T.name,
        T.pic
      FROM problem_todo T
      WHERE T.problem_id = PP.id
        AND T.name = X.ActionPlan
      ORDER BY T.id DESC
    ) PT
    WHERE
      X.rnMachineStatus = 1
  `

  const result = await queryDatabase(query, { fromDate, toDate })
  return result
}

export const getProblemStatusCount = async (fromDate: Date, toDate: Date) => {
  const query = `
    ;WITH InjectionMachines AS (
      SELECT M.MchID
      FROM iot.dbo.MachineMST M
      WHERE M.Active = 1
        AND M.MchProcess = 'INJECTION'
    ),
    LatestMachineStatus AS (
      SELECT
        S.MchID,
        S.StatusLight,
        ROW_NUMBER() OVER (
          PARTITION BY S.MchID
          ORDER BY S.StatusDate DESC
        ) AS rn
      FROM MchStatusTRX S
      INNER JOIN InjectionMachines IM
        ON S.MchID = IM.MchID
      WHERE S.MchID <> ''
        AND S.StatusDate >= @fromDate
        AND S.StatusDate < @toDate
    ),
    LatestOrangeMachines AS (
      SELECT LS.MchID
      FROM LatestMachineStatus LS
      WHERE LS.rn = 1
        AND LS.StatusLight = 'ORANGE'
    )
    SELECT
      UPPER(LTRIM(RTRIM(X.TicketStatus))) AS TicketStatus,
      COUNT(1) AS Total
    FROM TicketTRX X
    INNER JOIN LatestOrangeMachines LOM
      ON X.MchID = LOM.MchID
    WHERE
      X.TicketDate >= @fromDate
      AND X.TicketDate < @toDate
      AND X.TicketStatus IN ('NEW','ESKALASI','ONPROG','ASSIGNED','OPEN')
      AND X.ColorID = 'ORANGE'
      AND X.Active = 1
    GROUP BY UPPER(LTRIM(RTRIM(X.TicketStatus)))
  `

  const result = await queryDatabase(query, { fromDate, toDate })
  return result
}
