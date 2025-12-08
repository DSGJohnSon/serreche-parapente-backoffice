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
    Link,
    Button,
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
    remainingAmount?: number;
}

interface AdminNewOrderEmailProps {
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
}

export const AdminNewOrderEmail = ({
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
}: AdminNewOrderEmailProps) => {
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

    const generateGoogleCalendarLink = (item: OrderItem) => {
        let title = '';
        let startDate: Date | null = null;
        let endDate: Date | null = null;
        let details = `Client: ${item.participantData.firstName} ${item.participantData.lastName}\n`;
        details += `Tel: ${item.participantData.phone || customerPhone}\n`;
        details += `Email: ${item.participantData.email || customerEmail}\n`;
        details += `Commande: ${orderNumber}\n`;

        if (item.type === 'STAGE' && item.stage?.startDate) {
            title = `Stage ${item.stage.type} - ${item.participantData.firstName} ${item.participantData.lastName}`;
            startDate = new Date(item.stage.startDate);
            // Assume stage starts at 9am
            startDate.setHours(9, 0, 0, 0);
            endDate = new Date(startDate);
            // Assume 5 days duration for stage, or just 1 day event if unknown
            endDate.setDate(endDate.getDate() + 5);
            details += `Reste à payer: ${item.remainingAmount || 0}€\n`;
        } else if (item.type === 'BAPTEME' && item.bapteme?.date) {
            title = `Baptême ${item.participantData.selectedCategory} - ${item.participantData.firstName} ${item.participantData.lastName}`;
            startDate = new Date(item.bapteme.date);
            endDate = new Date(startDate);
            // Assume 1 hour duration
            endDate.setHours(endDate.getHours() + 1);
            details += `Reste à payer: ${item.remainingAmount || 0}€\n`;
            if (item.participantData.hasVideo) {
                details += `Option Vidéo: OUI\n`;
            }
        } else {
            return null;
        }

        const formatDateForUrl = (date: Date) => {
            return date.toISOString().replace(/-|:|\.\d+/g, '');
        };

        const dates = `${formatDateForUrl(startDate)}/${formatDateForUrl(endDate)}`;
        const location = 'Serre Chevalier Parapente';

        const url = new URL('https://www.google.com/calendar/render');
        url.searchParams.append('action', 'TEMPLATE');
        url.searchParams.append('text', title);
        url.searchParams.append('dates', dates);
        url.searchParams.append('details', details);
        url.searchParams.append('location', location);

        return url.toString();
    };

    return (
        <Html>
            <Head />
            <Preview>Nouvelle commande reçue ! - {orderNumber}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Img
                            alt="Photographie de Serre Chevalier Parapente"
                            style={{ width: '150px', height: '150px', margin: '0 auto' }}
                            src="https://serreche-parapente-backoffice.vercel.app/favicon/android-chrome-512x512.png"
                        />
                        <Heading style={h1}>🔔 Nouvelle Commande !</Heading>
                        <Text style={subtitle}>Une nouvelle réservation a été effectuée</Text>
                    </Section>

                    {/* Order Info */}
                    <Section style={section}>
                        <Heading as="h2" style={h2}>
                            Commande {orderNumber}
                        </Heading>

                        <Hr style={hr} />

                        <Row>
                            <Column>
                                <Text style={label}>Date de commande</Text>
                                <Text style={value}>{formatDate(orderDate)}</Text>
                            </Column>
                            <Column>
                                <Text style={label}>Montant Total</Text>
                                <Text style={value}>{totalAmount.toFixed(2)}€</Text>
                            </Column>
                        </Row>

                        <Hr style={hr} />

                        <Heading as="h3" style={h3}>Client</Heading>
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
                        <Row>
                            <Column>
                                <Text style={label}>Email</Text>
                                <Text style={value}>{customerEmail}</Text>
                            </Column>
                        </Row>
                    </Section>

                    {/* Order Items & Calendar Links */}
                    <Section style={section}>
                        <Heading as="h2" style={h2}>Détail de la commande</Heading>

                        {orderItems.map((item) => {
                            const calendarLink = generateGoogleCalendarLink(item);

                            return (
                                <div key={item.id} style={itemCard}>
                                    <div style={itemHeader}>
                                        <div>
                                            <Text style={itemTitle}>{getItemTitle(item)}</Text>
                                            {item.type === 'GIFT_VOUCHER' ? (
                                                // Bon cadeau acheté
                                                <>
                                                    <Text style={itemSubtitle}>
                                                        Acheteur: {item.participantData.buyerName} ({item.participantData.buyerEmail})
                                                    </Text>
                                                    <Text style={itemSubtitle}>
                                                        Bénéficiaire: {item.participantData.recipientName}
                                                        {item.participantData.recipientEmail && ` (${item.participantData.recipientEmail})`}
                                                    </Text>
                                                    {item.participantData.notifyRecipient ? (
                                                        <Text style={itemSubtitle}>
                                                            ✅ Notification automatique au bénéficiaire
                                                        </Text>
                                                    ) : (
                                                        <Text style={itemSubtitle}>
                                                            📧 Code à transmettre manuellement
                                                        </Text>
                                                    )}
                                                </>
                                            ) : item.participantData?.usedGiftVoucherCode ? (
                                                // Réservation avec bon cadeau utilisé
                                                <>
                                                    <Text style={itemSubtitle}>
                                                        Participant: {item.participantData.firstName} {item.participantData.lastName}
                                                    </Text>
                                                    <Text style={itemSubtitle}>
                                                        Tel: {item.participantData.phone || customerPhone}
                                                    </Text>
                                                    <Text style={itemSubtitle}>
                                                        🎁 Bon cadeau utilisé: {item.participantData.usedGiftVoucherCode}
                                                    </Text>
                                                    <Text style={itemSubtitle}>
                                                        Reste à payer: <strong>0€</strong> (bon cadeau)
                                                    </Text>
                                                </>
                                            ) : (
                                                // Réservation normale
                                                <>
                                                    <Text style={itemSubtitle}>
                                                        Participant: {item.participantData.firstName} {item.participantData.lastName}
                                                    </Text>
                                                    <Text style={itemSubtitle}>
                                                        Tel: {item.participantData.phone || customerPhone}
                                                    </Text>
                                                    {(item.type === 'STAGE' || item.type === 'BAPTEME') && (
                                                        <Text style={itemSubtitle}>
                                                            Reste à payer: <strong>{item.remainingAmount || 0}€</strong>
                                                        </Text>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {calendarLink && item.type !== 'GIFT_VOUCHER' && (
                                        <div style={{ marginTop: '12px' }}>
                                            <Button href={calendarLink} style={button}>
                                                📅 Ajouter au Google Agenda
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </Section>

                    {/* Payment Summary */}
                    <Section style={section}>
                        <Heading as="h2" style={h2}>Paiement</Heading>
                        <div style={paidBox}>
                            <div style={flexBetween}>
                                <Text style={paidLabel}>PAYÉ EN LIGNE</Text>
                                <Text style={paidAmount}>{depositTotal.toFixed(2)}€</Text>
                            </div>
                            {remainingTotal > 0 && (
                                <div style={{ marginTop: '8px' }}>
                                    <Text style={{ ...paidLabel, color: '#92400e' }}>RESTE À PAYER SUR PLACE</Text>
                                    <Text style={{ ...paidAmount, color: '#b45309' }}>{remainingTotal.toFixed(2)}€</Text>
                                </div>
                            )}
                        </div>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default AdminNewOrderEmail;

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
    color: '#2563eb',
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
    margin: '0 0 2px',
    display: 'block',
};

const paidBox = {
    backgroundColor: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '16px',
};

const flexBetween = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
};

const paidLabel = {
    color: '#475569',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    margin: '0 0 4px',
};

const paidAmount = {
    color: '#1e293b',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 4px',
};

const button = {
    backgroundColor: '#2563eb',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '10px 20px',
    cursor: 'pointer',
};
