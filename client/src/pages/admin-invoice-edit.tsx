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
import type { Invoice, InvoiceItem, User } from "@shared/schema";

export default function AdminInvoiceEdit() {
  const [, params] = useRoute("/admin/invoices/:id/edit");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isAdmin } = useAuth();
  
  const invoiceId = params?.id || "";

  // Fetch invoice data
  const { data: invoice, isLoading: invoiceLoading } = useQuery<Invoice>({
    queryKey: [`/api/admin/invoices/${invoiceId}`],
    enabled: isAuthenticated && isAdmin && !!invoiceId,
  });

  // Fetch invoice items
  const { data: items = [], isLoading: itemsLoading } = useQuery<InvoiceItem[]>({
    queryKey: [`/api/admin/invoices/${invoiceId}/items`],
    enabled: isAuthenticated && isAdmin && !!invoiceId,
  });

  // Fetch all users to find client for voice dictation
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: isAuthenticated && isAdmin,
  });

  // Find client from users list
  const client = useMemo(() => {
    if (!invoice?.clientId || !allUsers.length) return null;
    return allUsers.find(u => u.id === invoice.clientId) || null;
  }, [invoice?.clientId, allUsers]);

  // Voice dictation dialog state
  const [showVoiceDictation, setShowVoiceDictation] = useState(false);

  // Local state for form
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    status: "pending" as "pending" | "paid" | "overdue" | "cancelled",
    dueDate: "",
    notes: "",
  });

  const [localItems, setLocalItems] = useState<Array<Partial<InvoiceItem>>>([]);

  // Initialize form with invoice data
  useEffect(() => {
    if (invoice) {
      setFormData({
        invoiceNumber: invoice.invoiceNumber || "",
        status: invoice.status || "pending",
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : "",
        notes: invoice.notes || "",
      });
    }
  }, [invoice]);

  // Initialize items
  useEffect(() => {
    if (items.length > 0) {
      setLocalItems(items);
    }
  }, [items]);

  // Update invoice mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/admin/invoices/${invoiceId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/invoices/${invoiceId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      toast({
        title: "Succès",
        description: "Facture mise à jour",
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
    mutationFn: async (item: Partial<InvoiceItem>) => {
      return await apiRequest("POST", `/api/admin/invoices/${invoiceId}/items`, item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/invoices/${invoiceId}/items`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
    },
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InvoiceItem> }) => {
      return await apiRequest("PATCH", `/api/admin/invoice-items/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/invoices/${invoiceId}/items`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/invoice-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/invoices/${invoiceId}/items`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
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
      await createItemMutation.mutateAsync({ ...item, invoiceId });
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

  const handleSaveInvoice = async () => {
    await updateInvoiceMutation.mutateAsync({
      ...formData,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
    });
  };

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/admin/invoices/${invoiceId}/send-email`, {});
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Facture envoyée par email au client",
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

  if (invoiceLoading || itemsLoading) {
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
          size="icon"
          onClick={() => setLocation("/admin/invoices")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Éditer la Facture</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations Générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="invoiceNumber">Numéro de Facture</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                data-testid="input-invoice-number"
              />
            </div>

            <div>
              <Label htmlFor="status">Statut</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger id="status" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="paid">Payée</SelectItem>
                  <SelectItem value="overdue">En retard</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dueDate">Date d'Échéance</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                data-testid="input-due-date"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                data-testid="textarea-notes"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={handleSaveInvoice} className="w-full" data-testid="button-save-invoice">
                <Save className="mr-2 h-4 w-4" />
                Enregistrer la Facture
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => sendEmailMutation.mutate()}
                disabled={sendEmailMutation.isPending}
                data-testid="button-send-invoice-email"
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
                className="w-full"
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
            <CardTitle>Totaux</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total HT:</span>
              <span className="font-medium">{totalHT.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total TVA:</span>
              <span className="font-medium">{totalTVA.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total TTC:</span>
              <span>{totalTTC.toFixed(2)} €</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lignes de Facture</CardTitle>
          <Button onClick={handleAddItem} size="sm" data-testid="button-add-item">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une Ligne
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {localItems.map((item, index) => (
              <Card key={index} className="p-4">
                <div className="grid gap-4 md:grid-cols-6">
                  <div className="md:col-span-2">
                    <Label htmlFor={`description-${index}`}>Description</Label>
                    <Input
                      id={`description-${index}`}
                      value={item.description || ""}
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                      placeholder="Description du produit/service"
                      data-testid={`input-description-${index}`}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`quantity-${index}`}>Quantité</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      step="0.01"
                      value={item.quantity || "1"}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      data-testid={`input-quantity-${index}`}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`unitPrice-${index}`}>Prix Unit. HT</Label>
                    <Input
                      id={`unitPrice-${index}`}
                      type="number"
                      step="0.01"
                      value={item.unitPriceExcludingTax || "0"}
                      onChange={(e) => handleItemChange(index, "unitPriceExcludingTax", e.target.value)}
                      data-testid={`input-unit-price-${index}`}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`taxRate-${index}`}>TVA (%)</Label>
                    <Input
                      id={`taxRate-${index}`}
                      type="number"
                      step="0.01"
                      value={item.taxRate || "20"}
                      onChange={(e) => handleItemChange(index, "taxRate", e.target.value)}
                      data-testid={`input-tax-rate-${index}`}
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label>Total TTC</Label>
                      <div className="text-sm font-medium pt-2">{parseFloat(item.totalIncludingTax || "0").toFixed(2)} €</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSaveItem(index)}
                    data-testid={`button-save-item-${index}`}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteItem(index)}
                    data-testid={`button-delete-item-${index}`}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </Button>
                </div>
              </Card>
            ))}

            {localItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Aucune ligne pour le moment. Cliquez sur "Ajouter une Ligne" pour commencer.</p>
              </div>
            )}
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
        attachments={["Facture PDF"]}
        documentType="invoice"
        documentNumber={formData.invoiceNumber}
        documentId={invoice?.id || ""}
      />
    </div>
  );
}
