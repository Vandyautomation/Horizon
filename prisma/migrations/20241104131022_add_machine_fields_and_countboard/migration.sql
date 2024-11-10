/*
  Warnings:

  - Added the required column `number` to the `Machine` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tonage` to the `Machine` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Machine] ADD [locationId] INT,
[number] NVARCHAR(1000) NOT NULL,
[rfid] NVARCHAR(1000),
[tonage] NVARCHAR(1000) NOT NULL;

-- CreateTable
CREATE TABLE [dbo].[coois] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [so_name] VARCHAR(100),
    [po_name] VARCHAR(100),
    [material_id] VARCHAR(100),
    [material_name] VARCHAR(100),
    [required_qty] DECIMAL(18,2),
    [produced_qty] DECIMAL(18,2),
    [scrap_qty] DECIMAL(18,2),
    [is_deleted] BIT,
    [uploaded_at] DATETIME2,
    [modified_at] DATETIME2,
    [is_sync] BIT,
    CONSTRAINT [coois_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[countboard_tasks] (
    [id] INT NOT NULL IDENTITY(1,1),
    [po_name] VARCHAR(50),
    [machine_name] VARCHAR(50),
    [required_qty] VARCHAR(50),
    [produced_qty] VARCHAR(50),
    [cvt] INT,
    [ct] DECIMAL(10,2),
    [created_at] DATETIME2,
    [updated_at] DATETIME2,
    [is_processed] BIT,
    [actual_cvt] INT,
    [actual_ct] DECIMAL(10,2),
    CONSTRAINT [tasks_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[hourly] (
    [id] BIGINT NOT NULL IDENTITY(1,1),
    [task_id] INT,
    [actual_qty] INT,
    [target_qty] INT,
    [hour_id] INT,
    [from_datetime] DATETIME2,
    [to_datetime] DATETIME2,
    [created_at] DATETIME2,
    [modified_at] DATETIME2,
    [modified_by] VARCHAR(50),
    [shift_id] INT,
    [machine_id] VARCHAR(50),
    [running_actual_qty] INT,
    [running_target_qty] INT,
    [cause] VARCHAR(max),
    [ooe] VARCHAR(max),
    [note] VARCHAR(max),
    [scrap] INT,
    [rework] INT,
    CONSTRAINT [hourly_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[_LocationToMachine] (
    [A] INT NOT NULL,
    [B] INT NOT NULL,
    CONSTRAINT [_LocationToMachine_AB_unique] UNIQUE NONCLUSTERED ([A],[B])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [_LocationToMachine_B_index] ON [dbo].[_LocationToMachine]([B]);

-- AddForeignKey
ALTER TABLE [dbo].[_LocationToMachine] ADD CONSTRAINT [_LocationToMachine_A_fkey] FOREIGN KEY ([A]) REFERENCES [dbo].[Location]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_LocationToMachine] ADD CONSTRAINT [_LocationToMachine_B_fkey] FOREIGN KEY ([B]) REFERENCES [dbo].[Machine]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
