"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useGetCustomerById } from "@/features/customers/api/use-get-customers";
import { calculateAge, formatDate } from "@/lib/utils";
import {
  Calendar,
  LucideFrown,
  LucideRefreshCcw,
  Mail,
  MapPin,
  Phone,
  Ruler,
  User,
  Weight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReservationsList } from "./reservation-list";
import { GiftCardsList } from "./giftcards-list";

export default function CustomerDetails({ id }: { id: string }) {
  const { data: customer, isLoading, error } = useGetCustomerById(id);
  const router = useRouter();

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error || !customer) {
    return (
      <div className="bg-slate-200 text-slate-800 rounded-md p-8 flex flex-col items-center justify-center border border-slate-400 gap-4">
        <LucideFrown />
        <div className="flex flex-col items-center">
          <p>Aucun client n&apos;a été trouvé.</p>
          <p className="text-xs">
            Ceci peut être dû à une erreur de connexion avec la base donneées.
          </p>
          <Button
            variant={"secondary"}
            size={"lg"}
            className="mt-4"
            onClick={() => {
              router.refresh();
            }}
          >
            <LucideRefreshCcw />
            Rafraichir la page
          </Button>
        </div>
      </div>
    );
  }

  const transformedBookings = customer.stages.map((booking) => {
    const startDate = new Date(booking.stage.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + booking.stage.duration);
    
    return {
      ...booking,
      createdAt: new Date(booking.createdAt),
      updatedAt: new Date(booking.updatedAt),
      stage: {
        ...booking.stage,
        createdAt: new Date(booking.stage.createdAt),
        updatedAt: new Date(booking.stage.updatedAt),
        startDate: startDate,
        endDate: endDate,
      },
    };
  });

  const age = customer.birthDate
    ? calculateAge(new Date(customer.birthDate))
    : null;
  const initials = `${customer.firstName.charAt(0)}${customer.lastName.charAt(
    0
  )}`;

  return (
    <>
      <Link
        href="/dashboard/customers"
        className="mb-4 inline-block text-sm text-blue-600 hover:underline"
      >
        <Button variant="link" className="p-0">
          &larr; Retour à la liste des clients
        </Button>
      </Link>
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">
                {customer.firstName} {customer.lastName}
              </CardTitle>
              <p className="text-muted-foreground">
                Client depuis le{" "}
                {formatDate(
                  customer.createdAt ? new Date(customer.createdAt) : undefined
                )}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <User className="w-5 h-5 mr-2" />
                Informations personnelles
              </h3>
              <Separator />
              <div className="space-y-4">
                {customer.birthDate && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Date de naissance
                      </p>
                      <p className="font-medium">
                        {formatDate(
                          customer.birthDate
                            ? new Date(customer.birthDate)
                            : undefined
                        )}
                        {age && (
                          <span className="text-muted-foreground ml-2">
                            ({age} ans)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Weight className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Poids</p>
                    <p className="font-medium">{customer.weight} kg</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Ruler className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Taille</p>
                    <p className="font-medium">{customer.height} m</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Contact
              </h3>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a
                      href={`mailto:${customer.email}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {customer.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Téléphone</p>
                    <a
                      href={`tel:${customer.phone}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {customer.phone}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Adresse
              </h3>
              <Separator />
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Adresse complète
                  </p>
                  <div className="font-medium space-y-1">
                    <p>{customer.adress}</p>
                    <p>
                      {customer.postalCode} {customer.city}
                    </p>
                    <p>{customer.country}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <ReservationsList bookings={transformedBookings} />
      
      {/* Gift Cards Section */}
      {customer.giftCards && customer.giftCardsUsed && (
        <div className="mt-8">
          <GiftCardsList
            purchasedGiftCards={customer.giftCards || []}
            usedGiftCards={customer.giftCardsUsed || []}
          />
        </div>
      )}
    </>
  );
}
