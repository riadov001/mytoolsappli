import { useEffect, useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Save, Mail, Loader2, Mic } from "lucide-react";
import { VoiceDictationDialog } from "@/components/voice-dictation-dialog";
import type { Quote, QuoteItem, User } from "@shared/schema";

export default function AdminQuoteEdit() {
  const [, params] = useRoute("/admin/quotes/:id/edit");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isAdmin } = useAuth();
  
  const quoteId = params?.id || "";

  // Fetch quote data
  const { data: quote, isLoading: quoteLoading } = useQuery<Quote>({
    queryKey: [`/api/admin/quotes/${quoteId}`],
    enabled: isAuthenticated && isAdmin && !!quoteId,
  });

  // Fetch quote items
  const { data: items = [], isLoading: itemsLoading } = useQuery<QuoteItem[]>({
    queryKey: [`/api/admin/quotes/${quoteId}/items`],
    enabled: isAuthenticated && isAdmin && !!quoteId,
  });

  // Fetch all users to find client for voice dictation
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: isAuthenticated && isAdmin,
  });

  // Find client from users list
  const client = useMemo(() => {
    if (!quote?.clientId || !allUsers.length) return null;
    return allUsers.find(u => u.id === quote.clientId) || null;
  }, [quote?.clientId, allUsers]);

  // Voice dictation dialog state
  const [showVoiceDictation, setShowVoiceDictation] = useState(false);

  // Local state for form
  const [formData, setFormData] = useState({
    status: "pending" as "pending" | "approved" | "rejected" | "completed",
    validUntil: "",
    notes: "",
  });

  const [localItems, setLocalItems] = useState<Array<Partial<QuoteItem>>>([]);

  // Initialize form with quote data
  useEffect(() => {
    if (quote) {
      setFormData({
        status: quote.status || "pending",
        validUntil: quote.validUntil ? new Date(quote.validUntil).toISOString().split('T')[0] : "",
        notes: quote.notes || "",
      });
    }
  }, [quote]);

  // Initialize items
  useEffect(() => {
    if (items.length > 0) {
      setLocalItems(items);
    }
  }, [items]);

  // Update quote mutation
  const updateQuoteMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/admin/quotes/${quoteId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/quotes/${quoteId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      toast({
        title: "Succès",
        description: "Devis mis à jour",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: async (item: Partial<QuoteItem>) => {
      return await apiRequest("POST", `/api/admin/quotes/${quoteId}/items`, item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/quotes/${quoteId}/items`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
    },
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<QuoteItem> }) => {
      return await apiRequest("PATCH", `/api/admin/quote-items/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/quotes/${quoteId}/items`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/quote-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/quotes/${quoteId}/items`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      toast({
        title: "Succès",
        description: "Ligne supprimée",
      });
    },
  });

  const handleAddItem = () => {
    setLocalItems([
      ...localItems,
      {
        description: "",
        quantity: "1",
        unitPriceExcludingTax: "0",
        totalExcludingTax: "0",
        taxRate: "20",
        taxAmount: "0",
        totalIncludingTax: "0",
      },
    ]);
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...localItems];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate amounts
    const item = newItems[index];
    const qty = parseFloat(item.quantity || "1");
    const unitPrice = parseFloat(item.unitPriceExcludingTax || "0");
    const taxRate = parseFloat(item.taxRate || "20");

    const totalHT = qty * unitPrice;
    const taxAmount = (totalHT * taxRate) / 100;
    const totalTTC = totalHT + taxAmount;

    newItems[index] = {
      ...item,
      totalExcludingTax: totalHT.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      totalIncludingTax: totalTTC.toFixed(2),
    };

    setLocalItems(newItems);
  };

  const handleSaveItem = async (index: number) => {
    const item = localItems[index];
    
    if (!item.description || !item.quantity || !item.unitPriceExcludingTax) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive",
      });
      return;
    }

    if (item.id) {
      // Update existing item
      await updateItemMutation.mutateAsync({ id: item.id, data: item });
    } else {
      // Create new item
      await createItemMutation.mutateAsync({ ...item, quoteId });
    }

    toast({
      title: "Succès",
      description: "Ligne enregistrée",
    });
  };

  const handleDeleteItem = async (index: number) => {
    const item = localItems[index];
    
    if (item.id) {
      await deleteItemMutation.mutateAsync(item.id);
    }
    
    const newItems = localItems.filter((_, i) => i !== index);
    setLocalItems(newItems);
  };

  const handleSaveQuote = async () => {
    await updateQuoteMutation.mutateAsync({
      ...formData,
      validUntil: formData.validUntil ? formData.validUntil : null,
    });
  };

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/admin/quotes/${quoteId}/send-email`, {});
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Devis envoyé par email au client",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  if (quoteLoading || itemsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const totalHT = localItems.reduce((sum, item) => sum + parseFloat(item.totalExcludingTax || "0"), 0);
  const totalTVA = localItems.reduce((sum, item) => sum + parseFloat(item.taxAmount || "0"), 0);
  const totalTTC = totalHT + totalTVA;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => setLocation("/admin/quotes")}
          data-testid="button-back-to-quotes"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux devis
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modifier le devis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
              >
                <SelectTrigger data-testid="select-quote-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Approuvé</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validUntil">Valable jusqu'au</Label>
              <Input
                id="validUntil"
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                data-testid="input-valid-until"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              data-testid="textarea-quote-notes"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={handleSaveQuote} 
              disabled={updateQuoteMutation.isPending}
              data-testid="button-save-quote"
            >
              {updateQuoteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {updateQuoteMutation.isPending ? "Enregistrement..." : "Enregistrer le devis"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => sendEmailMutation.mutate()}
              disabled={sendEmailMutation.isPending}
              data-testid="button-send-quote-email"
            >
              {sendEmailMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Envoyer par email
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => setShowVoiceDictation(true)}
              disabled={!client?.email}
              data-testid="button-voice-dictation"
            >
              <Mic className="mr-2 h-4 w-4" />
              Dicter le récapitulatif
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lignes du devis</CardTitle>
            <Button onClick={handleAddItem} size="sm" data-testid="button-add-quote-item">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une ligne
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {localItems.map((item, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Input
                      value={item.description || ""}
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                      placeholder="Description de l'article"
                      data-testid={`input-item-description-${index}`}
                    />
                  </div>

                  <div>
                    <Label>Quantité</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.quantity || ""}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      data-testid={`input-item-quantity-${index}`}
                    />
                  </div>

                  <div>
                    <Label>Prix HT unitaire</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitPriceExcludingTax || ""}
                      onChange={(e) => handleItemChange(index, "unitPriceExcludingTax", e.target.value)}
                      data-testid={`input-item-unit-price-${index}`}
                    />
                  </div>

                  <div>
                    <Label>TVA (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.taxRate || ""}
                      onChange={(e) => handleItemChange(index, "taxRate", e.target.value)}
                      data-testid={`input-item-tax-rate-${index}`}
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <Button
                      onClick={() => handleSaveItem(index)}
                      size="sm"
                      data-testid={`button-save-item-${index}`}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteItem(index)}
                      size="sm"
                      variant="destructive"
                      data-testid={`button-delete-item-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total HT:</span>{" "}
                    <span className="font-medium" data-testid={`text-item-total-ht-${index}`}>
                      {parseFloat(item.totalExcludingTax || "0").toFixed(2)} €
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">TVA:</span>{" "}
                    <span className="font-medium" data-testid={`text-item-tax-amount-${index}`}>
                      {parseFloat(item.taxAmount || "0").toFixed(2)} €
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total TTC:</span>{" "}
                    <span className="font-medium" data-testid={`text-item-total-ttc-${index}`}>
                      {parseFloat(item.totalIncludingTax || "0").toFixed(2)} €
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-lg font-semibold">
              <div>
                <span className="text-muted-foreground">Total HT:</span>{" "}
                <span data-testid="text-total-ht">{totalHT.toFixed(2)} €</span>
              </div>
              <div>
                <span className="text-muted-foreground">TVA:</span>{" "}
                <span data-testid="text-total-tva">{totalTVA.toFixed(2)} €</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total TTC:</span>{" "}
                <span data-testid="text-total-ttc">{totalTTC.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <VoiceDictationDialog
        open={showVoiceDictation}
        onOpenChange={setShowVoiceDictation}
        clientEmail={client?.email || ""}
        clientName={`${client?.firstName || ""} ${client?.lastName || ""}`.trim() || "Client"}
        prestations={localItems.filter(item => item.description).map(item => item.description || "")}
        technicalDetails={formData.notes || ""}
        attachments={["Devis PDF"]}
        documentType="quote"
        documentNumber={quote?.reference || quote?.id || ""}
        documentId={quote?.id || ""}
      />
    </div>
  );
}
