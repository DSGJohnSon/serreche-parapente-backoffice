import { PrismaClient, StageType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding pricing data...");

  // Seed video option price
  const videoPrice = await prisma.videoOptionPrice.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      price: 30.0, // Default video option price
    },
  });
  console.log("✅ Video option price seeded:", videoPrice);

  // Seed bapteme deposit price
  const baptemeDepositPrice = await prisma.baptemeDepositPrice.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      price: 35.0, // Default bapteme deposit price
    },
  });
  console.log("✅ Bapteme deposit price seeded:", baptemeDepositPrice);

  // Seed stage base prices
  const stageTypes = [
    { type: StageType.INITIATION, price: 350.0 },
    { type: StageType.PROGRESSION, price: 400.0 },
    { type: StageType.AUTONOMIE, price: 450.0 },
  ];

  for (const { type, price } of stageTypes) {
    const stagePrice = await prisma.stageBasePrice.upsert({
      where: { stageType: type },
      update: { price },
      create: {
        stageType: type,
        price,
      },
    });
    console.log(`✅ Stage base price for ${type} seeded:`, stagePrice);
  }

  console.log("✨ Pricing data seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding pricing data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });