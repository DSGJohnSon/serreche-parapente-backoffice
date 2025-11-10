import { PrismaClient, BaptemeCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Création des stages de démonstration...');

  // Créer des stages pour les 3 prochains mois
  const stages = [];
  const today = new Date();
  
  // Stages Initiation (tous les lundis)
  for (let i = 1; i <= 12; i++) {
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + (i * 7)); // Chaque semaine
    startDate.setHours(9, 0, 0, 0);
    
    stages.push({
      startDate,
      duration: 5,
      places: 6,
      price: 700.0,
      allTimeHighPrice: 700.0,
      type: 'INITIATION' as const,
    });
  }

  // Stages Progression (tous les lundis décalés)
  for (let i = 1; i <= 12; i++) {
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + (i * 7) + 3); // Décalé de 3 jours
    startDate.setHours(9, 0, 0, 0);
    
    stages.push({
      startDate,
      duration: 5,
      places: 6,
      price: 700.0,
      allTimeHighPrice: 700.0,
      type: 'PROGRESSION' as const,
    });
  }

  // Stages Autonomie (une fois par mois)
  for (let i = 1; i <= 4; i++) {
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + (i * 30)); // Chaque mois
    startDate.setHours(9, 0, 0, 0);
    
    stages.push({
      startDate,
      duration: 10,
      places: 6,
      price: 1200.0,
      allTimeHighPrice: 1200.0,
      type: 'AUTONOMIE' as const,
    });
  }

  // Insérer les stages
  for (const stageData of stages) {
    await prisma.stage.create({
      data: stageData,
    });
  }

  console.log(`✅ ${stages.length} stages créés avec succès !`);

  // Créer des baptêmes pour les prochaines semaines
  console.log('🌱 Création des baptêmes de démonstration...');
  
  const baptemes = [];
  
  // Baptêmes tous les jours à 10h et 14h pour les 30 prochains jours
  for (let i = 1; i <= 30; i++) {
    const date1 = new Date(today);
    date1.setDate(today.getDate() + i);
    date1.setHours(10, 0, 0, 0);
    
    const date2 = new Date(today);
    date2.setDate(today.getDate() + i);
    date2.setHours(14, 0, 0, 0);
    
    baptemes.push(
      {
        date: date1,
        duration: 120,
        places: 6,
        categories: [BaptemeCategory.AVENTURE, BaptemeCategory.DUREE, BaptemeCategory.LONGUE_DUREE],
      },
      {
        date: date2,
        duration: 120,
        places: 6,
        categories: [BaptemeCategory.AVENTURE, BaptemeCategory.DUREE, BaptemeCategory.ENFANT],
      }
    );
  }

  // Insérer les baptêmes
  for (const baptemeData of baptemes) {
    await prisma.bapteme.create({
      data: baptemeData,
    });
  }

  console.log(`✅ ${baptemes.length} baptêmes créés avec succès !`);

  // Créer les prix des catégories de baptêmes
  console.log('🌱 Création des prix des catégories...');
  
  const categoryPrices = [
    { category: 'AVENTURE', price: 110.0 },
    { category: 'DUREE', price: 150.0 },
    { category: 'LONGUE_DUREE', price: 185.0 },
    { category: 'ENFANT', price: 90.0 },
    { category: 'HIVER', price: 130.0 },
  ];

  for (const categoryPrice of categoryPrices) {
    await prisma.baptemeCategoryPrice.upsert({
      where: { category: categoryPrice.category as any },
      update: { price: categoryPrice.price },
      create: categoryPrice as any,
    });
  }

  console.log('✅ Prix des catégories configurés !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });