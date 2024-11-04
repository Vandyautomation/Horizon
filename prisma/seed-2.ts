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
    
      // Seed User Groups
      await prisma.userGroup.createMany({
        data: [
          { userId: 1, name: "Admins", createdBy: 1 },
          {  userId: 2, name: "Operators", createdBy: 1 },
          {  userId: 3, name: "Maintenance", createdBy: 1 },
        ],
      });
    
      // Seed User Locations
      await prisma.userLocation.createMany({
        data: [
          {  userId: 1, name: "INJ Bld J", createdBy: 1 },
          {  userId: 2, name: "INJ Bld G", createdBy: 1 },
          {  userId: 3, name: "INJ Bld J", createdBy: 1 },
        ],
      });
    
      // Seed User Roles
      await prisma.userRole.createMany({
        data: [
          {  userId: 1, name: "Admin", type: "admin", process: "All",createdBy: 1 },
          {  userId: 2, name: "Operator", type: "operator", process: "Injection", createdBy: 1 },
          {  userId: 3, name: "Maintenance Staff", type: "maintenance", process: "Injection",  createdBy: 1 },
        ],
      });
    
      // Seed Machines
      await prisma.machine.createMany({
        data: [
          {  name: "Machine A", description: "High-speed manufacturing", createdBy: 1 },
          {  name: "Machine B", description: "Precision machining", createdBy: 1 },
          {  name: "Machine C", description: "Assembly line", createdBy: 1 },
        ],
      });
    
      // Seed Machine Status
      await prisma.machineStatus.createMany({
        data: [
          {  name: "Operational", description: "Machine is running normally", createdBy: 1 },
          {  name: "Under Maintenance", description: "Scheduled maintenance", createdBy: 1 },
          {  name: "Out of Order", description: "Machine needs repair", createdBy: 1 },
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
