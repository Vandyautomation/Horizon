/*
  Countboard query tuning indexes (SQL Server)
  Target endpoints:
    - /api/countboards/lost-time
    - /api/countboards/problem

  Usage:
    1) Connect to SQL Server with access to database [IoT]
    2) Run this script once
*/

USE [IoT];
GO

SET NOCOUNT ON;
GO

/* 1) Latest machine status lookup: PARTITION BY MchID ORDER BY StatusDate DESC */
IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = 'IX_MchStatusTRX_MchID_StatusDate'
    AND object_id = OBJECT_ID('dbo.MchStatusTRX')
)
BEGIN
  CREATE NONCLUSTERED INDEX IX_MchStatusTRX_MchID_StatusDate
  ON dbo.MchStatusTRX (MchID ASC, StatusDate DESC)
  INCLUDE (StatusLight);
END
GO

/* 2) Injection machine pre-filter and projected columns */
IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = 'IX_MachineMST_Active_Process_MchID'
    AND object_id = OBJECT_ID('dbo.MachineMST')
)
BEGIN
  CREATE NONCLUSTERED INDEX IX_MachineMST_Active_Process_MchID
  ON dbo.MachineMST (Active ASC, MchProcess ASC, MchID ASC)
  INCLUDE (MchLoc, MchNumber, Brand, MchTon);
END
GO

/* 3) Open ORANGE ticket filtering + machine join */
IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = 'IX_TicketTRX_Filter_Machine'
    AND object_id = OBJECT_ID('dbo.TicketTRX')
)
BEGIN
  CREATE NONCLUSTERED INDEX IX_TicketTRX_Filter_Machine
  ON dbo.TicketTRX (ColorID ASC, Active ASC, TicketStatus ASC, MchID ASC)
  INCLUDE (Problem, ActionPlan, Message);
END
GO

/* 4) Problem master join: X.Problem -> problem_problem.name with color/process filters */
IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = 'IX_problem_problem_name_color_process'
    AND object_id = OBJECT_ID('dbo.problem_problem')
)
BEGIN
  CREATE NONCLUSTERED INDEX IX_problem_problem_name_color_process
  ON dbo.problem_problem (name ASC, color ASC, process ASC)
  INCLUDE (id, problem_group_id);
END
GO

/* 5) Action plan mapping: problem_todo lookup by problem_id + action name */
IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = 'IX_problem_todo_problemid_name'
    AND object_id = OBJECT_ID('dbo.problem_todo')
)
BEGIN
  CREATE NONCLUSTERED INDEX IX_problem_todo_problemid_name
  ON dbo.problem_todo (problem_id ASC, name ASC)
  INCLUDE (pic);
END
GO

PRINT 'Countboard index optimization script finished.';
GO
