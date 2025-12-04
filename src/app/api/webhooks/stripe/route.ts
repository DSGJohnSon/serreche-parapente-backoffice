import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { sendOrderConfirmationEmail } from "@/lib/resend";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  if (!stripe) {
    console.error("Stripe not configured");
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    console.log(`[WEBHOOK] 📨 Received event: ${event.id} - Type: ${event.type} - Timestamp: ${new Date().toISOString()}`);
    
    // IDEMPOTENCE: Utiliser upsert pour éviter les race conditions
    // Tenter de créer l'enregistrement de l'événement de manière atomique
    let eventRecord;
    try {
      console.log(`[WEBHOOK] 🔍 Checking if event ${event.id} was already processed...`);
      
      eventRecord = await prisma.processedWebhookEvent.create({
        data: {
          stripeEventId: event.id,
          eventType: event.type,
        },
      });
      
      console.log(`[WEBHOOK] ✅ Event ${event.id} is NEW - Processing...`);
    } catch (error: any) {
      // Si l'événement existe déjà (erreur P2002 = unique constraint violation)
      if (error.code === 'P2002') {
        const existingEvent = await prisma.processedWebhookEvent.findUnique({
          where: { stripeEventId: event.id },
        });
        
        console.log(`[WEBHOOK] ⛔ Event ${event.id} ALREADY PROCESSED at ${existingEvent?.processedAt} - SKIPPING`);
        return NextResponse.json({
          received: true,
          message: "Event already processed",
          processedAt: existingEvent?.processedAt
        });
      }
      // Si c'est une autre erreur, la relancer
      console.error(`[WEBHOOK] ❌ Unexpected error checking event ${event.id}:`, error);
      throw error;
    }

    // L'événement est nouveau, le traiter selon son type
    switch (event.type) {
      case "payment_intent.succeeded":
        console.log(`[WEBHOOK] 💰 Processing payment_intent.succeeded for event ${event.id}`);
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;

      case "payment_intent.payment_failed":
        console.log(`[WEBHOOK] ❌ Processing payment_intent.payment_failed for event ${event.id}`);
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(failedPayment);
        break;

      default:
        console.log(`[WEBHOOK] ℹ️ Unhandled event type: ${event.type}`);
    }

    console.log(`[WEBHOOK] ✅ Event ${event.id} processed successfully`);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId;
  const customerEmail = paymentIntent.metadata.customerEmail;
  const customerDataStr = paymentIntent.metadata.customerData;

  if (!orderId) {
    console.error("No orderId in payment intent metadata");
    return;
  }

  console.log(`Processing successful payment for order: ${orderId}`);

  try {
    // IDEMPOTENCE: Vérifier si la commande a déjà été traitée
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true, id: true },
    });

    if (existingOrder && (existingOrder.status === 'PAID' || existingOrder.status === 'PARTIALLY_PAID')) {
      console.log(`Order ${orderId} already processed with status ${existingOrder.status}`);
      return;
    }

    // 1. CRÉER OU METTRE À JOUR LE CLIENT
    let client;
    if (customerEmail) {
      // Chercher si le client existe déjà
      client = await prisma.client.findUnique({
        where: { email: customerEmail },
      });

      // Si les données client sont fournies dans les métadonnées
      if (customerDataStr) {
        try {
          const customerData = JSON.parse(customerDataStr);
          const clientData = {
            email: customerEmail,
            firstName: customerData.firstName || '',
            lastName: customerData.lastName || '',
            phone: customerData.phone || '',
            address: customerData.address || '',
            postalCode: customerData.postalCode || '',
            city: customerData.city || '',
            country: customerData.country || 'France',
          };

          if (!client) {
            // Créer un nouveau client
            client = await prisma.client.create({
              data: clientData,
            });
            console.log(`Client created: ${client.id} (${client.email})`);
          } else {
            // Mettre à jour le client existant
            client = await prisma.client.update({
              where: { email: customerEmail },
              data: clientData,
            });
            console.log(`Client updated: ${client.id} (${client.email})`);
          }
        } catch (parseError) {
          console.error("Error parsing customer data:", parseError);
        }
      } else if (client) {
        console.log(`Existing client found: ${client.id} (${client.email})`);
      }
    }

    // 2. Récupérer la commande avec tous ses items (incluant depositAmount et remainingAmount)
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            stage: true,
            bapteme: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // 3. Mettre à jour le statut du paiement SEULEMENT s'il n'est pas déjà SUCCEEDED
    const existingPayment = await prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
      select: { id: true, status: true },
    });

    if (!existingPayment) {
      throw new Error("Payment not found");
    }

    let payment;
    if (existingPayment.status !== "SUCCEEDED") {
      payment = await prisma.payment.update({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: {
          status: "SUCCEEDED",
        },
      });
      console.log(`Payment ${payment.id} status updated to SUCCEEDED`);
    } else {
      payment = existingPayment;
      console.log(`Payment ${payment.id} already has status SUCCEEDED`);
    }

    // 4. Vérifier si les allocations existent déjà
    const existingAllocations = await prisma.paymentAllocation.findMany({
      where: { paymentId: payment.id },
    });

    if (existingAllocations.length === 0) {
      // 5. Répartir le paiement entre les OrderItems selon la logique de priorité
      await allocatePaymentToOrderItems(payment, order.orderItems);
    } else {
      console.log(`Payment allocations already exist for payment ${payment.id} (${existingAllocations.length} allocations)`);
    }

    // 5. Déterminer le statut de la commande
    const hasItemsWithRemainingAmount = order.orderItems.some(
      item => (item.type === 'STAGE' || item.type === 'BAPTEME') && item.remainingAmount && item.remainingAmount > 0
    );

    const newStatus = hasItemsWithRemainingAmount ? "PARTIALLY_PAID" : "PAID";

    // 6. Mettre à jour la commande avec le client et le statut approprié SEULEMENT si nécessaire
    let updatedOrder;
    const needsUpdate = order.status !== newStatus || (client && order.clientId !== client.id);
    
    if (needsUpdate) {
      updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          ...(client && order.clientId !== client.id && { clientId: client.id }), // Lier le client si pas déjà lié
        },
        include: {
          orderItems: {
            include: {
              stage: true,
              bapteme: true,
            },
          },
          client: true,
        },
      });
      console.log(`Order ${updatedOrder.orderNumber} status updated to ${newStatus}`);
    } else {
      // Recharger la commande avec les relations nécessaires
      updatedOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: {
            include: {
              stage: true,
              bapteme: true,
            },
          },
          client: true,
        },
      });
      console.log(`Order ${updatedOrder!.orderNumber} already has correct status ${newStatus}`);
    }

    if (!updatedOrder) {
      throw new Error("Order not found after update");
    }

    // 7. Créer les réservations pour chaque item
    await createBookingsFromOrder(updatedOrder);

    // 8. VIDER LE PANIER après confirmation du paiement (IDEMPOTENCE: vérifier d'abord)
    const sessionId = paymentIntent.metadata.sessionId;
    
    if (sessionId) {
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
        console.log(`Cart cleared for session: ${cartSession.id} (${cartSession.cartItems.length} items removed)`);
      } else if (cartSession) {
        console.log(`Cart already cleared for session: ${cartSession.id}`);
      } else {
        console.log(`Cart session not found: ${sessionId}`);
      }
    } else {
      console.log("No sessionId in payment intent metadata - cart not cleared");
    }

    console.log(`Order ${updatedOrder.orderNumber} confirmed with status ${newStatus}, client ${client ? 'created/linked' : 'not found'}, and cart cleared`);

    // 9. ENVOYER L'EMAIL DE CONFIRMATION
    try {
      console.log(`[WEBHOOK] 📧 Preparing to send confirmation email for order ${updatedOrder.orderNumber}`);
      
      // Calculer les totaux pour l'email
      const emailData = prepareEmailData(updatedOrder);
      
      // Envoyer l'email
      await sendOrderConfirmationEmail(emailData);
      
      console.log(`[WEBHOOK] ✅ Confirmation email sent successfully for order ${updatedOrder.orderNumber}`);
    } catch (emailError) {
      // Ne pas faire échouer le webhook si l'email échoue
      console.error(`[WEBHOOK] ⚠️ Failed to send confirmation email for order ${updatedOrder.orderNumber}:`, emailError);
      // L'erreur est loggée mais ne bloque pas le traitement du paiement
    }
  } catch (error) {
    console.error("Error handling payment success:", error);
    throw error;
  }
}

