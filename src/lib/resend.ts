import { Resend } from 'resend';
import { OrderConfirmationEmail } from '@/emails/order-confirmation';

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