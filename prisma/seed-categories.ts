import { PrismaClient, BaptemeCategory } from '@prisma/client'

const prisma = new PrismaClient()

async function seedCategories() {
  console.log('🌱 Seeding bapteme categories...')

  const categories = [
    { category: BaptemeCategory.AVENTURE, price: 110 },
    { category: BaptemeCategory.DUREE, price: 150 },
    { category: BaptemeCategory.LONGUE_DUREE, price: 185 },
    { category: BaptemeCategory.ENFANT, price: 90 },
    { category: BaptemeCategory.HIVER, price: 130 },
  ]

  for (const categoryData of categories) {
    await prisma.baptemeCategoryPrice.upsert({
      where: { category: categoryData.category },
      update: { price: categoryData.price },
      create: categoryData,
    })
    console.log(`✅ Category ${categoryData.category} seeded with price ${categoryData.price}€`)
  }

  console.log('🎉 Categories seeding completed!')
}

seedCategories()
  .catch((e) => {
    console.error('❌ Error seeding categories:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })