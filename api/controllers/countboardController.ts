import { queryDatabase } from '../utils/queryDatabase';


export async function getRejectLists() {
  const sqlQuery = `
SELECT id, name from RejectMST where active = 1
  `;
  return await queryDatabase(sqlQuery);
}

export async function addRouting(data: any[][]) {
    const validData = data.slice(1).filter((row) => {
      const [Scheduler, , MRPController, OldMaterialNo, Material, MaterialDescription, GrC, BaseQuantity, Un1, Un2, OpAc, WorkCtr, WorkCenterDescription, Machine, Unit1, Labor, Unit2, NoEmpl, CycleTime, CtrK, Cavities] = row;
  
      // Check for null or undefined values and ensure the data types are correct
      // if (
      //   !Scheduler || !Material || !MaterialDescription || !CycleTime || !Cavities ||
      //    typeof CycleTime !== 'number' || typeof Cavities !== 'number'
      // ) {
      //   return false;
      // }
  
      return true;
    });
  
    if (validData.length === 0) {
      throw new Error('Data tidak valid untuk di insert, periksa kembali');
    }

  // console.log('Backend Valid data length:', validData.length)

    // Escape single quotes by replacing ' with ''
    const escapeSingleQuote = (value: string) => value.replace(/'/g, "''");

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
      .join(", ")}
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
    `;
  
    return await queryDatabase(sqlQuery);
}



export async function addCoois(data: any[][]) {
  const validData = data.slice(1).filter((row) => {
    const [po_number, so_item, , type, pn, produk, order_qty, hasil_qty, minus_qty] = row;

    // Check for null or undefined values and ensure the data types are correct
    if (
      !po_number || !pn || !produk ||
      typeof order_qty !== 'number' || typeof hasil_qty !== 'number' || typeof minus_qty !== 'number'
    ) {
      return false;
    }

    return true;
  });

  if (validData.length === 0) {
    throw new Error('Data tidak valid untuk di insert, periksa kembali');
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
          .join(", ")}
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
  `;

  try {
    return await queryDatabase(sqlQuery);
  } catch (error: any) {
    console.error('Error inserting coois data:', error);
    throw new Error(`Failed to insert coois data: ${error.message}`);
  }
}


export async function editTopScrap(hourlyId: number, reject_a : number, reject_b: number, reject_c: number, reject_d: number) {
  const sqlQuery = `

  UPDATE IoT.dbo.hourly_uv
      SET reject_a_id = @reject_a, reject_b_id = @reject_b, reject_c_id = @reject_c, reject_d_id = @reject_d
      WHERE id = @hourlyId;
  UPDATE IoT.dbo.Reject_Machine_Relationship
      set reject_a_id = @reject_a, reject_b_id = @reject_b, reject_c_id = @reject_c, reject_d_id = @reject_d
      where mchid = (select machine_id from IoT.dbo.hourly_uv where id = @hourlyId)
  `;
  return await queryDatabase(sqlQuery, { hourlyId, reject_a, reject_b, reject_c, reject_d });
}


export async function editProcess(hourlyId: number, process: string) {
  const sqlQuery = `
  UPDATE IoT.dbo.hourly_uv
      SET process = @process
      WHERE id = @hourlyId;
      
  UPDATE IoT.dbo.Reject_Machine_Relationship
      set process = @process
      where mchid = (select machine_id from IoT.dbo.hourly_uv where id = @hourlyId)
  `;
  try {
    return await queryDatabase(sqlQuery, { hourlyId, process });
  } catch (error: any) {
    console.error('Error updating process:', error);
    throw new Error(`Failed to update process: ${error.message}`);
  }
}



export async function getCoois(poName: string | undefined, type: string | undefined) {
  const whereType = type === 'Metalizing, Spray Painting, Coating' ? "'Metalizing', 'Spray Painting', 'Coating'" : `'${type}'`;
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

  `;
  try {
    return await queryDatabase(sqlQuery, { poName, type });
  } catch (error: any) {
    console.error('Error getting coois:', error);
    throw new Error(`Failed to get coois: ${error.message}`);
  }
}

export async function attachPo(poName: string, machineName: string) {
  const sqlQuery = `
  
  DECLARE 
  @materialId varchar(50),
  @errorMessage NVARCHAR(MAX);

  select @materialId = material_id from IoT.dbo.coois where po_name = @poName

  IF EXISTS (select 1 from IoT.dbo.routing where material_id = @materialId)
  BEGIN
    INSERT INTO IoT.dbo.countboard_tasks 
        (po_name, machine_name, required_qty, produced_qty, cvt, ct, actual_cvt, actual_ct, created_at, updated_at)
        SELECT top 1 
            @poName,
            (select top 1 MchDesc from IoT.dbo.MachineMST where MchID = @machineName),
            cast(coois.required_qty as int),
            cast(coois.produced_qty as int),
            routing.cvt,
            routing.ct,
            routing.cvt AS actual_cvt,
            routing.ct AS actual_ct,
            getdate(),
            getdate()
        FROM 
            IoT.dbo.coois
        JOIN 
            IoT.dbo.routing ON coois.material_id = routing.material_id
        WHERE 
            coois.po_name = @poName
        order by coois.id desc;
  END
  ELSE 
  BEGIN
    SET @errorMessage = 'Routing not found for material number : ' +  @materialId + ' , please sync Routing !'
        
      RAISERROR (@errorMessage, 16, 1);
  END
  `;
  try {
    return await queryDatabase(sqlQuery, { poName, machineName });
  } catch (error: any) {
    console.error('Error attaching PO:', error);
    throw new Error(`Failed to attach PO: ${error.message}`);
  }
}

export async function updateCVT(taskId: number, newCvt: number) {
    const sqlQuery = `
    UPDATE IoT.dbo.countboard_tasks 
        SET actual_cvt = @newCvt,
            updated_at = getdate()
        WHERE id = @taskId;
    `;
  try {
    return await queryDatabase(sqlQuery, { taskId, newCvt });
  } catch (error) {
    console.error('Error updating CVT:', error);
    throw new Error('Failed to update CVT');
  }
  }

  export async function updateComment(hourlyId: number, type: string, content: string, uap: string | null) {
    if (uap == "uv") {
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
    `;
      try {
        return await queryDatabase(sqlQuery, { hourlyId, type, content });
      } catch (error: any) {
        console.error('Error updating comment:', error);
        throw new Error(`Failed to update comment: ${error.message}`);
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
    `;
      try {
        return await queryDatabase(sqlQuery, { hourlyId, type, content });
      } catch (error: any) {
        console.error('Error updating comment:', error);
        throw new Error(`Failed to update comment: ${error.message}`);
      }
    }    
  }

