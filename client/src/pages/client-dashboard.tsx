import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { FileText, Calendar, DollarSign, Plus } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Quote, Invoice, Reservation } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Non autorisé",
        description: "Vous êtes déconnecté. Reconnexion...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: quotes = [], isLoading: quotesLoading } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
    enabled: isAuthenticated,
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    enabled: isAuthenticated,
  });

  const { data: reservations = [], isLoading: reservationsLoading } = useQuery<Reservation[]>({
    queryKey: ["/api/reservations"],
    enabled: isAuthenticated,
  });

  const pendingQuotes = quotes.filter((q) => q.status === "pending");
  const pendingInvoices = invoices.filter((i) => i.status === "pending");
  const upcomingReservations = reservations.filter((r) => r.status === "confirmed");

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-dashboard-title">Tableau de bord</h1>
        <Button asChild className="w-full sm:w-auto" data-testid="button-new-quote">
          <Link href="/services">
            <Plus className="h-4 w-4 mr-2" />
            Demander un devis
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devis en attente</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-quotes">
              {quotesLoading ? <Skeleton className="h-8 w-16" /> : pendingQuotes.length}
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factures en attente</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-invoices">
              {invoicesLoading ? <Skeleton className="h-8 w-16" /> : pendingInvoices.length}
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réservations à venir</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-upcoming-reservations">
              {reservationsLoading ? <Skeleton className="h-8 w-16" /> : upcomingReservations.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <CardTitle>Devis récents</CardTitle>
          {quotes.length > 0 && (
            <Button asChild variant="outline" size="sm" data-testid="button-view-all-quotes">
              <Link href="/quotes">Voir tous</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {quotesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun devis pour le moment. Demandez un devis pour commencer !</p>
              <Button asChild className="mt-4" variant="outline" data-testid="button-request-first-quote">
                <Link href="/services">Parcourir les services</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {quotes.slice(0, 5).map((quote) => (
                <div
                  key={quote.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border border-border rounded-md hover-elevate"
                  data-testid={`quote-card-${quote.id}`}
                >
                  <div className="flex-1">
                    <p className="font-medium">{quote.reference || `Devis #${quote.id.slice(0, 8)}`}</p>
                    <p className="text-sm text-muted-foreground">
                      {quote.createdAt && formatDistanceToNow(new Date(quote.createdAt), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    {quote.quoteAmount && (
                      <p className="font-mono font-semibold">{parseFloat(quote.quoteAmount).toFixed(2)} €</p>
                    )}
                    <StatusBadge status={quote.status as any} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <CardTitle>Factures récentes</CardTitle>
          {invoices.length > 0 && (
            <Button asChild variant="outline" size="sm" data-testid="button-view-all-invoices">
              <Link href="/invoices">Voir tous</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune facture pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.slice(0, 5).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border border-border rounded-md hover-elevate"
                  data-testid={`invoice-card-${invoice.id}`}
                >
                  <div className="flex-1">
                    <p className="font-medium">Facture #{invoice.invoiceNumber || invoice.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.createdAt && formatDistanceToNow(new Date(invoice.createdAt), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    {invoice.amount && (
                      <p className="font-mono font-semibold">{parseFloat(invoice.amount).toFixed(2)} €</p>
                    )}
                    <StatusBadge status={invoice.status as any} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
