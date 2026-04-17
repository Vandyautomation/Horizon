/*
  Create master tables for MDP cause/problem and action/comment.

  Usage:
    1) Connect to SQL Server and database [IoT]
    2) Run this script once
*/

USE [IoT];
GO

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.mdp_problem_master', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.mdp_problem_master (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    is_active BIT NOT NULL CONSTRAINT DF_mdp_problem_master_is_active DEFAULT (1),
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_mdp_problem_master_created_at DEFAULT SYSUTCDATETIME(),
    modified_at DATETIME2(0) NULL
  );
END;
GO

IF OBJECT_ID(N'dbo.mdp_action_master', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.mdp_action_master (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,
    problem_id INT NULL,
    is_active BIT NOT NULL CONSTRAINT DF_mdp_action_master_is_active DEFAULT (1),
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_mdp_action_master_created_at DEFAULT SYSUTCDATETIME(),
    modified_at DATETIME2(0) NULL,
    CONSTRAINT FK_mdp_action_master_problem_id
      FOREIGN KEY (problem_id) REFERENCES dbo.mdp_problem_master(id)
  );
END;
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = 'UX_mdp_problem_master_name'
    AND object_id = OBJECT_ID(N'dbo.mdp_problem_master')
)
BEGIN
  CREATE UNIQUE NONCLUSTERED INDEX UX_mdp_problem_master_name
    ON dbo.mdp_problem_master(name);
END;
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = 'UX_mdp_action_master_name_problem'
    AND object_id = OBJECT_ID(N'dbo.mdp_action_master')
)
BEGIN
  CREATE UNIQUE NONCLUSTERED INDEX UX_mdp_action_master_name_problem
    ON dbo.mdp_action_master(name, problem_id);
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.mdp_problem_master WHERE name = N'Normal')
  INSERT INTO dbo.mdp_problem_master(name, is_active) VALUES (N'Normal', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.mdp_problem_master WHERE name = N'Overheat')
  INSERT INTO dbo.mdp_problem_master(name, is_active) VALUES (N'Overheat', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.mdp_problem_master WHERE name = N'Underheat')
  INSERT INTO dbo.mdp_problem_master(name, is_active) VALUES (N'Underheat', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.mdp_problem_master WHERE name = N'Sensor Issue')
  INSERT INTO dbo.mdp_problem_master(name, is_active) VALUES (N'Sensor Issue', 1);
IF NOT EXISTS (SELECT 1 FROM dbo.mdp_problem_master WHERE name = N'Maintenance')
  INSERT INTO dbo.mdp_problem_master(name, is_active) VALUES (N'Maintenance', 1);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.mdp_action_master WHERE name = N'Monitoring' AND problem_id IS NULL)
  INSERT INTO dbo.mdp_action_master(name, problem_id, is_active) VALUES (N'Monitoring', NULL, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.mdp_action_master WHERE name = N'Check cooling system' AND problem_id IS NULL)
  INSERT INTO dbo.mdp_action_master(name, problem_id, is_active) VALUES (N'Check cooling system', NULL, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.mdp_action_master WHERE name = N'Check heater' AND problem_id IS NULL)
  INSERT INTO dbo.mdp_action_master(name, problem_id, is_active) VALUES (N'Check heater', NULL, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.mdp_action_master WHERE name = N'Calibrate sensor' AND problem_id IS NULL)
  INSERT INTO dbo.mdp_action_master(name, problem_id, is_active) VALUES (N'Calibrate sensor', NULL, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.mdp_action_master WHERE name = N'Scheduled maintenance' AND problem_id IS NULL)
  INSERT INTO dbo.mdp_action_master(name, problem_id, is_active) VALUES (N'Scheduled maintenance', NULL, 1);
GO
