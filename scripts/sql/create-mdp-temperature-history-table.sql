/*
  Create table for Temperature MDP history payload
  Requested shape:
    1) ID
    2) Timestamp
    3) MdpId
    4) JSON value (ID1..ID3, StateID1..StateID3, LocationID1..LocationID3, CauseID1..CauseID3, CommentID1..CommentID3)

  Usage:
    1) Connect to SQL Server instance and database [IoT]
    2) Run this script once
*/

USE [IoT];
GO

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.mdp_temperature_history', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.mdp_temperature_history (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [timestamp] DATETIME2(0) NOT NULL CONSTRAINT DF_mdp_temperature_history_timestamp DEFAULT SYSUTCDATETIME(),
    mdp_id INT NOT NULL,
    json_value NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_mdp_temperature_history_created_at DEFAULT SYSUTCDATETIME(),
    modified_at DATETIME2(0) NULL
  );
END;
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.check_constraints
  WHERE name = 'CK_mdp_temperature_history_json_value_is_json'
    AND parent_object_id = OBJECT_ID(N'dbo.mdp_temperature_history')
)
BEGIN
  ALTER TABLE dbo.mdp_temperature_history
  ADD CONSTRAINT CK_mdp_temperature_history_json_value_is_json
  CHECK (ISJSON(json_value) = 1);
END;
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = 'IX_mdp_temperature_history_mdpid_timestamp'
    AND object_id = OBJECT_ID(N'dbo.mdp_temperature_history')
)
BEGIN
  CREATE NONCLUSTERED INDEX IX_mdp_temperature_history_mdpid_timestamp
    ON dbo.mdp_temperature_history (mdp_id ASC, [timestamp] DESC);
END;
GO

/*
  Example insert payload:
*/
/*
INSERT INTO dbo.mdp_temperature_history (mdp_id, [timestamp], json_value)
VALUES (
  2,
  SYSUTCDATETIME(),
  N'{
    "ID1":"__",
    "ID2":"__",
    "ID3":"__",
    "StateID1":"__",
    "StateID2":"__",
    "StateID3":"__",
    "LocationID1":"__",
    "LocationID2":"__",
    "LocationID3":"__",
    "CauseID1":"__",
    "CauseID2":"__",
    "CauseID3":"__",
    "CommentID1":"__",
    "CommentID2":"__",
    "CommentID3":"__"
  }'
);
*/

/*
  Example select (read Cause/Comment from JSON):
*/
/*
SELECT TOP 200
  id,
  mdp_id,
  [timestamp],
  JSON_VALUE(json_value, '$.ID1') AS ID1,
  JSON_VALUE(json_value, '$.ID2') AS ID2,
  JSON_VALUE(json_value, '$.ID3') AS ID3,
  JSON_VALUE(json_value, '$.CauseID1') AS CauseID1,
  JSON_VALUE(json_value, '$.CauseID2') AS CauseID2,
  JSON_VALUE(json_value, '$.CauseID3') AS CauseID3,
  JSON_VALUE(json_value, '$.CommentID1') AS CommentID1,
  JSON_VALUE(json_value, '$.CommentID2') AS CommentID2,
  JSON_VALUE(json_value, '$.CommentID3') AS CommentID3,
  created_at,
  modified_at
FROM dbo.mdp_temperature_history
WHERE mdp_id = 2
ORDER BY [timestamp] DESC, id DESC;
*/

/*
  Example update Cause/Comment in the same row (by id):
  - Replace @RowId with row id from SELECT
  - Use block Point1 / Point2 / Point3 as needed
*/
/*
DECLARE @RowId BIGINT = 1;
DECLARE @Cause NVARCHAR(255) = N'Loose terminal connection';
DECLARE @Comment NVARCHAR(500) = N'Checked panel and tightened terminal.';

-- Point1
UPDATE dbo.mdp_temperature_history
SET
  json_value = JSON_MODIFY(
                JSON_MODIFY(json_value, '$.CauseID1', @Cause),
                '$.CommentID1', @Comment
              ),
  modified_at = SYSUTCDATETIME()
WHERE id = @RowId;

-- Point2
UPDATE dbo.mdp_temperature_history
SET
  json_value = JSON_MODIFY(
                JSON_MODIFY(json_value, '$.CauseID2', @Cause),
                '$.CommentID2', @Comment
              ),
  modified_at = SYSUTCDATETIME()
WHERE id = @RowId;

-- Point3
UPDATE dbo.mdp_temperature_history
SET
  json_value = JSON_MODIFY(
                JSON_MODIFY(json_value, '$.CauseID3', @Cause),
                '$.CommentID3', @Comment
              ),
  modified_at = SYSUTCDATETIME()
WHERE id = @RowId;
*/

/*
  Example dynamic update by "History ID" (1/2/3):
  - History ID 1 => CauseID1, CommentID1
  - History ID 2 => CauseID2, CommentID2
  - History ID 3 => CauseID3, CommentID3
*/
/*
DECLARE @RowId BIGINT = 12;            -- row id in table
DECLARE @HistoryId INT = 1;            -- from UI (History ID)
DECLARE @Cause NVARCHAR(255) = N'Overheat';
DECLARE @Comment NVARCHAR(500) = N'Cooling fan checked and cleaned';

IF @HistoryId NOT IN (1,2,3)
BEGIN
  THROW 50001, 'History ID must be 1, 2, or 3.', 1;
END;

UPDATE dbo.mdp_temperature_history
SET
  json_value = CASE
    WHEN @HistoryId = 1 THEN JSON_MODIFY(JSON_MODIFY(json_value, '$.CauseID1', @Cause), '$.CommentID1', @Comment)
    WHEN @HistoryId = 2 THEN JSON_MODIFY(JSON_MODIFY(json_value, '$.CauseID2', @Cause), '$.CommentID2', @Comment)
    WHEN @HistoryId = 3 THEN JSON_MODIFY(JSON_MODIFY(json_value, '$.CauseID3', @Cause), '$.CommentID3', @Comment)
    ELSE json_value
  END,
  modified_at = SYSUTCDATETIME()
WHERE id = @RowId;
*/
