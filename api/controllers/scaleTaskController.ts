import { queryDatabase } from '../utils/queryDatabase';

export async function getTask() {
  const sqlQuery = `
  SELECT st.id as taskId, st.po_name as poNumber, st.material_id as materialNumber,
  st.status, total_consumption as totalConsumption, st.created_at as createdDate, 
  sa.name as scaleAsset
  FROM scale_tasks st
  JOIN scale_assets sa on sa.id = st.scale_asset_id
  where st.deleted_at is null
  `;
  return await queryDatabase(sqlQuery);
}

export async function getTaskDetail(taskId:number) {
  const sqlQuery = `
  WITH ConsumptionCTE AS (
    SELECT 
        sm.task_id,
        sm.scale_asset_id,
        sm.weight,
        LAG(sm.weight) OVER (PARTITION BY sm.task_id ORDER BY sm.created_at) AS prev_weight
    FROM 
        scale_measurements sm
    WHERE 
        sm.task_id = @taskId 
        AND sm.deleted_at IS NULL
)
SELECT 
    st.id AS taskId, 
    st.po_name AS poNumber, 
    st.material_id AS materialNumber,
    st.status, 
    SUM(CASE 
            WHEN ConsumptionCTE.weight < ConsumptionCTE.prev_weight 
            THEN ConsumptionCTE.prev_weight - ConsumptionCTE.weight 
            ELSE 0 
        END) AS totalConsumption,
    st.created_at AS createdDate, 
    sa.name AS scaleAsset
FROM 
    scale_tasks st
LEFT JOIN 
    ConsumptionCTE ON ConsumptionCTE.task_id = st.id
JOIN 
    scale_assets sa ON sa.id = st.scale_asset_id 
WHERE 
    st.id = @taskId 
    AND st.deleted_at IS NULL 
GROUP BY 
    st.id, st.po_name, st.material_id, st.status, st.created_at, sa.name;
  `;
  return await queryDatabase(sqlQuery, {taskId});
}

export async function getTaskTransaction(taskId:number) {
  const sqlQuery = `SELECT id, task_id, type, created_at from scale_transaction where task_id = @taskId and deleted_at is null
  `;
  return await queryDatabase(sqlQuery, {taskId});
}




export async function getPo() {
  const sqlQuery = `select po_name as poNumbers from PO_master_data_SCM`
  return await queryDatabase(sqlQuery);
}

export async function getScaleAsset() {
  const sqlQuery = `select name as scaleAssetsName, id as scaleAssetId from scale_assets`
  return await queryDatabase(sqlQuery); 
}

export async function addTask(poNumber: string, scaleAssetId: number) {
  const sqlQuery = `
  DECLARE @errorMessage NVARCHAR(100);

  IF EXISTS (select 1 from scale_tasks where po_name = @poNumber)
  begin
    SET @errorMessage = 'Task with PO = ' + @poNumber + ', is already exists';
        
    RAISERROR (@errorMessage, 16, 1);
  end
  else
  begin
  INSERT INTO scale_tasks (po_name, scale_asset_id, material_id, status, created_at) 
  VALUES (@poNumber, @scaleAssetId,
  (select top 1  material_id from PO_master_data_SCM where po_name = @poNumber)
  , 'NEW', getDate())
  end
  `;
  try{
    return await queryDatabase(sqlQuery, { poNumber, scaleAssetId });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to add task');
  }
}

export async function startTask(taskId: number) {
  const sqlQuery = `
  DECLARE @scaleAssetId INT;
  DECLARE @poNumber varchar(50);
  DECLARE @errorMessage NVARCHAR(100);

  SET @scaleAssetId = (SELECT scale_asset_id FROM scale_tasks WHERE id = @taskId);

  IF EXISTS (
      SELECT 1
      FROM IoT_APP.dbo.scale_tasks 
      WHERE scale_asset_id = @scaleAssetId 
        AND status = 'RUN' 
        AND deleted_at IS NULL
  )
  BEGIN
    set @poNumber = (SELECT po_name
      FROM IoT_APP.dbo.scale_tasks 
      WHERE scale_asset_id = @scaleAssetId 
        AND status = 'RUN' 
        AND deleted_at IS NULL);
      SET @errorMessage = (select name from scale_assets where id = @scaleAssetId) + ' is currently running PO = ' + @poNumber;
        
      RAISERROR (@errorMessage, 16, 1);
  END
  ELSE
  BEGIN
      UPDATE scale_tasks 
      SET status = 'RUN', modified_at = GETDATE() 
      WHERE id = @taskId;
    
      INSERT INTO scale_transaction (task_id, type, created_at) 
      VALUES (@taskId, 'RUN', GETDATE());
  END
  `;
  try {
    return await queryDatabase(sqlQuery, { taskId });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to start task');
  }
}

export async function pauseTask(taskId: number) {
  const sqlQuery = `
  UPDATE scale_tasks SET status = 'PAUSE', modified_at = getdate() where id = @taskId
  
  INSERT INTO scale_transaction (task_id, type, created_at) VALUES (
  @taskId, 'PAUSE', getdate()
  )`;
  return await queryDatabase(sqlQuery, { taskId });
}

export async function stopTask(taskId: number) {
  const sqlQuery = `
  UPDATE scale_tasks SET status = 'COMPLETE', modified_at = getdate() where id = @taskId
  
  INSERT INTO scale_transaction (task_id, type, created_at) VALUES (
  @taskId, 'COMPLETE', getdate()
  )`;
  return await queryDatabase(sqlQuery, { taskId });
}