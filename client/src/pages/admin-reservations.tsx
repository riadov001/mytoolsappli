import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Reservation, User, Service, Quote } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toDatetimeLocalValue } from "@/lib/dateUtils";
import { Calendar, Plus, Edit, Trash2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { NewClientForm } from "@/components/new-client-form";
import { initiateClientCreationRedirect } from "@/lib/navigation";

export default function AdminReservations() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  
  // Dialog states
  const [createReservationDialog, setCreateReservationDialog] = useState(false);
  const [editReservationDialog, setEditReservationDialog] = useState(false);
  const [deleteReservationDialog, setDeleteReservationDialog] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  
  const [reservationType, setReservationType] = useState<"direct" | "from-quote">("direct");
  const [clientSelection, setClientSelection] = useState<"existing" | "new">("existing");
  
  // Form state for direct reservation
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [additionalServiceIds, setAdditionalServiceIds] = useState<string[]>([]);
  
  // Form state for new client
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientFirstName, setNewClientFirstName] = useState("");
  const [newClientLastName, setNewClientLastName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");
  const [newClientPostalCode, setNewClientPostalCode] = useState("");
  const [newClientCity, setNewClientCity] = useState("");
  const [newClientRole, setNewClientRole] = useState<"client" | "client_professionnel">("client");
  const [newClientCompanyName, setNewClientCompanyName] = useState("");
  const [newClientSiret, setNewClientSiret] = useState("");
  const [newClientTvaNumber, setNewClientTvaNumber] = useState("");
  const [newClientCompanyAddress, setNewClientCompanyAddress] = useState("");
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [estimatedEndDate, setEstimatedEndDate] = useState<string>("");
  const [wheelCount, setWheelCount] = useState<string>("1");
  const [diameter, setDiameter] = useState<string>("");
  const [priceHT, setPriceHT] = useState<string>("");
  const [taxRate, setTaxRate] = useState<string>("20");
  const [productDetails, setProductDetails] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [reservationStatus, setReservationStatus] = useState<string>("pending");

  // Form state for quote-based reservation
  const [selectedQuote, setSelectedQuote] = useState<string>("");
  
  // Highlight state for notification navigation
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const highlightedRef = useRef<HTMLDivElement>(null);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      toast({
        title: "Non autorisé",
        description: "Vous n'avez pas la permission d'accéder à cette page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    }
  }, [isAuthenticated, isLoading, isAdmin, toast]);

  // Détection des paramètres URL pour ouvrir le dialogue après redirection ou highlight
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldOpenDialog = params.get("openDialog") === "true";
    const clientId = params.get("clientId");
    const highlight = params.get("highlight");

    if (shouldOpenDialog && isAuthenticated && isAdmin) {
      setCreateReservationDialog(true);
      setReservationType("direct");
      if (clientId) {
        setSelectedClient(clientId);
        setClientSelection("existing");
      }
      // Nettoyer les paramètres URL sans recharger la page
      window.history.replaceState({}, "", window.location.pathname);
    }
    
    if (highlight && isAuthenticated && isAdmin) {
      // Clear any existing timeout before setting a new one
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      setHighlightedId(highlight);
      // Nettoyer les paramètres URL sans recharger la page
      window.history.replaceState({}, "", window.location.pathname);
      // Supprimer le highlight après 5 secondes
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedId(null);
      }, 5000);
    }
    
    // Cleanup on unmount
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [isAuthenticated, isAdmin]);

  const { data: reservations = [], isLoading: reservationsLoading } = useQuery<Reservation[]>({
    queryKey: ["/api/admin/reservations"],
    enabled: isAuthenticated && isAdmin,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated && isAdmin,
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/admin/services"],
    enabled: isAuthenticated && isAdmin,
  });

  const { data: quotes = [] } = useQuery<Quote[]>({
    queryKey: ["/api/admin/quotes"],
    enabled: isAuthenticated && isAdmin,
  });

  const approvedQuotes = quotes.filter(q => q.status === "approved");
  
  // Scroll vers l'élément highlighted quand les réservations sont chargées
  useEffect(() => {
    if (highlightedId && highlightedRef.current && !reservationsLoading) {
      highlightedRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightedId, reservationsLoading]);

  // États pour la recherche et les filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fonction pour obtenir le nom complet du client
  const getClientName = (clientId: string) => {
    const client = users.find(u => u.id === clientId);
    if (!client) return `Client-${clientId.slice(0, 8)}`;
    return `${client.firstName || ""} ${client.lastName || ""}`.trim() || client.email;
  };

  // Fonction pour obtenir le nom du service
  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service?.name || `Service-${serviceId.slice(0, 8)}`;
  };

  // Fonction pour obtenir la référence du devis
  const getQuoteReference = (quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId);
    return quote?.reference || `#${quoteId.slice(0, 8)}`;
  };

  // Filtrage des réservations
  const filteredReservations = reservations.filter(reservation => {
    const clientName = getClientName(reservation.clientId).toLowerCase();
    const serviceName = getServiceName(reservation.serviceId).toLowerCase();
    const notes = (reservation.notes ?? "").toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = 
      clientName.includes(searchLower) ||
      serviceName.includes(searchLower) ||
      reservation.id.toLowerCase().includes(searchLower) ||
      notes.includes(searchLower);
    
    const matchesStatus = statusFilter === "all" || reservation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const createReservationMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/admin/reservations", data);
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Réservation créée avec succès",
      });
      resetForm();
      setCreateReservationDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reservations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec de la création de la réservation",
        variant: "destructive",
      });
    },
  });

  const updateReservationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/admin/reservations/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Réservation modifiée avec succès",
      });
      resetForm();
      setEditReservationDialog(false);
      setSelectedReservation(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reservations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec de la modification de la réservation",
        variant: "destructive",
      });
    },
  });

  const deleteReservationMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/reservations/${id}`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Réservation supprimée avec succès",
      });
      setDeleteReservationDialog(false);
      setSelectedReservation(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reservations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec de la suppression de la réservation",
        variant: "destructive",
      });
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: { 
      email: string; 
      firstName: string; 
      lastName: string;
      phone?: string;
      address?: string;
      postalCode?: string;
      city?: string;
      role: "client" | "client_professionnel";
      companyName?: string;
      siret?: string;
      tvaNumber?: string;
      companyAddress?: string;
    }) => {
      const response = await apiRequest("POST", "/api/admin/clients", data);
      return response;
    },
  });

  const resetForm = () => {
    setReservationType("direct");
    setClientSelection("existing");
    setSelectedClient("");
    setSelectedService("");
    setAdditionalServiceIds([]);
    setScheduledDate("");
    setEstimatedEndDate("");
    setWheelCount("1");
    setDiameter("");
    setPriceHT("");
    setTaxRate("20");
    setProductDetails("");
    setNotes("");
    setSelectedQuote("");
    setReservationStatus("pending");
    setNewClientEmail("");
    setNewClientFirstName("");
    setNewClientLastName("");
    setNewClientPhone("");
    setNewClientAddress("");
    setNewClientPostalCode("");
    setNewClientCity("");
    setNewClientRole("client");
    setNewClientCompanyName("");
    setNewClientSiret("");
    setNewClientTvaNumber("");
    setNewClientCompanyAddress("");
  };

  const handleCreateReservation = async () => {
    if (reservationType === "from-quote") {
      if (!selectedQuote || !scheduledDate) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner un devis et une date",
          variant: "destructive",
        });
        return;
      }

      const quote = quotes.find(q => q.id === selectedQuote);
      if (!quote) {
        toast({
          title: "Erreur",
          description: "Devis introuvable",
          variant: "destructive",
        });
        return;
      }

      createReservationMutation.mutate({
        quoteId: selectedQuote,
        clientId: quote.clientId,
        serviceId: quote.serviceId,
        scheduledDate,
        estimatedEndDate: estimatedEndDate || undefined,
        wheelCount: quote.wheelCount,
        diameter: quote.diameter,
        priceExcludingTax: quote.priceExcludingTax,
        taxRate: quote.taxRate,
        taxAmount: quote.taxAmount,
        productDetails: quote.productDetails,
        notes: notes || undefined,
        status: reservationStatus,
      });
    } else {
      // Validation for direct reservation
      if (clientSelection === "new") {
        if (!newClientEmail || !newClientFirstName || !newClientLastName) {
          toast({
            title: "Erreur",
            description: "Email, prénom et nom sont requis pour créer un nouveau client",
            variant: "destructive",
          });
          return;
        }
      } else {
        if (!selectedClient) {
          toast({
            title: "Erreur",
            description: "Veuillez sélectionner un client",
            variant: "destructive",
          });
          return;
        }
      }

      if (!selectedService || !scheduledDate) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir tous les champs obligatoires",
          variant: "destructive",
        });
        return;
      }

      try {
        let clientId = selectedClient;

        // Create client if needed
        if (clientSelection === "new") {
          const newClient: any = await createClientMutation.mutateAsync({
            email: newClientEmail,
            firstName: newClientFirstName,
            lastName: newClientLastName,
            phone: newClientPhone || undefined,
            address: newClientAddress || undefined,
            postalCode: newClientPostalCode || undefined,
            city: newClientCity || undefined,
            role: newClientRole,
            companyName: newClientRole === "client_professionnel" ? newClientCompanyName : undefined,
            siret: newClientRole === "client_professionnel" ? newClientSiret : undefined,
            tvaNumber: newClientRole === "client_professionnel" ? newClientTvaNumber : undefined,
            companyAddress: newClientRole === "client_professionnel" ? newClientCompanyAddress : undefined,
          });
          
          if (!newClient || !newClient.id) {
            throw new Error("Échec de la création du client");
          }
          
          clientId = newClient.id;
          // Invalidate users cache to refresh the list
          queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
        }

        const taxRateNum = parseFloat(taxRate);
        const priceHTNum = parseFloat(priceHT || "0");
        const taxAmount = (priceHTNum * taxRateNum / 100).toFixed(2);

        createReservationMutation.mutate({
          clientId,
          serviceId: selectedService,
          additionalServiceIds: additionalServiceIds.length > 0 ? additionalServiceIds : undefined,
          scheduledDate,
          estimatedEndDate: estimatedEndDate || undefined,
          wheelCount: parseInt(wheelCount),
          diameter: diameter || undefined,
          priceExcludingTax: priceHT || undefined,
          taxRate: taxRate || undefined,
          taxAmount: taxAmount || undefined,
          productDetails: productDetails || undefined,
          notes: notes || undefined,
          status: reservationStatus,
        });
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: error.message || "Échec de la création du client ou de la réservation",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditReservation = () => {
    if (!selectedReservation) return;

    if (!scheduledDate) {
      toast({
        title: "Erreur",
        description: "La date de réservation est obligatoire",
        variant: "destructive",
      });
      return;
    }

    const taxRateNum = parseFloat(taxRate || "20");
    const priceHTNum = parseFloat(priceHT || "0");
    const taxAmount = priceHTNum ? (priceHTNum * taxRateNum / 100).toFixed(2) : undefined;

    updateReservationMutation.mutate({
      id: selectedReservation.id,
      data: {
        scheduledDate,
        estimatedEndDate: estimatedEndDate || undefined,
        wheelCount: wheelCount ? parseInt(wheelCount) : undefined,
        diameter: diameter || undefined,
        priceExcludingTax: priceHT || undefined,
        taxRate: taxRate || undefined,
        taxAmount: taxAmount || undefined,
        productDetails: productDetails || undefined,
        notes: notes || undefined,
        status: reservationStatus,
        additionalServiceIds,
      },
    });
  };

  const openEditDialog = async (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setScheduledDate(toDatetimeLocalValue(reservation.scheduledDate));
    setEstimatedEndDate(toDatetimeLocalValue(reservation.estimatedEndDate));
    setWheelCount(reservation.wheelCount?.toString() || "1");
    setDiameter(reservation.diameter || "");
    setPriceHT(reservation.priceExcludingTax || "");
    setTaxRate(reservation.taxRate || "20");
    setProductDetails(reservation.productDetails || "");
    setNotes(reservation.notes || "");
    setReservationStatus(reservation.status);
    
    // Fetch additional services for this reservation
    try {
      const response = await fetch(`/api/admin/reservations/${reservation.id}/services`);
      if (response.ok) {
        const additionalServicesData = await response.json();
        setAdditionalServiceIds(additionalServicesData.map((s: any) => s.serviceId));
      } else {
        setAdditionalServiceIds([]);
      }
    } catch (error) {
      console.error("Error fetching reservation services:", error);
      setAdditionalServiceIds([]);
    }
    
    setEditReservationDialog(true);
  };

  const openDeleteDialog = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setDeleteReservationDialog(true);
  };

  if (isLoading || !isAdmin) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
      </div>
    );
  }

  const selectedQuoteDetails = selectedQuote ? quotes.find(q => q.id === selectedQuote) : null;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-admin-reservations-title">Gestion des Réservations</h1>
        <Button onClick={() => setCreateReservationDialog(true)} data-testid="button-create-reservation" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Créer une réservation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Toutes les Réservations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par client, service, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-reservations"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmées</SelectItem>
                <SelectItem value="completed">Terminées</SelectItem>
                <SelectItem value="cancelled">Annulées</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reservationsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{reservations.length === 0 ? "Aucune réservation pour le moment" : "Aucune réservation ne correspond à votre recherche"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  ref={reservation.id === highlightedId ? highlightedRef : undefined}
                  className={`flex flex-col gap-4 p-4 border rounded-md hover-elevate transition-all duration-500 ${
                    reservation.id === highlightedId 
                      ? "border-primary ring-2 ring-primary/50 bg-primary/5" 
                      : "border-border"
                  }`}
                  data-testid={`reservation-item-${reservation.id}`}
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <p className="font-semibold">Réservation #{reservation.id.slice(0, 8)}</p>
                        <StatusBadge status={reservation.status as any} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Client:</span> {getClientName(reservation.clientId)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Service:</span> {getServiceName(reservation.serviceId)}
                      </p>
                      {reservation.quoteId && (
                        <p className="text-sm text-muted-foreground">Devis: {getQuoteReference(reservation.quoteId)}</p>
                      )}
                      {reservation.wheelCount && (
                        <p className="text-sm text-muted-foreground">Jantes: {reservation.wheelCount} | Diamètre: {reservation.diameter || "N/A"}</p>
                      )}
                      {reservation.createdAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(reservation.createdAt), { addSuffix: true, locale: fr })}
                        </p>
                      )}
                    </div>
                    <div className="text-left md:text-right">
                      {reservation.scheduledDate && (
                        <p className="font-medium text-primary">
                          {new Date(reservation.scheduledDate).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      )}
                      {reservation.priceExcludingTax && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Prix HT: {parseFloat(reservation.priceExcludingTax).toFixed(2)} €
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(reservation)}
                      data-testid={`button-edit-reservation-${reservation.id}`}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDeleteDialog(reservation)}
                      data-testid={`button-delete-reservation-${reservation.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Reservation Dialog */}
      <Dialog open={createReservationDialog} onOpenChange={(open) => {
        if (!open) resetForm();
        setCreateReservationDialog(open);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une Réservation</DialogTitle>
            <DialogDescription>
              Créez une nouvelle réservation de service pour un client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label>Type de réservation</Label>
              <RadioGroup value={reservationType} onValueChange={(v) => setReservationType(v as "direct" | "from-quote")} className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="direct" id="direct" data-testid="radio-reservation-direct" />
                  <Label htmlFor="direct" className="font-normal cursor-pointer">Réservation directe</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="from-quote" id="from-quote" data-testid="radio-reservation-from-quote" />
                  <Label htmlFor="from-quote" className="font-normal cursor-pointer">À partir d'un devis approuvé</Label>
                </div>
              </RadioGroup>
            </div>

            {reservationType === "from-quote" ? (
              <>
                <div>
                  <Label htmlFor="selected-quote">Devis approuvé *</Label>
                  <Select value={selectedQuote} onValueChange={setSelectedQuote}>
                    <SelectTrigger className="mt-2" data-testid="select-quote">
                      <SelectValue placeholder="Sélectionner un devis" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvedQuotes.map((quote) => (
                        <SelectItem key={quote.id} value={quote.id}>
                          {quote.reference || `Devis #${quote.id.slice(0, 8)}`} - {quote.quoteAmount ? `${parseFloat(quote.quoteAmount).toFixed(2)} €` : "N/A"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedQuoteDetails && (
                  <div className="p-4 bg-muted rounded-md space-y-2">
                    <p className="font-semibold">Détails du devis: {selectedQuoteDetails.reference || `#${selectedQuoteDetails.id.slice(0, 8)}`}</p>
                    <p className="text-sm">Client: {getClientName(selectedQuoteDetails.clientId)}</p>
                    <p className="text-sm">Service: {getServiceName(selectedQuoteDetails.serviceId)}</p>
                    {selectedQuoteDetails.wheelCount && (
                      <p className="text-sm">Jantes: {selectedQuoteDetails.wheelCount} | Diamètre: {selectedQuoteDetails.diameter || "N/A"}</p>
                    )}
                    {selectedQuoteDetails.priceExcludingTax && (
                      <p className="text-sm">Prix HT: {parseFloat(selectedQuoteDetails.priceExcludingTax).toFixed(2)} €</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scheduled-date">Date de début *</Label>
                    <Input
                      id="scheduled-date"
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="mt-2"
                      data-testid="input-scheduled-date"
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimated-end-date">Date de fin</Label>
                    <Input
                      id="estimated-end-date"
                      type="datetime-local"
                      value={estimatedEndDate}
                      onChange={(e) => setEstimatedEndDate(e.target.value)}
                      className="mt-2"
                      data-testid="input-estimated-end-date"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status-quote">Statut</Label>
                  <Select value={reservationStatus} onValueChange={setReservationStatus}>
                    <SelectTrigger className="mt-2" data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="confirmed">Confirmée</SelectItem>
                      <SelectItem value="completed">Terminée</SelectItem>
                      <SelectItem value="cancelled">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes-quote">Notes (optionnel)</Label>
                  <Textarea
                    id="notes-quote"
                    placeholder="Notes supplémentaires..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-2"
                    data-testid="input-notes"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="client-selection-res">Sélection du client *</Label>
                  <Select value={clientSelection} onValueChange={(value: "existing" | "new") => {
                    setClientSelection(value);
                  }}>
                    <SelectTrigger id="client-selection-res" data-testid="select-client-type-res">
                      <SelectValue placeholder="Choisir une option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="existing">Client existant</SelectItem>
                      <SelectItem value="new">Nouveau client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {clientSelection === "existing" ? (
                  <div className="space-y-2">
                    <Label htmlFor="client">Client *</Label>
                    <Select value={selectedClient} onValueChange={setSelectedClient}>
                      <SelectTrigger id="client" data-testid="select-client">
                        <SelectValue placeholder="Sélectionner un client" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.filter(u => u.role === "client" || u.role === "client_professionnel").map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="p-3 bg-muted rounded-md space-y-4">
                    <p className="text-sm font-semibold">Informations du nouveau client</p>
                    <NewClientForm
                      email={newClientEmail}
                      setEmail={setNewClientEmail}
                      firstName={newClientFirstName}
                      setFirstName={setNewClientFirstName}
                      lastName={newClientLastName}
                      setLastName={setNewClientLastName}
                      phone={newClientPhone}
                      setPhone={setNewClientPhone}
                      address={newClientAddress}
                      setAddress={setNewClientAddress}
                      postalCode={newClientPostalCode}
                      setPostalCode={setNewClientPostalCode}
                      city={newClientCity}
                      setCity={setNewClientCity}
                      role={newClientRole}
                      setRole={setNewClientRole}
                      companyName={newClientCompanyName}
                      setCompanyName={setNewClientCompanyName}
                      siret={newClientSiret}
                      setSiret={setNewClientSiret}
                      tvaNumber={newClientTvaNumber}
                      setTvaNumber={setNewClientTvaNumber}
                      companyAddress={newClientCompanyAddress}
                      setCompanyAddress={setNewClientCompanyAddress}
                    />
                    <p className="text-xs text-muted-foreground">
                      Mot de passe par défaut: <span className="font-mono font-semibold">123user</span> (à changer lors de la première connexion)
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="service">Service principal *</Label>
                  <Select value={selectedService} onValueChange={(value) => {
                    setSelectedService(value);
                    // Remove from additional services if selected as main
                    setAdditionalServiceIds(prev => prev.filter(id => id !== value));
                  }}>
                    <SelectTrigger className="mt-2" data-testid="select-service">
                      <SelectValue placeholder="Sélectionner un service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.filter(s => s.isActive).map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} {service.basePrice ? `- ${parseFloat(service.basePrice).toFixed(2)} €` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedService && services.filter(s => s.isActive && s.id !== selectedService).length > 0 && (
                  <div>
                    <Label>Services additionnels</Label>
                    <div className="mt-2 p-3 border border-border rounded-md space-y-2 max-h-40 overflow-y-auto">
                      {services.filter(s => s.isActive && s.id !== selectedService).map((service) => (
                        <label key={service.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={additionalServiceIds.includes(service.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAdditionalServiceIds(prev => [...prev, service.id]);
                              } else {
                                setAdditionalServiceIds(prev => prev.filter(id => id !== service.id));
                              }
                            }}
                            className="rounded border-gray-300"
                            data-testid={`checkbox-service-${service.id}`}
                          />
                          <span className="text-sm">
                            {service.name} {service.basePrice ? `- ${parseFloat(service.basePrice).toFixed(2)} €` : ""}
                          </span>
                        </label>
                      ))}
                    </div>
                    {additionalServiceIds.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {additionalServiceIds.length} service{additionalServiceIds.length > 1 ? "s" : ""} additionnel{additionalServiceIds.length > 1 ? "s" : ""} sélectionné{additionalServiceIds.length > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scheduled-date-direct">Date de début *</Label>
                    <Input
                      id="scheduled-date-direct"
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="mt-2"
                      data-testid="input-scheduled-date-direct"
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimated-end-date-direct">Date de fin</Label>
                    <Input
                      id="estimated-end-date-direct"
                      type="datetime-local"
                      value={estimatedEndDate}
                      onChange={(e) => setEstimatedEndDate(e.target.value)}
                      className="mt-2"
                      data-testid="input-estimated-end-date-direct"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status-direct">Statut</Label>
                  <Select value={reservationStatus} onValueChange={setReservationStatus}>
                    <SelectTrigger className="mt-2" data-testid="select-status-direct">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="confirmed">Confirmée</SelectItem>
                      <SelectItem value="completed">Terminée</SelectItem>
                      <SelectItem value="cancelled">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="wheel-count">Nombre de jantes</Label>
                    <Select value={wheelCount} onValueChange={setWheelCount}>
                      <SelectTrigger className="mt-2" data-testid="select-wheel-count">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 jante</SelectItem>
                        <SelectItem value="2">2 jantes</SelectItem>
                        <SelectItem value="3">3 jantes</SelectItem>
                        <SelectItem value="4">4 jantes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="diameter">Diamètre</Label>
                    <Input
                      id="diameter"
                      type="text"
                      placeholder="ex: 17 pouces"
                      value={diameter}
                      onChange={(e) => setDiameter(e.target.value)}
                      className="mt-2"
                      data-testid="input-diameter"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price-ht">Prix HT (€)</Label>
                    <Input
                      id="price-ht"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={priceHT}
                      onChange={(e) => setPriceHT(e.target.value)}
                      className="mt-2"
                      data-testid="input-price-ht"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tax-rate">Taux TVA (%)</Label>
                    <Input
                      id="tax-rate"
                      type="number"
                      step="0.01"
                      placeholder="20"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="mt-2"
                      data-testid="input-tax-rate"
                    />
                  </div>
                </div>

                {priceHT && taxRate && (
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-sm font-semibold">Calcul automatique:</p>
                    <p className="text-sm">Prix HT: {parseFloat(priceHT).toFixed(2)} €</p>
                    <p className="text-sm">TVA ({taxRate}%): {(parseFloat(priceHT) * parseFloat(taxRate) / 100).toFixed(2)} €</p>
                    <p className="text-sm font-semibold">Prix TTC: {(parseFloat(priceHT) * (1 + parseFloat(taxRate) / 100)).toFixed(2)} €</p>
                  </div>
                )}

                <div>
                  <Label htmlFor="product-details">Détails produit</Label>
                  <Textarea
                    id="product-details"
                    placeholder="Détails sur les produits et services..."
                    value={productDetails}
                    onChange={(e) => setProductDetails(e.target.value)}
                    className="mt-2"
                    rows={3}
                    data-testid="input-product-details"
                  />
                </div>

                <div>
                  <Label htmlFor="notes-direct">Notes (optionnel)</Label>
                  <Textarea
                    id="notes-direct"
                    placeholder="Notes supplémentaires..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-2"
                    data-testid="input-notes-direct"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setCreateReservationDialog(false);
              }}
              data-testid="button-cancel-create-reservation"
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateReservation}
              disabled={createReservationMutation.isPending}
              data-testid="button-save-reservation"
            >
              {createReservationMutation.isPending ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Reservation Dialog */}
      <Dialog open={editReservationDialog} onOpenChange={(open) => {
        if (!open) {
          resetForm();
          setSelectedReservation(null);
        }
        setEditReservationDialog(open);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la Réservation</DialogTitle>
            <DialogDescription>
              Modifiez les détails de cette réservation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-scheduled-date">Date de début *</Label>
                <Input
                  id="edit-scheduled-date"
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="mt-2"
                  data-testid="input-edit-scheduled-date"
                />
              </div>
              <div>
                <Label htmlFor="edit-estimated-end-date">Date de fin</Label>
                <Input
                  id="edit-estimated-end-date"
                  type="datetime-local"
                  value={estimatedEndDate}
                  onChange={(e) => setEstimatedEndDate(e.target.value)}
                  className="mt-2"
                  data-testid="input-edit-estimated-end-date"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-status">Statut</Label>
              <Select value={reservationStatus} onValueChange={setReservationStatus}>
                <SelectTrigger className="mt-2" data-testid="select-edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="confirmed">Confirmée</SelectItem>
                  <SelectItem value="completed">Terminée</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedReservation && services.filter(s => s.isActive && s.id !== selectedReservation.serviceId).length > 0 && (
              <div>
                <Label>Services additionnels</Label>
                <div className="mt-2 p-3 border border-border rounded-md space-y-2 max-h-40 overflow-y-auto">
                  {services.filter(s => s.isActive && s.id !== selectedReservation.serviceId).map((service) => (
                    <label key={service.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={additionalServiceIds.includes(service.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAdditionalServiceIds(prev => [...prev, service.id]);
                          } else {
                            setAdditionalServiceIds(prev => prev.filter(id => id !== service.id));
                          }
                        }}
                        className="rounded border-gray-300"
                        data-testid={`checkbox-edit-service-${service.id}`}
                      />
                      <span className="text-sm">
                        {service.name} {service.basePrice ? `- ${parseFloat(service.basePrice).toFixed(2)} €` : ""}
                      </span>
                    </label>
                  ))}
                </div>
                {additionalServiceIds.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {additionalServiceIds.length} service{additionalServiceIds.length > 1 ? "s" : ""} additionnel{additionalServiceIds.length > 1 ? "s" : ""} sélectionné{additionalServiceIds.length > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-wheel-count">Nombre de jantes</Label>
                <Select value={wheelCount} onValueChange={setWheelCount}>
                  <SelectTrigger className="mt-2" data-testid="select-edit-wheel-count">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 jante</SelectItem>
                    <SelectItem value="2">2 jantes</SelectItem>
                    <SelectItem value="3">3 jantes</SelectItem>
                    <SelectItem value="4">4 jantes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-diameter">Diamètre</Label>
                <Input
                  id="edit-diameter"
                  type="text"
                  placeholder="ex: 17 pouces"
                  value={diameter}
                  onChange={(e) => setDiameter(e.target.value)}
                  className="mt-2"
                  data-testid="input-edit-diameter"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price-ht">Prix HT (€)</Label>
                <Input
                  id="edit-price-ht"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={priceHT}
                  onChange={(e) => setPriceHT(e.target.value)}
                  className="mt-2"
                  data-testid="input-edit-price-ht"
                />
              </div>

              <div>
                <Label htmlFor="edit-tax-rate">Taux TVA (%)</Label>
                <Input
                  id="edit-tax-rate"
                  type="number"
                  step="0.01"
                  placeholder="20"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="mt-2"
                  data-testid="input-edit-tax-rate"
                />
              </div>
            </div>

            {priceHT && taxRate && (
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm font-semibold">Calcul automatique:</p>
                <p className="text-sm">Prix HT: {parseFloat(priceHT).toFixed(2)} €</p>
                <p className="text-sm">TVA ({taxRate}%): {(parseFloat(priceHT) * parseFloat(taxRate) / 100).toFixed(2)} €</p>
                <p className="text-sm font-semibold">Prix TTC: {(parseFloat(priceHT) * (1 + parseFloat(taxRate) / 100)).toFixed(2)} €</p>
              </div>
            )}

            <div>
              <Label htmlFor="edit-product-details">Détails produit</Label>
              <Textarea
                id="edit-product-details"
                placeholder="Détails sur les produits et services..."
                value={productDetails}
                onChange={(e) => setProductDetails(e.target.value)}
                className="mt-2"
                rows={3}
                data-testid="input-edit-product-details"
              />
            </div>

            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                placeholder="Notes supplémentaires..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2"
                data-testid="input-edit-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setSelectedReservation(null);
                setEditReservationDialog(false);
              }}
              data-testid="button-cancel-edit-reservation"
            >
              Annuler
            </Button>
            <Button
              onClick={handleEditReservation}
              disabled={updateReservationMutation.isPending}
              data-testid="button-save-edit-reservation"
            >
              {updateReservationMutation.isPending ? "Modification..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Reservation Confirmation Dialog */}
      <AlertDialog open={deleteReservationDialog} onOpenChange={setDeleteReservationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action est irréversible.
              {selectedReservation && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="font-semibold text-foreground">Réservation #{selectedReservation.id.slice(0, 8)}</p>
                  {selectedReservation.scheduledDate && (
                    <p className="text-sm text-foreground">
                      Date: {new Date(selectedReservation.scheduledDate).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-reservation">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedReservation) {
                  deleteReservationMutation.mutate(selectedReservation.id);
                }
              }}
              disabled={deleteReservationMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete-reservation"
            >
              {deleteReservationMutation.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
