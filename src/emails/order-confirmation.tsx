import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Row,
  Column,
  Img,
} from '@react-email/components';
import * as React from 'react';

interface OrderItem {
  id: string;
  type: string;
  totalPrice: number;
  giftCardAmount?: number;
  participantData: any;
  stage?: any;
  bapteme?: any;
}

interface OrderConfirmationEmailProps {
  orderNumber: string;
  orderDate: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  orderItems: OrderItem[];
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

export const OrderConfirmationEmail = ({
  orderNumber = 'CMD-2024-001',
  orderDate = new Date().toISOString(),
  customerEmail = 'client@example.com',
  customerName = 'Jean Dupont',
  customerPhone = '06 12 34 56 78',
  orderItems = [],
  depositTotal = 0,
  remainingTotal = 0,
  totalAmount = 0,
  discountAmount = 0,
  futurePayments = [],
}: OrderConfirmationEmailProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getItemTitle = (item: OrderItem) => {
    switch (item.type) {
      case 'STAGE':
        return `Stage ${item.stage?.type} - ${formatDate(item.stage?.startDate)}`;
      case 'BAPTEME':
        return `Baptême ${item.participantData.selectedCategory} - ${formatDate(item.bapteme?.date)}`;
      case 'GIFT_VOUCHER':
        // Bon cadeau acheté
        const voucherType = item.participantData.voucherProductType === 'STAGE'
          ? `Stage ${item.participantData.voucherStageCategory}`
          : `Baptême ${item.participantData.voucherBaptemeCategory}`;
        return `🎁 Bon Cadeau - ${voucherType}`;
      case 'GIFT_CARD':
        return `Carte cadeau ${item.giftCardAmount}€`;
      default:
        return 'Article';
    }
  };

  const getCategoryPrice = (category: string) => {
    const prices: Record<string, number> = {
      AVENTURE: 110,
      DUREE: 150,
      LONGUE_DUREE: 185,
      ENFANT: 90,
      HIVER: 130,
    };
    return prices[category] || 110;
  };

  return (
    <Html>
      <Head />
      <Preview>Confirmation de votre réservation - Commande {orderNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              alt="Photographie de Serre Chevalier Parapente"
              style={{ width: '250px', height: '250px', margin: '0 auto' }}
              src="https://serreche-parapente-backoffice.vercel.app/favicon/android-chrome-512x512.png"
            />
            <Heading style={h1}>🎉 Réservation confirmée !</Heading>
            <Text style={subtitle}>Votre paiement a été traité avec succès</Text>
          </Section>

          {/* Order Info */}
          <Section style={section}>
            <Heading as="h2" style={h2}>
              Commande {orderNumber}
            </Heading>
            <div style={badge}>✓ Confirmée</div>

            <Hr style={hr} />

            <Row>
              <Column>
                <Text style={label}>Date de commande</Text>
                <Text style={value}>{formatDate(orderDate)}</Text>
              </Column>
              <Column>
                <Text style={label}>Email de confirmation</Text>
                <Text style={value}>{customerEmail}</Text>
              </Column>
            </Row>

            <Hr style={hr} />

            <Heading as="h3" style={h3}>Informations client</Heading>
            <Row>
              <Column>
                <Text style={label}>Nom complet</Text>
                <Text style={value}>{customerName}</Text>
              </Column>
              <Column>
                <Text style={label}>Téléphone</Text>
                <Text style={value}>{customerPhone}</Text>
              </Column>
            </Row>
          </Section>

          {/* Order Items */}
          <Section style={section}>
            <Heading as="h2" style={h2}>Détail de votre commande</Heading>

            {orderItems.map((item) => (
              <div key={item.id} style={itemCard}>
                <div style={itemHeader}>
                  <div>
                    <Text style={itemTitle}>{getItemTitle(item)}</Text>
                    {item.type === 'GIFT_VOUCHER' ? (
                      // Bon cadeau acheté
                      <>
                        <Text style={itemSubtitle}>
                          Pour: {item.participantData.recipientName}
                        </Text>
                        {item.participantData.recipientEmail && (
                          <Text style={itemSubtitle}>
                            Email bénéficiaire: {item.participantData.recipientEmail}
                          </Text>
                        )}
                        {item.participantData.personalMessage && (
                          <Text style={itemSubtitle}>
                            Message: &apos;{item.participantData.personalMessage}&apos;
                          </Text>
                        )}
                      </>
                    ) : item.participantData?.usedGiftVoucherCode ? (
                      // Réservation avec bon cadeau utilisé
                      <>
                        <Text style={itemSubtitle}>
                          Participant: {item.participantData.firstName} {item.participantData.lastName}
                        </Text>
                        <Text style={voucherCode}>
                          🎁 Bon cadeau appliqué - Code: {item.participantData.usedGiftVoucherCode}
                        </Text>
                      </>
                    ) : (
                      // Réservation normale
                      <Text style={itemSubtitle}>
                        Participant: {item.participantData.firstName} {item.participantData.lastName}
                      </Text>
                    )}
                  </div>
                  <div style={itemPrice}>
                    {item.participantData?.usedGiftVoucherCode ? (
                      // Réservation avec bon cadeau = GRATUIT
                      <>
                        <Text style={strikethrough}>
                          {item.type === 'STAGE'
                            ? item.stage?.price
                            : getCategoryPrice(item.participantData.selectedCategory)}€
                        </Text>
                        <Text style={freePrice}>GRATUIT</Text>
                      </>
                    ) : (
                      <Text style={price}>{item.totalPrice}€</Text>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </Section>

          {/* Payment Summary */}
          <Section style={section}>
            <Heading as="h2" style={h2}>Récapitulatif des paiements</Heading>

            {/* Paid Today */}
            <div style={paidBox}>
              <div style={flexBetween}>
                <div>
                  <Text style={paidLabel}>PAYÉ AUJOURD&apos;HUI</Text>
                  <Text style={paidAmount}>{depositTotal.toFixed(2)}€</Text>
                  <Text style={paidDate}>Transaction effectuée le {formatDateTime(orderDate)}</Text>
                </div>
                <div style={paidBadge}>✓ Payé</div>
              </div>

              {discountAmount > 0 && (
                <div style={discountBox}>
                  <div style={flexBetween}>
                    <Text style={discountLabel}>Cartes cadeaux appliquées</Text>
                    <Text style={discountAmountStyle}>-{discountAmount.toFixed(2)}€</Text>
                  </div>
                </div>
              )}
            </div>

            {/* Future Payments */}
            {remainingTotal > 0 && (
              <div style={futureBox}>
                <Heading as="h4" style={h4}>Règlements futurs</Heading>
                <Text style={futureText}>
                  Solde total à venir : <strong>{remainingTotal.toFixed(2)}€</strong>
                </Text>
                <Text style={futureNote}>
                  Les soldes seront à régler sur place le jour de l&apos;activité.
                </Text>

                {futurePayments.map((payment, index) => (
                  <div key={index} style={futurePayment}>
                    <Text style={futurePaymentName}>{payment.participantName}</Text>
                    <div style={flexBetween}>
                      <Text style={futurePaymentDesc}>
                        {payment.description} - {formatDate(payment.date)}
                      </Text>
                      <Text style={futurePaymentAmount}>{payment.amount.toFixed(2)}€</Text>
                    </div>
                    <Text style={futurePaymentNote}>
                      À régler <strong>sur place</strong> le jour de l&apos;activité
                    </Text>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div style={totalBox}>
              <div style={flexBetween}>
                <div>
                  <Text style={totalLabel}>TOTAL DE LA COMMANDE</Text>
                  <Text style={totalAmountStyle}>{totalAmount.toFixed(2)}€</Text>
                  <Text style={totalNote}>TVA incluse</Text>
                </div>
              </div>
            </div>
          </Section>

          {/* Next Steps */}
          <Section style={section}>
            <Heading as="h2" style={h2}>Prochaines étapes</Heading>

            <div style={stepItem}>
              <Text style={stepIcon}>📧</Text>
              <div>
                <Text style={stepTitle}>Confirmation par email</Text>
                <Text style={stepDesc}>
                  Vous avez reçu cet email de confirmation avec tous les détails
                </Text>
              </div>
            </div>

            <div style={stepItem}>
              <Text style={stepIcon}>📞</Text>
              <div>
                <Text style={stepTitle}>Contact sous 24h</Text>
                <Text style={stepDesc}>
                  Notre équipe vous contactera pour confirmer les détails de votre activité
                </Text>
              </div>
            </div>

            <div style={stepItem}>
              <Text style={stepIcon}>📅</Text>
              <div>
                <Text style={stepTitle}>Rappels automatiques</Text>
                <Text style={stepDesc}>
                  Vous recevrez des rappels 7 jours puis 24h avant votre activité
                </Text>
              </div>
            </div>
          </Section>

          {/* Contact */}
          <Section style={section}>
            <Heading as="h2" style={h2}>Besoin d&apos;aide ?</Heading>
            <Row>
              <Column>
                <Text style={label}>Téléphone</Text>
                <Text style={contactLink}>06 45 91 35 95</Text>
              </Column>
              <Column>
                <Text style={label}>Email</Text>
                <Text style={contactLink}>contact@stage-de-parapente.fr</Text>
              </Column>
            </Row>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Merci d&apos;avoir choisi Serre Chevalier Parapente !
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} Serre Chevalier Parapente - Tous droits réservés
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderConfirmationEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  textAlign: 'center' as const,
  padding: '32px 0',
};

const h1 = {
  color: '#15803d',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 8px',
  padding: '0',
};

const subtitle = {
  color: '#4b5563',
  fontSize: '16px',
  margin: '0',
};

const section = {
  padding: '24px 32px',
};

const h2 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const h3 = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  margin: '16px 0 8px',
};

const h4 = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px',
};

const badge = {
  display: 'inline-block',
  backgroundColor: '#d1fae5',
  color: '#065f46',
  padding: '4px 12px',
  borderRadius: '9999px',
  fontSize: '14px',
  fontWeight: '500',
  marginBottom: '16px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '16px 0',
};

const label = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0 0 4px',
};

const value = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px',
};

const itemCard = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '12px',
  backgroundColor: '#f9fafb',
};

const itemHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
};

const itemTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 4px',
};

const itemSubtitle = {
  fontSize: '14px',
  color: '#6b7280',
  fontWeight: '500',
  margin: '0',
};

const voucherCode = {
  fontSize: '12px',
  color: '#0891b2',
  margin: '4px 0 0',
};

const itemPrice = {
  textAlign: 'right' as const,
};

const price = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0',
};

const strikethrough = {
  fontSize: '14px',
  color: '#9ca3af',
  textDecoration: 'line-through',
  margin: '0',
};

const freePrice = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#0891b2',
  margin: '0',
};

const paidBox = {
  backgroundColor: '#d1fae5',
  border: '1px solid #6ee7b7',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '16px',
};

const flexBetween = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const paidLabel = {
  color: '#065f46',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 4px',
};

const paidAmount = {
  color: '#059669',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 4px',
};

const paidDate = {
  color: '#059669',
  fontSize: '12px',
  margin: '0',
};

const paidBadge = {
  backgroundColor: '#d1fae5',
  color: '#065f46',
  padding: '4px 12px',
  borderRadius: '9999px',
  fontSize: '14px',
  fontWeight: '500',
};

const discountBox = {
  backgroundColor: '#d1fae5',
  borderRadius: '8px',
  padding: '12px',
  marginTop: '12px',
};

const discountLabel = {
  color: '#065f46',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
};

const discountAmountStyle = {
  color: '#065f46',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
};

const futureBox = {
  backgroundColor: '#fed7aa',
  border: '1px solid #fdba74',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '16px',
};

const futureText = {
  color: '#78350f',
  fontSize: '14px',
  margin: '0 0 4px',
};

const futureNote = {
  color: '#92400e',
  fontSize: '12px',
  margin: '0 0 12px',
};

const futurePayment = {
  borderLeft: '2px solid #fb923c',
  paddingLeft: '12px',
  marginBottom: '12px',
};

const futurePaymentName = {
  color: '#78350f',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0 0 4px',
};

const futurePaymentDesc = {
  color: '#92400e',
  fontSize: '14px',
  margin: '0',
};

const futurePaymentAmount = {
  color: '#78350f',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
};

const futurePaymentNote = {
  color: '#b45309',
  fontSize: '12px',
  margin: '4px 0 0',
};

const totalBox = {
  backgroundColor: '#f1f5f9',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  padding: '16px',
};

const totalLabel = {
  color: '#475569',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 4px',
};

const totalAmountStyle = {
  color: '#1e293b',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 4px',
};

const totalNote = {
  color: '#64748b',
  fontSize: '12px',
  margin: '0',
};

const stepItem = {
  display: 'flex',
  gap: '12px',
  marginBottom: '16px',
};

const stepIcon = {
  fontSize: '24px',
  margin: '0',
};

const stepTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 4px',
};

const stepDesc = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0',
};

const contactLink = {
  color: '#2563eb',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 16px',
};

const footer = {
  textAlign: 'center' as const,
  padding: '32px',
  borderTop: '1px solid #e5e7eb',
};

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '4px 0',
};