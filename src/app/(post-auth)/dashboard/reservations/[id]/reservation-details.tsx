"use client";

import { useState } from "react";
import { useGetReservationDetails } from "@/features/reservations/api/use-get-reservation-details";
import { useRecordManualPayment } from "@/features/reservations/api/use-record-manual-payment";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Clock,
  Euro,
  CreditCard,
  CheckCircle,
  Video,
  Users,
  Weight,
  Ruler,
  Cake,
  FileText,
  Plus,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface ReservationDetailsProps {
  id: string;
}

export function ReservationDetails({ id }: ReservationDetailsProps) {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useGetReservationDetails(id);
  const recordManualPayment = useRecordManualPayment();
  
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "BANK_TRANSFER" | "CASH" | "CHECK">("CASH");
  const [paymentNote, setPaymentNote] = useState("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'FULLY_PAID':
        return 'default';
      case 'PARTIALLY_PAID':
        return 'secondary';
      case 'CONFIRMED':
        return 'secondary';
      case 'PENDING':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Payé';
      case 'PARTIALLY_PAID':
        return 'Acompte payé';
      case 'FULLY_PAID':
        return 'Entièrement payé';
      case 'CONFIRMED':
        return 'Confirmé';
      case 'PENDING':
        return 'En attente';
      case 'SUCCEEDED':
        return 'Réussi';
      case 'FAILED':
        return 'Échoué';
      case 'CANCELLED':
        return 'Annulé';
      case 'REFUNDED':
        return 'Remboursé';
      default:
        return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'AVENTURE': 'Aventure',
      'DUREE': 'Durée',
      'LONGUE_DUREE': 'Longue Durée',
      'ENFANT': 'Enfant',
      'HIVER': 'Hiver',
      'INITIATION': 'Initiation',
      'PROGRESSION': 'Progression',
      'AUTONOMIE': 'Autonomie',
    };
    return labels[category] || category;
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'FAILED':
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'CARD': 'Carte Bancaire',
      'BANK_TRANSFER': 'Virement',
      'CASH': 'Espèces',
      'CHECK': 'Chèque',
    };
    return labels[method] || method;
  };

  const handleRecordPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      return;
    }

    if (!orderItem?.id) {
      return;
    }

    try {
      await recordManualPayment.mutateAsync({
        orderItemId: orderItem.id,
        amount: parseFloat(paymentAmount),
        paymentMethod,
        note: paymentNote || undefined,
      });
      
      setIsPaymentDialogOpen(false);
      setPaymentAmount("");
      setPaymentNote("");
      setPaymentMethod("CASH");
      refetch();
    } catch (error) {
      console.error("Error recording payment:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              Erreur lors du chargement de la réservation
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { type, booking, availablePlaces } = data.data;
  const isStage = type === 'STAGE';
  const stagiaire = (booking as any).stagiaire;
  const orderItem = (booking as any).orderItem;
  const order = orderItem?.order;
  const client = order?.client;
  const allPayments = order?.payments || [];
  const giftCards = order?.orderGiftCards || [];
  const paymentAllocations = (orderItem as any)?.paymentAllocations || [];

  // Stage or Bapteme specific data
  const activity = isStage ? (booking as any).stage : (booking as any).bapteme;
  const activityDate = isStage ? activity.startDate : activity.date;
  const moniteurs = activity.moniteurs || [];
  const bookingCategory = isStage ? (booking as any).type : (booking as any).category;
  const hasVideo = !isStage && (booking as any).hasVideo;

  // Payment calculations
  const totalPrice = orderItem?.totalPrice || 0;
  const depositAmount = orderItem?.depositAmount || 0;
  const remainingAmount = orderItem?.remainingAmount || 0;
  const isFullyPaid = orderItem?.isFullyPaid || false;
  // Both stages and baptemes can have deposits (bapteme: acompte + video paid upfront)
  const hasDeposit = depositAmount > 0;
  
  // Calculate total paid amount from allocations for THIS OrderItem only
  const totalPaidAmount = paymentAllocations.reduce((sum: number, allocation: any) => {
    if (allocation.payment?.status === 'SUCCEEDED') {
      return sum + allocation.allocatedAmount;
    }
    return sum;
  }, 0);
  
  // Get deposit payment date (first successful allocated payment)
  const depositAllocation = paymentAllocations.find((a: any) => a.payment?.status === 'SUCCEEDED');
  const depositDate = depositAllocation?.payment ? new Date(depositAllocation.payment.createdAt) : null;
  
  // Get only payments allocated to this OrderItem with their allocated amounts
  const payments = paymentAllocations.map((allocation: any) => ({
    ...allocation.payment,
    allocatedAmount: allocation.allocatedAmount,
    allocationId: allocation.id,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Button variant="ghost" onClick={() => router.back()} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux réservations
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            Détails de la réservation
          </h1>
          <p className="text-muted-foreground">
            {isStage ? 'Stage' : 'Baptême'} - Commande #{order?.orderNumber}
          </p>
        </div>
        <Badge variant={getBadgeVariant(order?.status || '')} className="text-lg px-4 py-2">
          {getStatusLabel(order?.status || '')}
        </Badge>
      </div>

      {/* Payment Information - MOVED TO TOP */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Informations de paiement
              </CardTitle>
              <CardDescription>
                Historique complet des paiements pour cette réservation
              </CardDescription>
            </div>
            {!isFullyPaid && remainingAmount > 0 && (
              <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Enregistrer un paiement
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enregistrer un paiement manuel</DialogTitle>
                    <DialogDescription>
                      Enregistrez un paiement reçu en physique pour cette réservation
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Montant reçu *</Label>
                      <div className="relative">
                        <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="0.00"
                          className="pl-10"
                          disabled={recordManualPayment.isPending}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Reste à payer: {formatCurrency(remainingAmount)}
                      </p>
                      {paymentAmount && parseFloat(paymentAmount) > remainingAmount && (
                        <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-md">
                          <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-orange-900 dark:text-orange-100">
                            <p className="font-medium">Attention : Montant supérieur au reste à payer</p>
                            <p className="text-xs mt-1">
                              Le montant saisi ({formatCurrency(parseFloat(paymentAmount))}) dépasse le reste à payer ({formatCurrency(remainingAmount)}).
                              Vous pouvez tout de même enregistrer ce paiement si nécessaire.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Mode de paiement *</Label>
                      <Select
                        value={paymentMethod}
                        onValueChange={(value: any) => setPaymentMethod(value)}
                        disabled={recordManualPayment.isPending}
                      >
                        <SelectTrigger id="paymentMethod">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CASH">Espèces</SelectItem>
                          <SelectItem value="CARD">Carte Bancaire</SelectItem>
                          <SelectItem value="BANK_TRANSFER">Virement</SelectItem>
                          <SelectItem value="CHECK">Chèque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="note">Note (optionnel)</Label>
                      <Textarea
                        id="note"
                        value={paymentNote}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPaymentNote(e.target.value)}
                        placeholder="Ex: Reçu en espèces le jour du stage"
                        rows={3}
                        disabled={recordManualPayment.isPending}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsPaymentDialogOpen(false)}
                        disabled={recordManualPayment.isPending}
                        className="flex-1"
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={handleRecordPayment}
                        disabled={recordManualPayment.isPending || !paymentAmount || parseFloat(paymentAmount) <= 0}
                        className="flex-1"
                      >
                        {recordManualPayment.isPending ? "Enregistrement..." : "Enregistrer"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Summary */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Prix total</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPrice)}</p>
            </div>
            
            {hasDeposit && (
              <>
                <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950">
                  <p className="text-sm text-muted-foreground mb-1">Acompte payé</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(depositAmount)}</p>
                  {depositDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(depositDate, "dd/MM/yyyy", { locale: fr })}
                    </p>
                  )}
                </div>
                
                <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950">
                  <p className="text-sm text-muted-foreground mb-1">Total réglé</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaidAmount)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {payments.filter((p: any) => p.status === 'SUCCEEDED').length} paiement(s)
                  </p>
                </div>
                
                <div className={`border rounded-lg p-4 ${!isFullyPaid && remainingAmount > 0 ? 'bg-orange-50 dark:bg-orange-950' : 'bg-green-50 dark:bg-green-950'}`}>
                  <p className="text-sm text-muted-foreground mb-1">
                    {isFullyPaid ? 'Statut' : 'Reste à payer'}
                  </p>
                  <p className={`text-2xl font-bold ${isFullyPaid ? 'text-green-600' : 'text-orange-600'}`}>
                    {isFullyPaid ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-6 w-6" />
                        Soldé
                      </span>
                    ) : (
                      formatCurrency(remainingAmount)
                    )}
                  </p>
                  {isFullyPaid && orderItem?.finalPaymentDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(orderItem.finalPaymentDate), "dd/MM/yyyy", { locale: fr })}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Gift Cards Used */}
          {giftCards.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Cartes cadeaux utilisées
              </h4>
              <div className="space-y-2">
                {giftCards.map((gc: any) => (
                  <div key={gc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{gc.giftCard.code}</p>
                      <p className="text-sm text-muted-foreground">
                        Appliqué le {format(new Date(gc.createdAt), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      -{formatCurrency(gc.usedAmount)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment History */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Historique des paiements
            </h4>
            {payments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Aucun paiement enregistré
              </p>
            ) : (
              <div className="space-y-3">
                {payments.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getPaymentStatusBadge(payment.status)}>
                          {getStatusLabel(payment.status)}
                        </Badge>
                        {payment.isManual && (
                          <Badge variant="outline">
                            {getPaymentMethodLabel(payment.manualPaymentMethod)}
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(payment.createdAt), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
                        </span>
                      </div>
                      {payment.isManual ? (
                        <>
                          <p className="text-sm text-muted-foreground">
                            Paiement manuel pour cette réservation
                          </p>
                          {payment.recordedByUser && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Enregistré par: <span className="font-medium">{payment.recordedByUser.name}</span>
                            </p>
                          )}
                          {payment.manualPaymentNote && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Note: {payment.manualPaymentNote}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground">
                            Paiement en ligne (part allouée à cette réservation)
                          </p>
                          {payment.stripePaymentIntentId && (
                            <p className="text-xs text-muted-foreground mt-1 font-mono">
                              ID Stripe: {payment.stripePaymentIntentId}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{formatCurrency(payment.allocatedAmount || payment.amount)}</p>
                      <p className="text-xs text-muted-foreground uppercase">{payment.currency}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Final Payment Note */}
          {orderItem?.finalPaymentDate && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Paiement final en physique
              </h4>
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm mb-2">
                  <span className="text-muted-foreground">Date:</span>{" "}
                  <span className="font-medium">
                    {format(new Date(orderItem.finalPaymentDate), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                  </span>
                </p>
                {orderItem.finalPaymentNote && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Note:</span>{" "}
                    <span className="font-medium">{orderItem.finalPaymentNote}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Participant Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations du stagiaire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Nom complet</p>
                  <p className="font-medium text-lg">
                    {stagiaire.firstName} {stagiaire.lastName}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{stagiaire.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{stagiaire.phone}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Weight className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Poids</p>
                  <p className="font-medium">{stagiaire.weight} kg</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Ruler className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Taille</p>
                  <p className="font-medium">{stagiaire.height} cm</p>
                </div>
              </div>

              {stagiaire.birthDate && (
                <div className="flex items-start gap-3">
                  <Cake className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date de naissance</p>
                    <p className="font-medium">
                      {format(new Date(stagiaire.birthDate), "dd MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {client && (
              <>
                <Separator className="my-4" />
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Client payeur
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Nom:</span> {client.firstName} {client.lastName}</p>
                    <p><span className="text-muted-foreground">Email:</span> {client.email}</p>
                    <p><span className="text-muted-foreground">Téléphone:</span> {client.phone}</p>
                    <p><span className="text-muted-foreground">Adresse:</span> {client.address}</p>
                    <p><span className="text-muted-foreground">Ville:</span> {client.postalCode} {client.city}</p>
                    <p><span className="text-muted-foreground">Pays:</span> {client.country}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Activity Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isStage ? <Calendar className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              Détails du {isStage ? 'stage' : 'baptême'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium text-lg">
                    {format(new Date(activityDate), isStage ? "dd MMMM yyyy" : "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Durée</p>
                  <p className="font-medium">
                    {isStage ? `${activity.duration} jours` : `${activity.duration} minutes`}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Type/Catégorie</p>
                  <p className="font-medium">
                    {getCategoryLabel(bookingCategory)}
                  </p>
                </div>
              </div>

              {hasVideo && (
                <div className="flex items-start gap-3">
                  <Video className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Option vidéo</p>
                    <Badge variant="secondary" className="mt-1">
                      <Video className="h-3 w-3 mr-1" />
                      Vidéo incluse
                    </Badge>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Places</p>
                  <p className="font-medium">
                    {availablePlaces?.remaining || 0} restantes sur {availablePlaces?.total || activity.places}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {availablePlaces?.confirmed || 0} réservation(s) confirmée(s)
                  </p>
                </div>
              </div>

              {moniteurs.length > 0 && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Moniteurs assignés</p>
                      <div className="space-y-1">
                        {moniteurs.map((m: any) => (
                          <div key={m.id} className="flex items-center gap-2">
                            <Badge variant="outline">{m.moniteur.name}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}