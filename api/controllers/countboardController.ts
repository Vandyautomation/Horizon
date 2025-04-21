import { queryDatabase } from '../utils/queryDatabase';


export async function getRejectLists() {
  const sqlQuery = `
SELECT id, name from RejectMST where active = 1
  `;
  return await queryDatabase(sqlQuery);
}

export async function addRouting(data: any[][]) {
    const validData = data.slice(1).filter((row) => {
      const [Material, MaterialDescription, GrC, BaseQuantity, Un1, Un2, OpAc, WorkCtr, WorkCenterDescription, Machine, Unit1, Labor, Unit2, NoEmpl, CycleTime, CtrK, Cavities] = row;
  
      // Check for null or undefined values and ensure the data types are correct
      if (
        !Material || !MaterialDescription  || !CycleTime || !Cavities ||
         typeof CycleTime !== 'number' || typeof Cavities !== 'number'
      ) {
        return false;
      }
  
      return true;
    });
  
    if (validData.length === 0) {
      throw new Error('Data tidak valid untuk di insert, periksa kembali');
    }

    // Escape single quotes by replacing ' with ''
    const escapeSingleQuote = (value: string) => value.replace(/'/g, "''");

    const sqlQuery = `
      INSERT INTO IoT.dbo.routing (
        material_id, 
        material_name, 
        cvt,
        ct,
        created_at,
        modified_at,
        is_sync
      )
      SELECT * FROM (
        VALUES 
          ${validData
            .map(
              (row) =>
                `('${escapeSingleQuote(row[0])}', '${escapeSingleQuote(row[1])}', ${row[14]}, ${row[16]}, getdate(), getdate(), 0)`
            )
            .join(", ")}
      ) AS new_data( material_id, material_name, cvt, ct, uploaded_at, modified_at, is_sync)
      WHERE NOT EXISTS (
        SELECT 1 FROM IoT.dbo.routing WHERE material_id = new_data.material_id and isnull(is_deleted,0)=0
      )
    `;
  
    return await queryDatabase(sqlQuery);
}



export async function addCoois(data: any[][]) {
  const validData = data.slice(1).filter((row) => {
    const [po_number, so_item, , type, pn, produk, order_qty, hasil_qty, minus_qty] = row;

    // Check for null or undefined values and ensure the data types are correct
    if (
      !po_number || !so_item || !type || !pn || !produk ||
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
    INSERT INTO IoT.dbo.coois (
      po_name, 
      so_name, 
      material_id, 
      material_name, 
      required_qty, 
      produced_qty,
      uploaded_at,
      modified_at,
      is_sync
    )
    SELECT * FROM (
      VALUES 
        ${validData
          .map(
            (row) =>
              `('${row[0]}', '${row[1]}', '${row[4]}', '${row[5]}', ${row[6]}, ${row[7]}, getdate(), getdate(), 0)`
          )
          .join(", ")}
    ) AS new_data(po_name, so_item, material_id, material_name, required_qty, produced_qty, uploaded_at, modified_at, is_sync)
    WHERE NOT EXISTS (
      SELECT 1 FROM IoT.dbo.coois WHERE po_name = new_data.po_name and isnull(is_deleted,0)=0
    )
  `;

  return await queryDatabase(sqlQuery);
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
  return await queryDatabase(sqlQuery, { hourlyId, process });
}



export async function getCoois(poName: string|undefined) {
  const sqlQuery = `
    SELECT 
    TOP 10
        MAX(Id) AS poId, 
        po_name AS poNumber,
        material_id AS materialId,
        material_name AS materialName
    FROM 
        IoT.dbo.coois
    WHERE 
        ISNULL(is_deleted, 0) = 0  
        AND po_name IS NOT NULL 
        AND po_name != ''
        AND po_name like '%'+ @poName + '%'
    GROUP BY 
        po_name, material_id, material_name
    ORDER BY 
        poId DESC;

  `;
  return await queryDatabase(sqlQuery, { poName });
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
  return await queryDatabase(sqlQuery, { poName, machineName });
}

export async function updateCVT(taskId: number, newCvt: number) {
    const sqlQuery = `
    UPDATE IoT.dbo.countboard_tasks 
        SET actual_cvt = @newCvt,
            updated_at = getdate()
        WHERE id = @taskId;
    `;
    return await queryDatabase(sqlQuery, { taskId, newCvt });
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
    return await queryDatabase(sqlQuery, { hourlyId, type, content });

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
    return await queryDatabase(sqlQuery, { hourlyId, type, content });
    }    
  }

