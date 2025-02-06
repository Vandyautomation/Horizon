import { queryDatabase } from '../utils/queryDatabase';

export async function getCoois(poName: string|undefined) {
  const sqlQuery = `
    SELECT 
    TOP 10
        MAX(Id) AS poId, 
        po_name AS poNumber
    FROM 
        IoT.dbo.coois
    WHERE 
        ISNULL(is_deleted, 0) = 0  
        AND po_name IS NOT NULL 
        AND po_name != ''
        AND po_name like '%'+ @poName + '%'
    GROUP BY 
        po_name
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

  export async function updateComment(hourlyId: number, type: string, content: string) {
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

