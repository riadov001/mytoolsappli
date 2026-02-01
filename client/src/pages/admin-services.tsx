import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Service } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Edit, Trash2 } from "lucide-react";

export default function AdminServices() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    basePrice: "",
    category: "",
  });
  
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
  
  // Détection du paramètre highlight dans l'URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const highlight = params.get("highlight");
    
    if (highlight && isAuthenticated && isAdmin) {
      // Clear any existing timeout before setting a new one
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      setHighlightedId(highlight);
      window.history.replaceState({}, "", window.location.pathname);
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

  const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/admin/services"],
    enabled: isAuthenticated && isAdmin,
  });
  
  // Scroll vers l'élément highlighted quand les services sont chargés
  useEffect(() => {
    if (highlightedId && highlightedRef.current && !servicesLoading) {
      highlightedRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightedId, servicesLoading]);

  const createServiceMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/admin/services", data);
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Service créé avec succès",
      });
      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec de la création du service",
        variant: "destructive",
      });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return apiRequest("PATCH", `/api/admin/services/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Service mis à jour avec succès",
      });
      setIsDialogOpen(false);
      setEditingService(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec de la mise à jour du service",
        variant: "destructive",
      });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/services/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Service supprimé avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec de la suppression du service",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      basePrice: "",
      category: "",
    });
  };

  const handleSave = () => {
    if (editingService) {
      updateServiceMutation.mutate({ id: editingService.id, ...formData });
    } else {
      createServiceMutation.mutate(formData);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      basePrice: service.basePrice || "",
      category: service.category || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce service?")) {
      deleteServiceMutation.mutate(id);
    }
  };

  if (isLoading || !isAdmin) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-admin-services-title">Gestion des Services</h1>
        <Button
          onClick={() => {
            setEditingService(null);
            resetForm();
            setIsDialogOpen(true);
          }}
          className="w-full sm:w-auto"
          data-testid="button-add-service"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un Service
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tous les Services</CardTitle>
        </CardHeader>
        <CardContent>
          {servicesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Aucun service pour le moment. Créez-en un pour commencer!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  ref={service.id === highlightedId ? highlightedRef : undefined}
                  className={`flex flex-col gap-3 p-4 border rounded-md hover-elevate transition-all duration-500 ${
                    service.id === highlightedId 
                      ? "border-primary ring-2 ring-primary/50 bg-primary/5" 
                      : "border-border"
                  }`}
                  data-testid={`service-item-${service.id}`}
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{service.name}</h3>
                    {service.category && (
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{service.category}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                    {service.basePrice && (
                      <p className="font-mono font-semibold mt-2">À partir de {service.basePrice} €</p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(service)}
                      className="flex-1"
                      data-testid={`button-edit-${service.id}`}
                    >
                      <Edit className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Modifier</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(service.id)}
                      className="flex-1"
                      data-testid={`button-delete-${service.id}`}
                    >
                      <Trash2 className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Supprimer</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? "Modifier le Service" : "Ajouter un Nouveau Service"}</DialogTitle>
            <DialogDescription>
              {editingService ? "Modifiez les détails de ce service." : "Créez un nouveau service pour votre catalogue."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="service-name">Nom du Service</Label>
              <Input
                id="service-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex. Remplacement de pneus"
                className="mt-2"
                data-testid="input-service-name"
              />
            </div>
            <div>
              <Label htmlFor="service-category">Catégorie</Label>
              <Input
                id="service-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="ex. Entretien"
                className="mt-2"
                data-testid="input-service-category"
              />
            </div>
            <div>
              <Label htmlFor="service-price">Prix de Base ($)</Label>
              <Input
                id="service-price"
                type="number"
                step="0.01"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                placeholder="0.00"
                className="mt-2"
                data-testid="input-service-price"
              />
            </div>
            <div>
              <Label htmlFor="service-description">Description</Label>
              <Textarea
                id="service-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez le service..."
                className="mt-2"
                rows={4}
                data-testid="textarea-service-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setEditingService(null);
                resetForm();
              }}
              data-testid="button-cancel-service"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={createServiceMutation.isPending || updateServiceMutation.isPending || !formData.name}
              data-testid="button-save-service"
            >
              {createServiceMutation.isPending || updateServiceMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
