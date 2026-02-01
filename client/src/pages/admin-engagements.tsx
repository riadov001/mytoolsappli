import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, DollarSign, Calendar, Trash2, ArrowRight, Image } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, Quote, Invoice, Reservation } from "@shared/schema";

interface Engagement {
  id: string;
  clientId: string;
  title: string;
  description?: string;
  status: "active" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

interface MediaItem {
  id: string;
  fileType: string;
  filePath: string;
  fileName: string;
}

// Helper function to get the correct URL for media files
function getMediaUrl(filePath: string): string {
  if (filePath.startsWith('http')) {
    return filePath;
  }
  // Object storage paths start with /objects/
  if (filePath.startsWith('/objects/')) {
    return filePath;
  }
  // Legacy local upload paths
  if (filePath.startsWith('/uploads/')) {
    return filePath;
  }
  // Default fallback
  return filePath.startsWith('/') ? filePath : `/uploads/${filePath}`;
}

interface QuoteWithMedia extends Quote {
  media: MediaItem[];
}

interface InvoiceWithMedia extends Invoice {
  media: MediaItem[];
}

interface EngagementData {
  quotes: QuoteWithMedia[];
  invoices: InvoiceWithMedia[];
  reservations: Reservation[];
}

export default function AdminEngagements() {
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: engagements = [] } = useQuery<Engagement[]>({
    queryKey: ["/api/admin/engagements"],
  });

  const { data: engagementData } = useQuery<EngagementData>({
    queryKey: ["/api/admin/engagements/summary", selectedClientId],
    enabled: !!selectedClientId,
  });

