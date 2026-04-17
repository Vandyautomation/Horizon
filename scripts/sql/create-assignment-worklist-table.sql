/*
  Create empty worklist table for assignment flow.
  Header target (UI):
    Material_Id | Quantity | Timestamp | Machine_Id | Order | Assignby | AssignTo | Status

  Usage:
    1) Connect to SQL Server and database [IoT]
    2) Run this script once
*/

USE [IoT];
GO

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.assignment_worklist', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.assignment_worklist (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    material_id NVARCHAR(100) NOT NULL,
    quantity DECIMAL(18,3) NULL,
    event_timestamp DATETIME2(0) NOT NULL
      CONSTRAINT DF_assignment_worklist_event_timestamp DEFAULT SYSUTCDATETIME(),
    machine_id NVARCHAR(100) NOT NULL,
    order_no NVARCHAR(100) NULL,
    assign_by NVARCHAR(100) NULL,
    assign_to NVARCHAR(100) NULL,
    status NVARCHAR(20) NOT NULL
      CONSTRAINT DF_assignment_worklist_status DEFAULT N'Open',
    created_at DATETIME2(0) NOT NULL
      CONSTRAINT DF_assignment_worklist_created_at DEFAULT SYSUTCDATETIME(),
    modified_at DATETIME2(0) NULL
  );
END;
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.check_constraints
  WHERE name = 'CK_assignment_worklist_status'
    AND parent_object_id = OBJECT_ID(N'dbo.assignment_worklist')
)
BEGIN
  ALTER TABLE dbo.assignment_worklist
  ADD CONSTRAINT CK_assignment_worklist_status
  CHECK (status IN (N'Open', N'Close', N'On progress'));
END;
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = 'IX_assignment_worklist_machine_status_timestamp'
    AND object_id = OBJECT_ID(N'dbo.assignment_worklist')
)
BEGIN
  CREATE NONCLUSTERED INDEX IX_assignment_worklist_machine_status_timestamp
    ON dbo.assignment_worklist (machine_id ASC, status ASC, event_timestamp DESC);
END;
GO

/*
  Empty table check with UI headers:
*/
/*
SELECT
  material_id      AS Material_Id,
  quantity         AS Quantity,
  event_timestamp  AS [Timestamp],
  machine_id       AS Machine_Id,
  order_no         AS [Order],
  assign_by        AS Assignby,
  assign_to        AS AssignTo,
  status           AS [Status]
FROM dbo.assignment_worklist
ORDER BY event_timestamp DESC, id DESC;
*/
