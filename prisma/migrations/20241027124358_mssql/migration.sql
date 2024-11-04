BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [username] NVARCHAR(1000) NOT NULL,
    [firstName] NVARCHAR(1000) NOT NULL,
    [lastName] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [modifiedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    [createdBy] INT,
    [modifiedBy] INT,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_username_key] UNIQUE NONCLUSTERED ([username])
);

-- CreateTable
CREATE TABLE [dbo].[UserGroup] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] INT NOT NULL,
    [groupId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [UserGroup_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [modifiedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    [createdBy] INT,
    [modifiedBy] INT,
    CONSTRAINT [UserGroup_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Group] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Group_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [modifiedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    [createdBy] INT,
    [modifiedBy] INT,
    CONSTRAINT [Group_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Group_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[UserLocation] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] INT NOT NULL,
    [locationId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [UserLocation_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [modifiedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    [createdBy] INT,
    [modifiedBy] INT,
    CONSTRAINT [UserLocation_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Location] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Location_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [modifiedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    [createdBy] INT,
    [modifiedBy] INT,
    CONSTRAINT [Location_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Location_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[UserRole] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] INT NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [process] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [UserRole_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [modifiedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    [createdBy] INT,
    [modifiedBy] INT,
    CONSTRAINT [UserRole_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UserRole_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Machine] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Machine_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [modifiedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    [createdBy] INT,
    [modifiedBy] INT,
    CONSTRAINT [Machine_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Machine_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[MachineTransaction] (
    [id] INT NOT NULL IDENTITY(1,1),
    [machineId] INT NOT NULL,
    [statusId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [MachineTransaction_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [deletedAt] DATETIME2,
    [createdBy] INT,
    CONSTRAINT [MachineTransaction_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[MachineStatus] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [MachineStatus_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [modifiedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    [createdBy] INT,
    [modifiedBy] INT,
    CONSTRAINT [MachineStatus_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [MachineStatus_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[ProblemGroup] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ProblemGroup_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [modifiedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    [createdBy] INT,
    [modifiedBy] INT,
    CONSTRAINT [ProblemGroup_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ProblemGroup_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Problem] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [statusId] INT NOT NULL,
    [groupId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Problem_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [modifiedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    [createdBy] INT,
    [modifiedBy] INT,
    CONSTRAINT [Problem_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Problem_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[ProblemAction] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [problemId] INT NOT NULL,
    [picPersonnelId] INT NOT NULL,
    [isEscalated] BIT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ProblemAction_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [modifiedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    [createdBy] INT,
    [modifiedBy] INT,
    CONSTRAINT [ProblemAction_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ProblemAction_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Ticket] (
    [id] INT NOT NULL IDENTITY(1,1),
    [machineId] INT NOT NULL,
    [problemActionId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Ticket_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [modifiedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    [createdBy] INT,
    [modifiedBy] INT,
    CONSTRAINT [Ticket_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[TicketNote] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ticketId] INT NOT NULL,
    [notes] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TicketNote_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [modifiedAt] DATETIME2 NOT NULL,
    [deletedAt] DATETIME2,
    [createdBy] INT,
    [modifiedBy] INT,
    CONSTRAINT [TicketNote_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[TicketTransaction] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ticketId] INT NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TicketTransaction_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [deletedAt] DATETIME2,
    [createdBy] INT,
    CONSTRAINT [TicketTransaction_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[_TicketToUser] (
    [A] INT NOT NULL,
    [B] INT NOT NULL,
    CONSTRAINT [_TicketToUser_AB_unique] UNIQUE NONCLUSTERED ([A],[B])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [_TicketToUser_B_index] ON [dbo].[_TicketToUser]([B]);

-- AddForeignKey
ALTER TABLE [dbo].[UserGroup] ADD CONSTRAINT [UserGroup_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UserGroup] ADD CONSTRAINT [UserGroup_groupId_fkey] FOREIGN KEY ([groupId]) REFERENCES [dbo].[Group]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UserLocation] ADD CONSTRAINT [UserLocation_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UserLocation] ADD CONSTRAINT [UserLocation_locationId_fkey] FOREIGN KEY ([locationId]) REFERENCES [dbo].[Location]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UserRole] ADD CONSTRAINT [UserRole_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[MachineTransaction] ADD CONSTRAINT [MachineTransaction_machineId_fkey] FOREIGN KEY ([machineId]) REFERENCES [dbo].[Machine]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Problem] ADD CONSTRAINT [Problem_groupId_fkey] FOREIGN KEY ([groupId]) REFERENCES [dbo].[ProblemGroup]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Problem] ADD CONSTRAINT [Problem_statusId_fkey] FOREIGN KEY ([statusId]) REFERENCES [dbo].[MachineStatus]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProblemAction] ADD CONSTRAINT [ProblemAction_problemId_fkey] FOREIGN KEY ([problemId]) REFERENCES [dbo].[Problem]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Ticket] ADD CONSTRAINT [Ticket_machineId_fkey] FOREIGN KEY ([machineId]) REFERENCES [dbo].[Machine]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Ticket] ADD CONSTRAINT [Ticket_problemActionId_fkey] FOREIGN KEY ([problemActionId]) REFERENCES [dbo].[ProblemAction]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TicketNote] ADD CONSTRAINT [TicketNote_ticketId_fkey] FOREIGN KEY ([ticketId]) REFERENCES [dbo].[Ticket]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TicketTransaction] ADD CONSTRAINT [TicketTransaction_ticketId_fkey] FOREIGN KEY ([ticketId]) REFERENCES [dbo].[Ticket]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_TicketToUser] ADD CONSTRAINT [_TicketToUser_A_fkey] FOREIGN KEY ([A]) REFERENCES [dbo].[Ticket]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[_TicketToUser] ADD CONSTRAINT [_TicketToUser_B_fkey] FOREIGN KEY ([B]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
