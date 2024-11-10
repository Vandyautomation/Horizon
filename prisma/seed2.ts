import { PrismaClient, Prisma } from '@prisma/client'; // Import Prisma types
const fs = require('fs');
const csv = require('csv-parser');
const prisma = new PrismaClient();

async function seed() {
  try {
    await prisma.$transaction(async (prisma) => {
      // Define machineData using Prisma's generated type
      const machineData: Prisma.MachineCreateManyInput[] = [];

      // Read and parse the CSV file
      fs.createReadStream('./prisma/seed-csv/machine.csv')
        .pipe(csv())
        .on('data', (row: Record<string, string>) => {
          machineData.push({
            name: row.name,
            description: row.description,
            number: row.number,
            tonage: row.tonage,
            locationId: parseInt(row.locationId, 10),
            rfid: row.rfid,
            createdBy: 1, // Set your desired createdBy value
          });
            console.log(row)

        })
        .on('end', async () => {
          console.log('CSV file successfully processed');

          // Seed data with Prisma
          await prisma.machine.createMany({
            data: machineData,
          });

          console.log('Database seeded');
        });

      // Continue with other seeding operations if needed
    });
  } catch (error) {
    console.error("Error during seeding, rolling back:", (error as Error).message);
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});

