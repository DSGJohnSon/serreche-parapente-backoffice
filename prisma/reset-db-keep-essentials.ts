import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('🔄 Début de la réinitialisation de la base de données...\n');

  try {
    // 1. Supprimer les données de test/commandes (dans l'ordre des dépendances)
    console.log('📦 Suppression des données de commandes et paniers...');
    
    await prisma.paymentAllocation.deleteMany({});
    console.log('  ✓ PaymentAllocations supprimées');
    
    await prisma.payment.deleteMany({});
    console.log('  ✓ Payments supprimés');
    
    await prisma.orderGiftCard.deleteMany({});
    console.log('  ✓ OrderGiftCards supprimées');
    
    await prisma.orderItem.deleteMany({});
    console.log('  ✓ OrderItems supprimés');
    
    await prisma.order.deleteMany({});
    console.log('  ✓ Orders supprimées');
    
    await prisma.processedWebhookEvent.deleteMany({});
    console.log('  ✓ ProcessedWebhookEvents supprimés');

    // 2. Supprimer les réservations
    console.log('\n📅 Suppression des réservations...');
    
    await prisma.stageBooking.deleteMany({});
    console.log('  ✓ StageBookings supprimées');
    
    await prisma.baptemeBooking.deleteMany({});
    console.log('  ✓ BaptemeBookings supprimées');

    // 3. Supprimer les cartes et bons cadeaux
    console.log('\n🎁 Suppression des cartes et bons cadeaux...');
    
    await prisma.giftCard.deleteMany({});
    console.log('  ✓ GiftCards supprimées');
    
    await prisma.giftVoucher.deleteMany({});
    console.log('  ✓ GiftVouchers supprimés');

    // 4. Supprimer les paniers et réservations temporaires
    console.log('\n🛒 Suppression des paniers...');
    
    await prisma.temporaryReservation.deleteMany({});
    console.log('  ✓ TemporaryReservations supprimées');
    
    await prisma.cartItem.deleteMany({});
    console.log('  ✓ CartItems supprimés');
    
    await prisma.cartSession.deleteMany({});
    console.log('  ✓ CartSessions supprimées');

    // 5. Supprimer les clients et stagiaires
    console.log('\n👥 Suppression des clients et stagiaires...');
    
    await prisma.client.deleteMany({});
    console.log('  ✓ Clients supprimés');
    
    await prisma.stagiaire.deleteMany({});
    console.log('  ✓ Stagiaires supprimés');

    // 6. Afficher ce qui est conservé
    console.log('\n✅ Conservation des données essentielles:');
    
    const stageCount = await prisma.stage.count();
    console.log(`  ✓ ${stageCount} stages conservés`);
    
    const baptemeCount = await prisma.bapteme.count();
    console.log(`  ✓ ${baptemeCount} baptêmes conservés`);
    
    const userCount = await prisma.user.count();
    console.log(`  ✓ ${userCount} utilisateurs conservés`);
    
    const stageMoniteurCount = await prisma.stageMoniteur.count();
    console.log(`  ✓ ${stageMoniteurCount} assignations moniteurs-stages conservées`);
    
    const baptemeMoniteurCount = await prisma.baptemeMoniteur.count();
    console.log(`  ✓ ${baptemeMoniteurCount} assignations moniteurs-baptêmes conservées`);

    // 7. Afficher les prix conservés
    const baptemePriceCount = await prisma.baptemeCategoryPrice.count();
    const stagePriceCount = await prisma.stageBasePrice.count();
    const videoPriceCount = await prisma.videoOptionPrice.count();
    const depositPriceCount = await prisma.baptemeDepositPrice.count();
    
    console.log(`  ✓ ${baptemePriceCount} prix de catégories baptême conservés`);
    console.log(`  ✓ ${stagePriceCount} prix de base stages conservés`);
    console.log(`  ✓ ${videoPriceCount} prix option vidéo conservés`);
    console.log(`  ✓ ${depositPriceCount} prix acompte baptême conservés`);

    console.log('\n✨ Réinitialisation terminée avec succès!');
    console.log('📊 La base de données est prête pour de nouvelles commandes.\n');

  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
resetDatabase()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });