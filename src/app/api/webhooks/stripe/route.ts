import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

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
    // IDEMPOTENCE: Vérifier si l'événement a déjà été traité
    const existingEvent = await prisma.processedWebhookEvent.findUnique({
      where: { stripeEventId: event.id },
    });

    if (existingEvent) {
      console.log(`Event ${event.id} already processed at ${existingEvent.processedAt}`);
      return NextResponse.json({
        received: true,
        message: "Event already processed",
        processedAt: existingEvent.processedAt
      });
    }

    // Traiter l'événement selon son type
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent, existingEvent);
        break;

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(failedPayment);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Marquer l'événement comme traité seulement s'il ne l'était pas déjà
    if (!existingEvent) {
      await prisma.processedWebhookEvent.create({
        data: {
          stripeEventId: event.id,
          eventType: event.type,
        },
      });
    }

    console.log(`Event ${event.id} processed successfully`);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent, existingEvent?: any) {
  const orderId = paymentIntent.metadata.orderId;
  const customerEmail = paymentIntent.metadata.customerEmail;
  const customerDataStr = paymentIntent.metadata.customerData;

  if (!orderId) {
    console.error("No orderId in payment intent metadata");
    return;
  }

  console.log(`Processing successful payment for order: ${orderId}`);

  try {
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

    // 3. Mettre à jour le statut du paiement et créer les allocations
    const payment = await prisma.payment.update({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: {
        status: "SUCCEEDED",
      },
    });

    // 4. Supprimer les allocations existantes pour ce paiement (au cas où elles seraient incorrectes)
    // Toujours faire cette correction, même si l'événement a déjà été traité
    await prisma.paymentAllocation.deleteMany({
      where: { paymentId: payment.id },
    });

    // 5. Répartir le paiement entre les OrderItems selon la logique de priorité
    await allocatePaymentToOrderItems(payment, order.orderItems);

    // 5. Déterminer le statut de la commande
    const hasItemsWithRemainingAmount = order.orderItems.some(
      item => (item.type === 'STAGE' || item.type === 'BAPTEME') && item.remainingAmount && item.remainingAmount > 0
    );

    const newStatus = hasItemsWithRemainingAmount ? "PARTIALLY_PAID" : "PAID";

    // 6. Mettre à jour la commande avec le client et le statut approprié
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        ...(client && { clientId: client.id }), // Lier le client si créé/trouvé
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

    // 7. Créer les réservations pour chaque item
    await createBookingsFromOrder(updatedOrder);

    // 8. VIDER LE PANIER après confirmation du paiement
    const sessionId = paymentIntent.metadata.sessionId;
    
    if (sessionId) {
      const cartSession = await prisma.cartSession.findUnique({
        where: { sessionId },
      });

      if (cartSession) {
        await prisma.cartItem.deleteMany({
          where: {
            cartSessionId: cartSession.id,
          },
        });
        console.log(`Cart cleared for session: ${cartSession.id}`);
      }
    } else {
      console.log("No sessionId in payment intent metadata - cart not cleared");
    }

    console.log(`Order ${updatedOrder.orderNumber} confirmed with status ${newStatus}, client ${client ? 'created/linked' : 'not found'}, and cart cleared`);
  } catch (error) {
    console.error("Error handling payment success:", error);
    throw error;
  }
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
  for (const item of order.orderItems) {
    if (item.type === "STAGE" && item.stageId) {
      // Créer ou récupérer le stagiaire
      const stagiaire = await findOrCreateStagiaire(item.participantData);

      // Récupérer le type de stage depuis participantData ou utiliser le type du stage
      const stageType = item.participantData.stageType || item.stage?.type || 'INITIATION';

      // Créer la réservation de stage
      const booking = await prisma.stageBooking.create({
        data: {
          stageId: item.stageId,
          stagiaireId: stagiaire.id,
          type: stageType as any,
        },
      });

      // Lier la réservation à l'order item
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { stageBookingId: booking.id },
      });

      console.log(`Stage booking created: ${booking.id} for stagiaire ${stagiaire.id}`);
    }

    if (item.type === "BAPTEME" && item.baptemeId) {
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

    if (item.type === "GIFT_CARD") {
      // Générer un code unique pour la carte cadeau
      const code = await generateUniqueGiftCardCode();

      const giftCard = await prisma.giftCard.create({
        data: {
          code,
          amount: item.giftCardAmount!,
          clientId: null, // Sera assigné lors de l'utilisation
        },
      });

      // Lier la carte cadeau à l'order item
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { generatedGiftCardId: giftCard.id },
      });
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