IF OBJECT_ID('IoT.dbo.AndonTrendkHourlyAgg', 'U') IS NULL
BEGIN
  CREATE TABLE IoT.dbo.AndonTrendkHourlyAgg (
    hour_start DATETIME NOT NULL,
    mchid NVARCHAR(100) NOT NULL,
    status_light NVARCHAR(50) NOT NULL,
    duration_seconds INT NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_AndonTrendkHourlyAgg PRIMARY KEY (hour_start, mchid, status_light)
  );
END;

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = 'IX_AndonTrendkHourlyAgg_Mch_Hour'
    AND object_id = OBJECT_ID('IoT.dbo.AndonTrendkHourlyAgg')
)
BEGIN
  CREATE INDEX IX_AndonTrendkHourlyAgg_Mch_Hour
    ON IoT.dbo.AndonTrendkHourlyAgg (mchid, hour_start)
    INCLUDE (status_light, duration_seconds);
END;

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = 'IX_AndonTrendkHourlyAgg_Status_Hour'
    AND object_id = OBJECT_ID('IoT.dbo.AndonTrendkHourlyAgg')
)
BEGIN
  CREATE INDEX IX_AndonTrendkHourlyAgg_Status_Hour
    ON IoT.dbo.AndonTrendkHourlyAgg (status_light, hour_start)
    INCLUDE (mchid, duration_seconds);
END;