// Fonction pour préparer les données de l'email
function prepareEmailData(order: any) {
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

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.orderId;

  if (!orderId) {
    console.error("No orderId in payment intent metadata");
    return;
  }

  console.log(`Processing failed payment for order: ${orderId}`);

  try {
    // Mettre à jour le statut du paiement
    await prisma.payment.update({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: {
        status: "FAILED",
      },
    });

    // Optionnel: Mettre à jour le statut de la commande
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });

    console.log(`Payment failed for order: ${orderId}`);
  } catch (error) {
    console.error("Error handling payment failure:", error);
    throw error;
  }
}

// Fonction pour créer les réservations à partir d'une commande
async function createBookingsFromOrder(order: any) {
  console.log(`[WEBHOOK] 🎯 createBookingsFromOrder called for order ${order.id} with ${order.orderItems.length} items - Timestamp: ${new Date().toISOString()}`);
  
  // TRAITER TOUS LES GIFT_CARDS DANS UNE SEULE TRANSACTION GLOBALE
  const giftCardItems = order.orderItems.filter((item: any) => item.type === "GIFT_CARD");
  
  if (giftCardItems.length > 0) {
    try {
      await prisma.$transaction(async (tx) => {
        for (const item of giftCardItems) {
          // Extraire les données du participantData
          const participantData = typeof item.participantData === 'string'
            ? JSON.parse(item.participantData)
            : item.participantData;

          console.log(`Processing GIFT_CARD item ${item.id}:`, {
            hasVoucherProductType: !!participantData?.voucherProductType,
            voucherProductType: participantData?.voucherProductType,
            giftCardAmount: item.giftCardAmount,
            hasGeneratedVoucher: !!item.generatedGiftVoucherId,
            hasGeneratedCard: !!item.generatedGiftCardId,
          });

          // Vérifier si c'est une carte cadeau monétaire OU un bon cadeau pour une activité
          if (participantData?.voucherProductType) {
            // C'est un BON CADEAU pour une activité spécifique (stage ou baptême)
            console.log(`[WEBHOOK] Item ${item.id} is a GIFT VOUCHER (not a gift card)`);
            
            // Vérifier dans la transaction (lock pessimiste)
            const freshItem = await tx.orderItem.findUnique({
              where: { id: item.id },
              select: { generatedGiftVoucherId: true },
            });

            console.log(`[WEBHOOK] Fresh check for item ${item.id}: generatedGiftVoucherId = ${freshItem?.generatedGiftVoucherId || 'NULL'}`);

            if (freshItem?.generatedGiftVoucherId) {
              console.log(`[WEBHOOK] ⚠️ Gift voucher already created for item ${item.id} (detected in transaction) - Existing ID: ${freshItem.generatedGiftVoucherId}`);
              continue; // Skip creation
            }

            console.log(`[WEBHOOK] 🔵 CREATING GIFT VOUCHER for item ${item.id} - Type: ${participantData.voucherProductType} - Timestamp: ${new Date().toISOString()}`);

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
                purchasePrice: item.unitPrice || 0,
                recipientName: participantData.recipientName || 'Non spécifié',
                recipientEmail: participantData.recipientEmail || 'non-specifie@placeholder.local',
                expiryDate,
                clientId: order.clientId,
              },
            });

            console.log(`[WEBHOOK] 🟢 GIFT VOUCHER CREATED: ${voucher.code} - ID: ${voucher.id} - Type: ${voucher.productType} - Timestamp: ${new Date().toISOString()}`);

            // Lier le bon cadeau à l'order item dans la même transaction
            await tx.orderItem.update({
              where: { id: item.id },
              data: { generatedGiftVoucherId: voucher.id },
            });

            console.log(`[WEBHOOK] ✓ Gift voucher ${voucher.code} linked to OrderItem ${item.id}`);
          } else {
            // C'est une CARTE CADEAU monétaire classique (pas un bon cadeau)
            console.log(`[WEBHOOK] Item ${item.id} is a GIFT CARD (monetary)`);
            
            // Vérifier dans la transaction (lock pessimiste)
            const freshItem = await tx.orderItem.findUnique({
              where: { id: item.id },
              select: { generatedGiftCardId: true },
            });

            console.log(`[WEBHOOK] Fresh check for item ${item.id}: generatedGiftCardId = ${freshItem?.generatedGiftCardId || 'NULL'}`);

            if (freshItem?.generatedGiftCardId) {
              console.log(`[WEBHOOK] ⚠️ Gift card already created for item ${item.id} (detected in transaction) - Existing ID: ${freshItem.generatedGiftCardId}`);
              continue; // Skip creation
            }

            console.log(`[WEBHOOK] 🔵 CREATING GIFT CARD for item ${item.id} - Amount: ${item.giftCardAmount}€ - Timestamp: ${new Date().toISOString()}`);
            
            // Générer le code DANS la transaction pour éviter les race conditions
            const code = await generateUniqueGiftCardCodeInTransaction(tx);

            const giftCard = await tx.giftCard.create({
              data: {
                code,
                amount: item.giftCardAmount!,
                clientId: null, // Sera assigné lors de l'utilisation
              },
            });

            console.log(`[WEBHOOK] 🟢 GIFT CARD CREATED: ${code} - ID: ${giftCard.id} - Amount: ${item.giftCardAmount}€ - Timestamp: ${new Date().toISOString()}`);

            // Lier la carte cadeau à l'order item dans la même transaction
            await tx.orderItem.update({
              where: { id: item.id },
              data: { generatedGiftCardId: giftCard.id },
            });

            console.log(`[WEBHOOK] ✓ Gift card ${code} linked to OrderItem ${item.id}`);
          }
        }
      });
    } catch (error) {
      console.error(`[WEBHOOK] ❌ Error creating gift cards/vouchers:`, error);
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

    // GIFT_CARD items sont déjà traités dans la transaction globale ci-dessus
    if (item.type === "GIFT_CARD") {
      continue; // Skip, already processed
    }

    if (item.type === "GIFT_VOUCHER") {
      // GIFT_VOUCHER type = utilisation d'un bon cadeau existant pour réserver une activité
      // Le bon cadeau doit être marqué comme utilisé (pas de création de nouveau voucher)
      console.log(`GIFT_VOUCHER item ${item.id} - voucher will be marked as used below`);
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

// Fonction pour trouver ou créer/mettre à jour un stagiaire
async function findOrCreateStagiaire(participantData: any) {
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

// Fonction pour générer un code unique de carte cadeau
async function generateUniqueGiftCardCode(): Promise<string> {
  let code: string;
  let exists = true;

  do {
    const prefix = "SCP";
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    code = `${prefix}-${timestamp}-${random}`;

    const existing = await prisma.giftCard.findUnique({
      where: { code },
    });
    exists = !!existing;
  } while (exists);

  return code;
}
// Fonction pour générer un code unique de carte cadeau DANS une transaction
async function generateUniqueGiftCardCodeInTransaction(tx: any): Promise<string> {
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


// Fonction pour générer un code unique de bon cadeau (utilisée hors transaction)
async function generateUniqueVoucherCode(): Promise<string> {
  let code: string;
  let exists = true;

  do {
    const prefix = "GVSCP";
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    code = `${prefix}-${timestamp}-${random}`;

    const existing = await prisma.giftVoucher.findUnique({
      where: { code },
    });
    exists = !!existing;
  } while (exists);

  return code;
}

// Fonction pour générer un code unique de bon cadeau DANS une transaction
async function generateUniqueVoucherCodeInTransaction(tx: any): Promise<string> {
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

// Fonction pour répartir un paiement entre les OrderItems
async function allocatePaymentToOrderItems(payment: any, orderItems: any[]) {
  console.log(`Allocating payment ${payment.id} (${payment.amount}€) to ${orderItems.length} items`);
  
  // Créer les allocations pour chaque OrderItem selon son prix
  for (const item of orderItems) {
    let allocatedAmount = 0;
    
    if (item.type === 'STAGE') {
      // Pour les stages, allouer le montant de l'acompte
      allocatedAmount = item.depositAmount || 0;
      console.log(`STAGE item ${item.id}: depositAmount=${item.depositAmount}, totalPrice=${item.totalPrice}, remainingAmount=${item.remainingAmount}`);
    } else if (item.type === 'BAPTEME') {
      // Pour les baptêmes, allouer le montant de l'acompte (acompte + vidéo)
      allocatedAmount = item.depositAmount || 0;
      console.log(`BAPTEME item ${item.id}: depositAmount=${item.depositAmount}, totalPrice=${item.totalPrice}, remainingAmount=${item.remainingAmount}, hasVideo=${item.participantData?.hasVideo}`);
    } else if (item.type === 'GIFT_CARD') {
      // Pour les cartes cadeaux, allouer le montant de la carte
      allocatedAmount = item.giftCardAmount || 0;
      console.log(`GIFT_CARD item ${item.id}: giftCardAmount=${item.giftCardAmount}`);
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