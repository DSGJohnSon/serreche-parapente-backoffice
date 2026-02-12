import "server-only";
import prisma from "@/lib/prisma";
import { sendOrderConfirmationEmail, sendAdminNewOrderEmail, sendGiftVoucherPurchaseEmail } from "@/lib/resend";

/**
 * Fonction pour obtenir le prix d'un baptême selon sa catégorie
 */
export async function getBaptemePrice(category: string): Promise<number> {
  const defaultPrices = {
    AVENTURE: 110,
    DUREE: 150,
    LONGUE_DUREE: 185,
    ENFANT: 90,
    HIVER: 130,
  };
  
  if (!category || category === '') {
    return 110;
  }
  
  try {
    const categoryPrice = await prisma.baptemeCategoryPrice.findUnique({
      where: { category: category as any },
    });
    
    return categoryPrice?.price || defaultPrices[category as keyof typeof defaultPrices] || 110;
  } catch (error) {
    return defaultPrices[category as keyof typeof defaultPrices] || 110;
  }
}

/**
 * Fonction pour trouver ou créer/mettre à jour un stagiaire
 */
export async function findOrCreateStagiaire(participantData: any) {
  // Chercher d'abord par email
  let stagiaire = await prisma.stagiaire.findFirst({
    where: { email: participantData.email },
  });

  const stagiaireData = {
    firstName: participantData.firstName,
    lastName: participantData.lastName,
    email: participantData.email,
    phone: participantData.phone,
    weight: participantData.weight,
    height: participantData.height,
    birthDate: participantData.birthDate
      ? new Date(participantData.birthDate)
      : null,
  };

  if (!stagiaire) {
    // Créer un nouveau stagiaire
    stagiaire = await prisma.stagiaire.create({
      data: stagiaireData,
    });
    console.log(`Stagiaire created: ${stagiaire.id} (${stagiaire.email})`);
  } else {
    // Mettre à jour le stagiaire existant
    stagiaire = await prisma.stagiaire.update({
      where: { id: stagiaire.id },
      data: stagiaireData,
    });
    console.log(`Stagiaire updated: ${stagiaire.id} (${stagiaire.email})`);
  }

  return stagiaire;
}

/**
 * Fonction pour générer un code unique de carte cadeau DANS une transaction
 */
export async function generateUniqueGiftCardCodeInTransaction(tx: any): Promise<string> {
  let code: string;
  let exists = true;

  do {
    const prefix = "SCP";
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    code = `${prefix}-${timestamp}-${random}`;

    const existing = await tx.giftCard.findUnique({
      where: { code },
    });
    exists = !!existing;
  } while (exists);

  return code;
}

/**
 * Fonction pour générer un code unique de bon cadeau DANS une transaction
 */
export async function generateUniqueVoucherCodeInTransaction(tx: any): Promise<string> {
  let code: string;
  let exists = true;

  do {
    const prefix = "GVSCP";
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    code = `${prefix}-${timestamp}-${random}`;

    const existing = await tx.giftVoucher.findUnique({
      where: { code },
    });
    exists = !!existing;
  } while (exists);

  return code;
}

/**
 * Fonction pour répartir un paiement entre les OrderItems
 */
export async function allocatePaymentToOrderItems(payment: any, orderItems: any[]) {
  console.log(`Allocating payment ${payment.id} (${payment.amount}€) to ${orderItems.length} items - paymentType: ${payment.paymentType}`);

  // Pour les paiements GIFT_VOUCHER, on alloue le prix total des items payés par bon cadeau
  const isGiftVoucherPayment = payment.paymentType === 'GIFT_VOUCHER';

  // Créer les allocations pour chaque OrderItem selon son prix
  for (const item of orderItems) {
    let allocatedAmount = 0;

    if (item.type === 'STAGE') {
      if (isGiftVoucherPayment) {
        // Pour un paiement par bon cadeau, allouer le prix total si l'item utilise un bon cadeau
        const participantData = item.participantData as any;
        if (participantData?.usedGiftVoucherCode) {
          allocatedAmount = item.totalPrice || 0;
          console.log(`STAGE item ${item.id} (GIFT_VOUCHER): allocating totalPrice=${allocatedAmount}€`);
        }
      } else {
        // Pour un paiement normal (Stripe/Manuel), allouer le montant de l'acompte
        allocatedAmount = item.depositAmount || 0;
        console.log(`STAGE item ${item.id}: depositAmount=${item.depositAmount}, totalPrice=${item.totalPrice}, remainingAmount=${item.remainingAmount}`);
      }
    } else if (item.type === 'BAPTEME') {
      if (isGiftVoucherPayment) {
        // Pour un paiement par bon cadeau, allouer le prix total si l'item utilise un bon cadeau
        const participantData = item.participantData as any;
        if (participantData?.usedGiftVoucherCode) {
          allocatedAmount = item.totalPrice || 0;
          console.log(`BAPTEME item ${item.id} (GIFT_VOUCHER): allocating totalPrice=${allocatedAmount}€`);
        }
      } else {
        // Pour un paiement normal (Stripe/Manuel), allouer le montant de l'acompte
        allocatedAmount = item.depositAmount || 0;
        console.log(`BAPTEME item ${item.id}: depositAmount=${item.depositAmount}, totalPrice=${item.totalPrice}, remainingAmount=${item.remainingAmount}, hasVideo=${item.participantData?.hasVideo}`);
      }
    } else if (item.type === 'GIFT_CARD') {
      // Pour les cartes cadeaux, allouer le montant de la carte
      allocatedAmount = item.giftCardAmount || 0;
      console.log(`GIFT_CARD item ${item.id}: giftCardAmount=${item.giftCardAmount}`);
    } else if (item.type === 'GIFT_VOUCHER') {
      // Pour les achats de bons cadeaux, allouer le montant
      allocatedAmount = item.giftVoucherAmount || 0;
      console.log(`GIFT_VOUCHER item ${item.id}: giftVoucherAmount=${item.giftVoucherAmount}`);
    }

    if (allocatedAmount > 0) {
      await prisma.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          orderItemId: item.id,
          allocatedAmount,
        },
      });

      console.log(`✓ Allocated ${allocatedAmount}€ from payment ${payment.id} to item ${item.id} (${item.type})`);
    } else {
      console.warn(`⚠ No amount to allocate for item ${item.id} (${item.type})`);
    }
  }
}

/**
 * Fonction pour créer les réservations à partir d'une commande
 */
export async function createBookingsFromOrder(order: any) {
  console.log(`[ORDER-PROCESSING] 🎯 createBookingsFromOrder called for order ${order.id} with ${order.orderItems.length} items - Timestamp: ${new Date().toISOString()}`);

  // TRAITER TOUS LES GIFT_CARDS ET GIFT_VOUCHERS DANS UNE SEULE TRANSACTION GLOBALE
  const giftItems = order.orderItems.filter((item: any) => item.type === "GIFT_CARD" || item.type === "GIFT_VOUCHER");

  if (giftItems.length > 0) {
    try {
      await prisma.$transaction(async (tx) => {
        for (const item of giftItems) {
          // Extraire les données du participantData
          const participantData = typeof item.participantData === 'string'
            ? JSON.parse(item.participantData)
            : item.participantData;

          console.log(`Processing GIFT item ${item.id}:`, {
            hasVoucherProductType: !!participantData?.voucherProductType,
            voucherProductType: participantData?.voucherProductType,
            giftCardAmount: item.giftCardAmount,
            hasGeneratedVoucher: !!item.generatedGiftVoucherId,
            hasGeneratedCard: !!item.generatedGiftCardId,
          });

          if (item.type === "GIFT_VOUCHER") {
            // ACHAT d'un bon cadeau pour une activité
            console.log(`[ORDER-PROCESSING] Item ${item.id} is a GIFT VOUCHER purchase`);

            // Vérifier dans la transaction (lock pessimiste)
            const freshItem = await tx.orderItem.findUnique({
              where: { id: item.id },
              select: { generatedGiftVoucherId: true },
            });

            console.log(`[ORDER-PROCESSING] Fresh check for item ${item.id}: generatedGiftVoucherId = ${freshItem?.generatedGiftVoucherId || 'NULL'}`);

            if (freshItem?.generatedGiftVoucherId) {
              console.log(`[ORDER-PROCESSING] ⚠️ Gift voucher already created for item ${item.id} (detected in transaction) - Existing ID: ${freshItem.generatedGiftVoucherId}`);
              continue; // Skip creation
            }

            console.log(`[ORDER-PROCESSING] 🔵 CREATING GIFT VOUCHER for item ${item.id} - Type: ${participantData.voucherProductType} - Timestamp: ${new Date().toISOString()}`);

            // Générer le code DANS la transaction pour éviter les race conditions
            const code = await generateUniqueVoucherCodeInTransaction(tx);

            // Calculer la date d'expiration (1 an)
            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);

            const voucher = await tx.giftVoucher.create({
              data: {
                code,
                productType: participantData.voucherProductType,
                stageCategory: participantData.voucherStageCategory || null,
                baptemeCategory: participantData.voucherBaptemeCategory || null,
                purchasePrice: item.giftVoucherAmount || item.unitPrice || 0,
                recipientName: participantData.recipientName || 'Non spécifié',
                recipientEmail: participantData.recipientEmail || 'non-specifie@placeholder.local',
                expiryDate,
                clientId: order.clientId,
              },
            });

            console.log(`[ORDER-PROCESSING] 🟢 GIFT VOUCHER CREATED: ${voucher.code} - ID: ${voucher.id} - Type: ${voucher.productType} - Timestamp: ${new Date().toISOString()}`);

            // Lier le bon cadeau à l'order item dans la même transaction
            await tx.orderItem.update({
              where: { id: item.id },
              data: { generatedGiftVoucherId: voucher.id },
            });

            console.log(`[ORDER-PROCESSING] ✓ Gift voucher ${voucher.code} linked to OrderItem ${item.id}`);

            // ENVOYER L'EMAIL DU BON CADEAU
            try {
              const voucherType = voucher.productType === 'STAGE'
                ? `Stage ${voucher.stageCategory}`
                : `Baptême ${voucher.baptemeCategory}`;

              await sendGiftVoucherPurchaseEmail({
                buyerName: participantData.buyerName,
                buyerEmail: participantData.buyerEmail,
                recipientName: participantData.recipientName,
                recipientEmail: participantData.recipientEmail,
                notifyRecipient: participantData.notifyRecipient,
                personalMessage: participantData.personalMessage,
                voucherCode: voucher.code,
                voucherType,
                expiryDate: voucher.expiryDate.toISOString(),
                purchaseDate: new Date().toISOString(),
                orderNumber: order.orderNumber,
              });

              console.log(`[ORDER-PROCESSING] 📧 Gift voucher email sent for ${voucher.code}`);
            } catch (emailError) {
              console.error(`[ORDER-PROCESSING] ⚠️ Failed to send gift voucher email for ${voucher.code}:`, emailError);
              // Ne pas throw pour ne pas bloquer le traitement
            }
          } else if (item.type === "GIFT_CARD") {
            // CARTE CADEAU monétaire classique
            console.log(`[ORDER-PROCESSING] Item ${item.id} is a GIFT CARD (monetary)`);

            // Vérifier dans la transaction (lock pessimiste)
            const freshItem = await tx.orderItem.findUnique({
              where: { id: item.id },
              select: { generatedGiftCardId: true },
            });

            console.log(`[ORDER-PROCESSING] Fresh check for item ${item.id}: generatedGiftCardId = ${freshItem?.generatedGiftCardId || 'NULL'}`);

            if (freshItem?.generatedGiftCardId) {
              console.log(`[ORDER-PROCESSING] ⚠️ Gift card already created for item ${item.id} (detected in transaction) - Existing ID: ${freshItem.generatedGiftCardId}`);
              continue; // Skip creation
            }

            console.log(`[ORDER-PROCESSING] 🔵 CREATING GIFT CARD for item ${item.id} - Amount: ${item.giftCardAmount}€ - Timestamp: ${new Date().toISOString()}`);

            // Générer le code DANS la transaction pour éviter les race conditions
            const code = await generateUniqueGiftCardCodeInTransaction(tx);

            const giftCard = await tx.giftCard.create({
              data: {
                code,
                amount: item.giftCardAmount!,
                clientId: null, // Sera assigné lors de l'utilisation
              },
            });

            console.log(`[ORDER-PROCESSING] 🟢 GIFT CARD CREATED: ${code} - ID: ${giftCard.id} - Amount: ${item.giftCardAmount}€ - Timestamp: ${new Date().toISOString()}`);

            // Lier la carte cadeau à l'order item dans la même transaction
            await tx.orderItem.update({
              where: { id: item.id },
              data: { generatedGiftCardId: giftCard.id },
            });

            console.log(`[ORDER-PROCESSING] ✓ Gift card ${code} linked to OrderItem ${item.id}`);
          }
        }
      });
    } catch (error) {
      console.error(`[ORDER-PROCESSING] ❌ Error creating gift cards/vouchers:`, error);
      // Ne pas throw pour ne pas bloquer le traitement des autres items
    }
  }

  // TRAITER LES AUTRES TYPES D'ITEMS (STAGE, BAPTEME, etc.)
  for (const item of order.orderItems) {
    // IDEMPOTENCE: Vérifier si cet item a déjà été traité
    if (item.type === "STAGE" && item.stageId && !item.stageBookingId) {
      // Créer ou récupérer le stagiaire
      const stagiaire = await findOrCreateStagiaire(item.participantData);

      // Récupérer le type de stage choisi par le client (selectedStageType)
      // Si le stage est de type DOUBLE, le client a choisi soit INITIATION soit PROGRESSION
      // On utilise selectedStageType qui contient le choix réel du client
      const stageType = item.participantData.selectedStageType || item.stage?.type || 'INITIATION';

      // Vérifier que le type est valide pour StageBookingType (pas DOUBLE)
      const validStageType = stageType === 'DOUBLE' ? 'INITIATION' : stageType;

      // Créer la réservation de stage
      const booking = await prisma.stageBooking.create({
        data: {
          stageId: item.stageId,
          stagiaireId: stagiaire.id,
          type: validStageType as any,
        },
      });

      // Lier la réservation à l'order item
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { stageBookingId: booking.id },
      });

      console.log(`Stage booking created: ${booking.id} for stagiaire ${stagiaire.id}`);
    }

    if (item.type === "BAPTEME" && item.baptemeId && !item.baptemeBookingId) {
      // Créer ou récupérer le stagiaire
      const stagiaire = await findOrCreateStagiaire(item.participantData);

      // Créer la réservation de baptême
      const selectedCategory = item.participantData.selectedCategory;

      // Vérifier que la catégorie est valide
      if (!selectedCategory || selectedCategory === "") {
        console.error("Catégorie de baptême manquante pour item:", item.id);
        continue; // Passer à l'item suivant
      }

      const booking = await prisma.baptemeBooking.create({
        data: {
          baptemeId: item.baptemeId,
          stagiaireId: stagiaire.id,
          category: selectedCategory as any,
          hasVideo: item.participantData.hasVideo || false,
        },
      });

      // Lier la réservation à l'order item
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { baptemeBookingId: booking.id },
      });

      console.log(`Bapteme booking created: ${booking.id} for stagiaire ${stagiaire.id}`);
    }

    // GIFT_CARD et GIFT_VOUCHER items sont déjà traités dans la transaction globale ci-dessus
    if (item.type === "GIFT_CARD" || item.type === "GIFT_VOUCHER") {
      continue; // Skip, already processed
    }

    // Marquer le bon cadeau comme utilisé si présent dans le panier (IDEMPOTENCE)
    if (item.participantData.usedGiftVoucherCode && !item.usedGiftVoucherId) {
      const voucherCode = item.participantData.usedGiftVoucherCode;

      // Vérifier si le voucher existe et n'est pas déjà marqué comme utilisé
      const existingVoucher = await prisma.giftVoucher.findUnique({
        where: { code: voucherCode },
      });

      if (existingVoucher && !existingVoucher.isUsed) {
        await prisma.giftVoucher.update({
          where: { code: voucherCode },
          data: {
            isUsed: true,
            usedAt: new Date(),
            reservedBySessionId: null,
            reservedAt: null,
          },
        });

        // Lier le bon utilisé à l'order item
        await prisma.orderItem.update({
          where: { id: item.id },
          data: { usedGiftVoucherId: existingVoucher.id },
        });

        console.log(`Gift voucher ${voucherCode} marked as used`);
      } else if (existingVoucher?.isUsed) {
        console.log(`Gift voucher ${voucherCode} already marked as used`);

        // Lier quand même si pas encore lié
        if (!item.usedGiftVoucherId) {
          await prisma.orderItem.update({
            where: { id: item.id },
            data: { usedGiftVoucherId: existingVoucher.id },
          });
        }
      } else {
        console.warn(`Gift voucher ${voucherCode} not found`);
      }
    }
  }
}

/**
 * Fonction pour préparer les données de l'email
 */
export function prepareEmailData(order: any) {
  // Calculer les totaux
  let depositTotal = 0;
  let remainingTotal = 0;
  const futurePayments: Array<{
    amount: number;
    date: string;
    description: string;
    participantName: string;
  }> = [];

  order.orderItems.forEach((item: any) => {
    if (item.type === 'STAGE') {
      const deposit = item.depositAmount || 0;
      const remaining = item.remainingAmount || 0;
      depositTotal += deposit;
      remainingTotal += remaining;

      if (remaining > 0) {
        const participantName = `${item.participantData?.firstName || ''} ${item.participantData?.lastName || ''}`.trim();
        futurePayments.push({
          amount: remaining,
          date: item.stage?.startDate,
          description: `Solde Stage ${item.stage?.type}`,
          participantName: participantName,
        });
      }
    } else if (item.type === 'BAPTEME') {
      const deposit = item.depositAmount || 0;
      const remaining = item.remainingAmount || 0;
      depositTotal += deposit;
      remainingTotal += remaining;

      if (remaining > 0) {
        const participantName = `${item.participantData?.firstName || ''} ${item.participantData?.lastName || ''}`.trim();
        futurePayments.push({
          amount: remaining,
          date: item.bapteme?.date,
          description: `Solde Baptême ${item.participantData.selectedCategory}`,
          participantName: participantName,
        });
      }
    } else {
      depositTotal += item.totalPrice;
    }
  });

  // Appliquer la réduction des cartes cadeaux
  if (order.discountAmount > 0) {
    depositTotal = Math.max(0, depositTotal - order.discountAmount);
  }

  // Récupérer les informations du premier participant pour le nom et téléphone
  const firstParticipant = order.orderItems[0]?.participantData;
  const customerName = firstParticipant
    ? `${firstParticipant.firstName || ''} ${firstParticipant.lastName || ''}`.trim()
    : 'Client';
  const customerPhone = firstParticipant?.phone || 'Non spécifié';

  return {
    orderNumber: order.orderNumber,
    orderDate: order.createdAt,
    customerEmail: order.customerEmail || order.client?.email || 'non-specifie@placeholder.local',
    customerName,
    customerPhone,
    orderItems: order.orderItems,
    depositTotal,
    remainingTotal,
    totalAmount: order.totalAmount,
    discountAmount: order.discountAmount || 0,
    futurePayments,
  };
}

/**
 * Fonction pour vider le panier
 */
export async function clearCart(sessionId: string) {
  console.log(`[ORDER-PROCESSING] 🧹 Clearing cart for session: ${sessionId}`);

  const cartSession = await prisma.cartSession.findUnique({
    where: { sessionId },
    include: {
      cartItems: true,
    },
  });

  if (cartSession && cartSession.cartItems.length > 0) {
    await prisma.cartItem.deleteMany({
      where: {
        cartSessionId: cartSession.id,
      },
    });
    console.log(`[ORDER-PROCESSING] Cart cleared for session: ${cartSession.id} (${cartSession.cartItems.length} items removed)`);
  } else if (cartSession) {
    console.log(`[ORDER-PROCESSING] Cart already cleared for session: ${cartSession.id}`);
  } else {
    console.log(`[ORDER-PROCESSING] Cart session not found: ${sessionId}`);
  }
}

/**
 * Fonction principale pour finaliser une commande
 * - Crée les réservations
 * - Vide le panier (optionnel)
 * - Envoie les emails de confirmation
 */
export async function finalizeOrder(order: any, sessionId?: string) {
  console.log(`[ORDER-PROCESSING] 🎯 Finalizing order ${order.orderNumber} (${order.id})`);

  try {
    // 1. Créer les réservations pour chaque item
    await createBookingsFromOrder(order);

    // 2. Vider le panier si sessionId fourni
    if (sessionId) {
      await clearCart(sessionId);
    }

    // 3. Préparer les données pour l'email
    const emailData = prepareEmailData(order);

    // 4. Envoyer l'email de confirmation client
    try {
      await sendOrderConfirmationEmail(emailData);
      console.log(`[ORDER-PROCESSING] ✅ Confirmation email sent successfully for order ${order.orderNumber}`);
    } catch (emailError) {
      console.error(`[ORDER-PROCESSING] ⚠️ Failed to send confirmation email for order ${order.orderNumber}:`, emailError);
      // Ne pas faire échouer la finalisation si l'email échoue
    }

    // 5. Envoyer l'email à l'admin
    try {
      await sendAdminNewOrderEmail(emailData);
      console.log(`[ORDER-PROCESSING] ✅ Admin notification email sent successfully`);
    } catch (adminEmailError) {
      console.error(`[ORDER-PROCESSING] ⚠️ Failed to send admin notification email:`, adminEmailError);
      // Ne pas faire échouer la finalisation si l'email échoue
    }

    console.log(`[ORDER-PROCESSING] ✅ Order ${order.orderNumber} finalized successfully`);
  } catch (error) {
    console.error(`[ORDER-PROCESSING] ❌ Error finalizing order ${order.orderNumber}:`, error);
    throw error;
  }
}
