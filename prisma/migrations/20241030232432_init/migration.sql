BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[PO_master_data_SCM] (
    [id] INT NOT NULL IDENTITY(1,1),
    [po_name] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [PO_master_data_SCM_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PO_master_data_SCM_po_name_key] UNIQUE NONCLUSTERED ([po_name])
);

-- CreateTable
CREATE TABLE [dbo].[scale_tasks] (
    [id] INT NOT NULL IDENTITY(1,1),
    [po_name] NVARCHAR(1000) NOT NULL,
    [material_id] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL,
    [scale_asset_id] INT NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [scale_tasks_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [modified_at] DATETIME2,
    [deleted_at] DATETIME2,
    CONSTRAINT [scale_tasks_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[scale_transaction] (
    [id] INT NOT NULL IDENTITY(1,1),
    [task_id] INT NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [scale_transaction_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [deleted_at] DATETIME2,
    CONSTRAINT [scale_transaction_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[scale_measurements] (
    [id] INT NOT NULL IDENTITY(1,1),
    [task_id] INT NOT NULL,
    [scale_asset_id] INT NOT NULL,
    [weight] DECIMAL(18,2) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [scale_measurements_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [deleted_at] DATETIME2,
    CONSTRAINT [scale_measurements_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[scale_assets] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    [location] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [scale_assets_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [modified_at] DATETIME2,
    [deleted_at] DATETIME2,
    CONSTRAINT [scale_assets_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[scale_tasks] ADD CONSTRAINT [scale_tasks_po_name_fkey] FOREIGN KEY ([po_name]) REFERENCES [dbo].[PO_master_data_SCM]([po_name]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[scale_tasks] ADD CONSTRAINT [scale_tasks_scale_asset_id_fkey] FOREIGN KEY ([scale_asset_id]) REFERENCES [dbo].[scale_assets]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[scale_transaction] ADD CONSTRAINT [scale_transaction_task_id_fkey] FOREIGN KEY ([task_id]) REFERENCES [dbo].[scale_tasks]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[scale_measurements] ADD CONSTRAINT [scale_measurements_task_id_fkey] FOREIGN KEY ([task_id]) REFERENCES [dbo].[scale_tasks]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[scale_measurements] ADD CONSTRAINT [scale_measurements_scale_asset_id_fkey] FOREIGN KEY ([scale_asset_id]) REFERENCES [dbo].[scale_assets]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
