import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FileText, Download, Eye, Clock, CheckCircle, XCircle } from "lucide-react";
import type { Quote, QuoteItem } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { generateQuotePDF } from "@/lib/pdf-generator";
import { apiRequest } from "@/lib/queryClient";

export default function ClientQuotes() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Non autorisé",
        description: "Vous devez être connecté pour accéder à cette page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: quotes = [], isLoading: quotesLoading } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
    enabled: isAuthenticated,
  });

  const downloadPDFMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      return await apiRequest("GET", `/api/quotes/${quoteId}/pdf`, undefined);
    },
    onSuccess: async (data: any) => {
      try {
        await generateQuotePDF(data.quote, data.client, data.service, data.items, data.settings);
        toast({
          title: "Succès",
          description: "Le devis a été téléchargé",
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Erreur lors de la génération du PDF",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec du téléchargement du devis",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> En attente</Badge>;
      case "approved":
        return <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700"><CheckCircle className="h-3 w-3" /> Approuvé</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Refusé</Badge>;
      case "completed":
        return <Badge variant="outline" className="gap-1"><CheckCircle className="h-3 w-3" /> Terminé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-client-quotes-title">Mes Devis</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">Consultez et téléchargez vos devis</p>
      </div>

      {quotesLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : quotes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-2">Aucun devis</p>
            <p className="text-muted-foreground">Vous n'avez pas encore de devis.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {quotes.map((quote) => (
            <Card key={quote.id} className="hover-elevate" data-testid={`quote-card-${quote.id}`}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-lg">{quote.reference || `Devis #${quote.id.slice(0, 8).toUpperCase()}`}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Créé le {format(new Date(quote.createdAt!), "d MMMM yyyy", { locale: fr })}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(quote.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {quote.wheelCount && (
                    <div>
                      <p className="text-muted-foreground">Jantes</p>
                      <p className="font-medium">{quote.wheelCount}</p>
                    </div>
                  )}
                  {quote.diameter && (
                    <div>
                      <p className="text-muted-foreground">Diamètre</p>
                      <p className="font-medium">{quote.diameter}</p>
                    </div>
                  )}
                  {quote.quoteAmount && (
                    <div>
                      <p className="text-muted-foreground">Montant TTC</p>
                      <p className="font-medium font-mono">{parseFloat(quote.quoteAmount).toFixed(2)} €</p>
                    </div>
                  )}
                </div>

                {quote.notes && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm">{quote.notes}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="default"
                    className="flex-1 sm:flex-initial"
                    onClick={() => downloadPDFMutation.mutate(quote.id)}
                    disabled={downloadPDFMutation.isPending}
                    data-testid={`button-download-quote-${quote.id}`}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {downloadPDFMutation.isPending ? "Téléchargement..." : "Télécharger PDF"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
