const fs = require('fs');
const csv = require('csv-parser');
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


async function seed() {
  try {
    await prisma.$transaction(async (prisma) => {
      // Seed Users
      const hashedPassword = await Bun.password.hash('password', {
        algorithm: "bcrypt",
        cost: 4, // number between 4-31
      });
      await prisma.user.createMany({
        data: [
          {  firstName: "Dzul", lastName: "Test", username: "dzul123", password: hashedPassword, createdBy: 1 },
          {  firstName: "Fikar", lastName: "Test", username: "fikar123", password: hashedPassword, createdBy: 1 },
          {  firstName: "Ats", lastName: "Test", username: "ats123", password: hashedPassword, createdBy: 1 },
        ],
      });

      await prisma.group.createMany({
        data: [
          { name: "A", createdBy: 1 },
          { name: "B", createdBy: 1 },
          { name: "C", createdBy: 1 },
        ],
      });
    
      // Seed User Groups
      await prisma.userGroup.createMany({
        data: [
          { userId: 1, groupId: 1, createdBy: 1 },
          {  userId: 2, groupId: 2, createdBy: 1 },
          {  userId: 3, groupId: 3, createdBy: 1 },
        ],
      });


    
      await prisma.location.createMany({
        data: [
          { name: "INJ Bld G", uap: "BASIC", createdBy: 1 },
          { name: "INJ Bld H", uap: "BASIC", createdBy: 1 },
          { name: "INJ Bld J", uap: "PREMIUM", createdBy: 1 },
          { name: "INJ Bld Q", uap: "PREMIUM", createdBy: 1 },
          { name: "INJ Bld R", uap: "LEAN", createdBy: 1 },
          { name: "INJ Bld S", uap: "LEAN", createdBy: 1 },
          { name: "INJ Bld T", uap: "LEAN", createdBy: 1 },
        ],
      });
      // Seed User Locations
      await prisma.userLocation.createMany({
        data: [
          {  userId: 1, locationId: 1, createdBy: 1 },
          {  userId: 2, locationId: 2, createdBy: 1 },
          {  userId: 3, locationId: 3, createdBy: 1 },
        ],
      });
      

    
      // Seed User Roles
      await prisma.userRole.createMany({
        data: [
          {  userId: 1, name: "Admin", type: "admin", process: "All",createdBy: 1 },
          {  userId: 2, name: "Material Operator", type: "staff", process: "Injection", createdBy: 1 },
          {  userId: 3, name: "Maintenance", type: "staff", process: "Injection",  createdBy: 1 },
        ],
      });
    
      // Seed Machines
      await prisma.machine.createMany({
        data: [
          {  name: "BR20001", description: "INJ 1 BORCHE 200T", number: "1", tonage: "200T", locationId: 1, createdBy: 1 },
          {  name: "BR20002", description: "INJ 2 BORCHE 200T", number: "2", tonage: "200T", locationId: 1, createdBy: 1 },
          {  name: "BR20003", description: "INJ 3 BORCHE 200T", number: "3", tonage: "200T", locationId: 1, createdBy: 1 },
        ],
      });
    
      // Seed Machine Status
      await prisma.machineStatus.createMany({
        data: [
          {  name: "ORANGE", description: "Downtime", createdBy: 1 },
          {  name: "BLUE", description: "Changeover", createdBy: 1 },
          {  name: "WHITE", description: "No order", createdBy: 1 },
          {  name: "PURPLE", description: "Organization Disfunction", createdBy: 1 },
          {  name: "RED", description: "Non Quality", createdBy: 1 },
        ],
      });
    
      // Seed Machine Transactions
      await prisma.machineTransaction.createMany({
        data: [
          {  machineId: 1, statusId: 1, createdBy: 1 },
          {  machineId: 2, statusId: 2, createdBy: 1 },
          {  machineId: 3, statusId: 3, createdBy: 1 },
        ],
      });
    
      // Seed Problem Groups
      await prisma.problemGroup.createMany({
        data: [
          {  name: "Electrical Issues", createdBy: 1 },
          {  name: "Mechanical Issues", createdBy: 1 },
          {  name: "Operational Errors", createdBy: 1 },
        ],
      });
    
      // Seed Problems
      await prisma.problem.createMany({
        data: [
          {  name: "Power Failure", statusId: 1, groupId: 1, createdBy: 1 },
          {  name: "Gearbox Failure", statusId: 2, groupId: 2, createdBy: 1 },
          {  name: "Operator Error", statusId: 3, groupId: 3, createdBy: 1 },
        ],
      });
    
      // Seed Problem Actions
      await prisma.problemAction.createMany({
        data: [
          {  name: "Restart Machine", problemId: 1, picPersonnelId: 1, isEscalated: false, createdBy: 1 },
          {  name: "Replace Gearbox", problemId: 2, picPersonnelId: 2, isEscalated: true, createdBy: 1 },
          {  name: "Operator Training", problemId: 3, picPersonnelId: 3, isEscalated: false, createdBy: 1 },
        ],
      });
    
      // Seed Tickets
      await prisma.ticket.createMany({
        data: [
          {  machineId: 1, problemActionId: 1, createdBy: 1 },
          {  machineId: 2, problemActionId: 2, createdBy: 1 },
          {  machineId: 3, problemActionId: 3, createdBy: 1 },
        ],
      });
    
      // Seed Ticket Notes
      await prisma.ticketNote.createMany({
        data: [
          {  ticketId: 1, notes: "Initial inspection completed", createdBy: 1 },
          {  ticketId: 2, notes: "Gearbox ordered", createdBy: 1 },
          {  ticketId: 3, notes: "Operator re-training scheduled", createdBy: 1 },
        ],
      });
    
      // Seed Ticket Transactions
      await prisma.ticketTransaction.createMany({
        data: [
          {  ticketId: 1, type: "Inspection", createdBy: 1 },
          {  ticketId: 2, type: "Repair", createdBy: 1 },
          {  ticketId: 3, type: "Training", createdBy: 1 },
        ],
      });

      await prisma.pO_master_data_SCM.createMany({
        data: [
          { po_name: 'PO001', material_id : '42124' },
          { po_name: 'PO002', material_id : '11240' },
          { po_name: 'PO003', material_id : '31231' },
        ],
      });
    
      // Seed data for scale_assets
      await prisma.scale_assets.createMany({
        data: [
          { name: 'Scale A', description: 'High Precision Scale', location: 'Warehouse 1' },
          { name: 'Scale B', description: 'Standard Scale', location: 'Warehouse 2' },
          { name: 'Scale C', description: 'Heavy-Duty Scale', location: 'Warehouse 3' },
        ],
      });
    
      // Seed data for scale_tasks
      await prisma.scale_tasks.createMany({
        data: [
          {
            po_name: 'PO001',
            material_id: 'M001',
            status: 'NEW',
            scale_asset_id: 1,
            created_at: new Date(),
            modified_at: new Date(),
          },
          {
            po_name: 'PO002',
            material_id: 'M002',
            status: 'NEW',
            scale_asset_id: 2,
            created_at: new Date(),
            modified_at: new Date(),
          },
          {
            po_name: 'PO003',
            material_id: 'M003',
            status: 'NEW',
            scale_asset_id: 3,
            created_at: new Date(),
            modified_at: new Date(),
          },
        ],
      });
    
      // Seed data for scale_transaction
      await prisma.scale_transaction.createMany({
        data: [
          { task_id: 1, type: 'RUN', created_at: new Date() },
          { task_id: 1, type: 'PAUSE', created_at: new Date() },
          { task_id: 2, type: 'RUN', created_at: new Date() },
          { task_id: 3, type: 'RUN', created_at: new Date() },
        ],
      });
    
      // Seed data for scale_measurements
      await prisma.scale_measurements.createMany({
        data: [
          { task_id: 1, scale_asset_id: 1, weight: 12.34, created_at: new Date() },
          { task_id: 2, scale_asset_id: 2, weight: 45.67, created_at: new Date() },
          { task_id: 3, scale_asset_id: 3, weight: 89.01, created_at: new Date() },
        ],
      });

      // Add more seeding operations for each table within this transaction block

      console.log("Seeding complete.");
    });
  } catch (error) {
    console.error("Error during seeding, rolling back:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
