IF OBJECT_ID('IoT.dbo.mdp_temperature_threshold_master', 'U') IS NULL
BEGIN
  CREATE TABLE IoT.dbo.mdp_temperature_threshold_master (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [timestamp] DATETIME2(0) NOT NULL,
    mdp_id INT NOT NULL,
    json_value NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2(0) NOT NULL,
    modified_at DATETIME2(0) NULL
  );

  CREATE INDEX IX_mdp_temperature_threshold_master_mdp_timestamp
    ON IoT.dbo.mdp_temperature_threshold_master (mdp_id, [timestamp] DESC);
END
GO

