import { Resend } from 'resend';
import { OrderConfirmationEmail } from '@/emails/order-confirmation';
import { AdminNewOrderEmail } from '@/emails/admin-new-order';
import { GiftVoucherPurchaseEmail } from '@/emails/gift-voucher-purchase';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderEmailData {
  orderNumber: string;
  orderDate: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  orderItems: any[];
  depositTotal: number;
  remainingTotal: number;
  totalAmount: number;
  discountAmount?: number;
  futurePayments: Array<{
    amount: number;
    date: string;
    description: string;
    participantName: string;
  }>;
}

export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  try {
    const sender = process.env.RESEND_FROM_EMAIL || 'Serre Chevalier Parapente <noreply@stage-de-parapente.fr>';
    console.log(`[RESEND] 📧 Sending order confirmation email to ${data.customerEmail}`);
    console.log(`[RESEND] 📧 Sender: ${sender}`);

    const { data: emailData, error } = await resend.emails.send({
      from: sender,
      to: [data.customerEmail],
      subject: `Confirmation de réservation - Commande ${data.orderNumber}`,
      react: OrderConfirmationEmail({
        orderNumber: data.orderNumber,
        orderDate: data.orderDate,
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        orderItems: data.orderItems,
        depositTotal: data.depositTotal,
        remainingTotal: data.remainingTotal,
        totalAmount: data.totalAmount,
        discountAmount: data.discountAmount || 0,
        futurePayments: data.futurePayments,
      }),
    });

    if (error) {
      console.error('[RESEND] ❌ Error sending email:', error);
      throw error;
    }

    console.log(`[RESEND] ✅ Email sent successfully. ID: ${emailData?.id}`);
    return { success: true, emailId: emailData?.id };
  } catch (error) {
    console.error('[RESEND] ❌ Failed to send email:', error);
    throw error;
  }
}

export async function sendAdminNewOrderEmail(data: OrderEmailData) {
  try {
    const sender = process.env.RESEND_FROM_EMAIL || 'Serre Chevalier Parapente <noreply@stage-de-parapente.fr>';
    const adminEmail = process.env.ADMIN_EMAIL || '';

    console.log(`[RESEND] 📧 Sending admin notification email to ${adminEmail}`);

    const { data: emailData, error } = await resend.emails.send({
      from: sender,
      to: [adminEmail],
      subject: `Nouvelle commande reçue ! - ${data.orderNumber}`,
      react: AdminNewOrderEmail({
        orderNumber: data.orderNumber,
        orderDate: data.orderDate,
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        orderItems: data.orderItems,
        depositTotal: data.depositTotal,
        remainingTotal: data.remainingTotal,
        totalAmount: data.totalAmount,
        discountAmount: data.discountAmount || 0,
      }),
    });

    if (error) {
      console.error('[RESEND] ❌ Error sending admin email:', error);
      throw error;
    }

    console.log(`[RESEND] ✅ Admin email sent successfully. ID: ${emailData?.id}`);
    return { success: true, emailId: emailData?.id };
  } catch (error) {
    console.error('[RESEND] ❌ Failed to send admin email:', error);
    throw error;
  }
}

interface GiftVoucherEmailData {
  buyerName: string;
  buyerEmail: string;
  recipientName: string;
  recipientEmail?: string;
  notifyRecipient: boolean;
  personalMessage?: string;
  voucherCode: string;
  voucherType: string;
  expiryDate: string;
  purchaseDate: string;
  orderNumber: string;
}

export async function sendGiftVoucherPurchaseEmail(data: GiftVoucherEmailData) {
  try {
    const sender = process.env.RESEND_FROM_EMAIL || 'Serre Chevalier Parapente <noreply@stage-de-parapente.fr>';

    // Déterminer le destinataire selon notifyRecipient
    const recipientEmail = data.notifyRecipient ? data.recipientEmail : data.buyerEmail;
    const subject = data.notifyRecipient
      ? `🎁 Bon cadeau de ${data.buyerName} !`
      : `Votre bon cadeau pour ${data.recipientName} est prêt !`;

    console.log(`[RESEND] 📧 Sending gift voucher email to ${recipientEmail} (${data.notifyRecipient ? 'recipient' : 'buyer'})`);

    const { data: emailData, error } = await resend.emails.send({
      from: sender,
      to: [recipientEmail!],
      subject,
      react: GiftVoucherPurchaseEmail({
        buyerName: data.buyerName,
        buyerEmail: data.buyerEmail,
        recipientName: data.recipientName,
        recipientEmail: data.recipientEmail,
        notifyRecipient: data.notifyRecipient,
        personalMessage: data.personalMessage,
        voucherCode: data.voucherCode,
        voucherType: data.voucherType,
        expiryDate: data.expiryDate,
        purchaseDate: data.purchaseDate,
        orderNumber: data.orderNumber,
      }),
    });

    if (error) {
      console.error('[RESEND] ❌ Error sending gift voucher email:', error);
      throw error;
    }

    console.log(`[RESEND] ✅ Gift voucher email sent successfully. ID: ${emailData?.id}`);
    return { success: true, emailId: emailData?.id };
  } catch (error) {
    console.error('[RESEND] ❌ Failed to send gift voucher email:', error);
    throw error;
  }
}