  const handleDeleteEngagement = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette prestation ?")) return;
    try {
      await apiRequest("DELETE", `/api/admin/engagements/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/engagements"] });
    } catch (error) {
      console.error("Error deleting engagement:", error);
    }
  };

  const selectedClient = users.find((u) => u.id === selectedClientId);

  const quotesWithMedia = engagementData?.quotes.filter(q => q.media && q.media.length > 0) || [];
  const invoicesWithMedia = engagementData?.invoices.filter(i => i.media && i.media.length > 0) || [];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-admin-engagements-title">
          Gestion des Prestations
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sélectionner un Client</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger data-testid="select-client-engagement">
              <SelectValue placeholder="Sélectionner un client" />
            </SelectTrigger>
            <SelectContent>
              {users
                .filter((u) => u.role === "client" || u.role === "client_professionnel")
                .map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedClient && engagementData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  Devis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{engagementData.quotes.length}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {engagementData.quotes.filter((q) => q.status === "approved").length} approuvés
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4" />
                  Factures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{engagementData.invoices.length}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {engagementData.invoices.filter((i) => i.status === "paid").length} payées
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  Réservations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{engagementData.reservations.length}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {engagementData.reservations.filter((r) => r.status === "confirmed").length} confirmées
                </p>
              </CardContent>
            </Card>
          </div>

          {quotesWithMedia.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Photos Avant (Devis)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {quotesWithMedia.map((quote) => (
                  <div key={quote.id} className="space-y-3" data-testid={`card-quote-media-${quote.id}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">
                        {quote.reference || `Devis #${quote.id.slice(0, 8).toUpperCase()}`}
                      </h3>
                      <Badge variant="secondary">
                        {quote.media.filter(m => m.fileType === "image").length} photos
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {quote.media
                        .filter(m => m.fileType === "image")
                        .map((media) => (
                          <div
                            key={media.id}
                            className="relative aspect-square rounded-md overflow-hidden border border-border bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                            data-testid={`img-quote-${quote.id}-${media.id}`}
                            onClick={() => window.open(getMediaUrl(media.filePath), '_blank')}
                          >
                            <img
                              src={getMediaUrl(media.filePath)}
                              alt={media.fileName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (!target.src.includes('placeholder')) {
                                  target.src = 'https://placehold.co/400x400?text=Erreur+Image';
                                }
                              }}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {invoicesWithMedia.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Photos Après (Factures)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {invoicesWithMedia.map((invoice) => (
                  <div key={invoice.id} className="space-y-3" data-testid={`card-invoice-media-${invoice.id}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">
                        {invoice.invoiceNumber}
                      </h3>
                      <Badge variant="secondary">
                        {invoice.media.filter(m => m.fileType === "image").length} photos
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {invoice.media
                        .filter(m => m.fileType === "image")
                        .map((media) => (
                          <div
                            key={media.id}
                            className="relative aspect-square rounded-md overflow-hidden border border-border bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                            data-testid={`img-invoice-${invoice.id}-${media.id}`}
                            onClick={() => window.open(getMediaUrl(media.filePath), '_blank')}
                          >
                            <img
                              src={getMediaUrl(media.filePath)}
                              alt={media.fileName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (!target.src.includes('placeholder')) {
                                  target.src = 'https://placehold.co/400x400?text=Erreur+Image';
                                }
                              }}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {engagementData.quotes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Devis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {engagementData.quotes.map((quote) => (
                    <Link key={quote.id} href={`/admin/quotes/${quote.id}/edit`}>
                      <div
                        className="flex items-center justify-between p-3 border border-border rounded-md hover-elevate cursor-pointer"
                        data-testid={`row-quote-${quote.id}`}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{quote.reference || `Devis #${quote.id.slice(0, 8)}`}</p>
                          <p className="text-xs text-muted-foreground">
                            {quote.quoteAmount ? `${parseFloat(quote.quoteAmount).toFixed(2)} €` : "N/A"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              quote.status === "approved"
                                ? "default"
                                : quote.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {quote.status === "approved"
                              ? "Approuvé"
                              : quote.status === "rejected"
                                ? "Rejeté"
                                : "En attente"}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {engagementData.invoices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Factures</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {engagementData.invoices.map((invoice) => (
                    <Link key={invoice.id} href={`/admin/invoices/${invoice.id}/edit`}>
                      <div
                        className="flex items-center justify-between p-3 border border-border rounded-md hover-elevate cursor-pointer"
                        data-testid={`row-invoice-${invoice.id}`}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{invoice.invoiceNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {invoice.amount ? `${parseFloat(invoice.amount).toFixed(2)} €` : "N/A"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              invoice.status === "paid"
                                ? "default"
                                : invoice.status === "overdue"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {invoice.status === "paid"
                              ? "Payée"
                              : invoice.status === "overdue"
                                ? "En retard"
                                : "En attente"}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {engagementData.reservations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Réservations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {engagementData.reservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="flex items-center justify-between p-3 border border-border rounded-md"
                      data-testid={`row-reservation-${reservation.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{reservation.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {reservation.serviceId ? `Service réservé` : "N/A"}
                        </p>
                      </div>
                      <Badge
                        variant={
                          reservation.status === "confirmed"
                            ? "default"
                            : reservation.status === "cancelled"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {reservation.status === "confirmed"
                          ? "Confirmée"
                          : reservation.status === "cancelled"
                            ? "Annulée"
                            : "En attente"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Toutes les Prestations</CardTitle>
        </CardHeader>
        <CardContent>
          {engagements.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune prestation créée</p>
          ) : (
            <div className="space-y-3">
              {engagements.map((engagement) => {
                const client = users.find((u) => u.id === engagement.clientId);
                return (
                  <div
                    key={engagement.id}
                    className="flex items-center justify-between p-3 border border-border rounded-md hover-elevate"
                    data-testid={`card-engagement-${engagement.id}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{engagement.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {client?.firstName} {client?.lastName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          engagement.status === "active"
                            ? "default"
                            : engagement.status === "completed"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {engagement.status === "active"
                          ? "Actif"
                          : engagement.status === "completed"
                            ? "Complété"
                            : "Annulé"}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteEngagement(engagement.id)}
                        data-testid="button-delete-engagement"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
