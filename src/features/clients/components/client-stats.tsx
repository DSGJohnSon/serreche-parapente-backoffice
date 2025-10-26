import { CheckCircle2Icon, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Client, Order } from "@prisma/client";

interface ClientStatsProps {
  clients: (Client & {
    orders: Order[];
  })[];
}

export function ClientStats({ clients }: ClientStatsProps) {
  const totalClients = clients.length;
  const totalOrders = clients.reduce(
    (acc, client) => acc + client.orders.length,
    0
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Clients</p>
              <p className="text-2xl font-bold">{totalClients}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2Icon className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Commandes</p>
              <p className="text-2xl font-bold">{totalOrders}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}