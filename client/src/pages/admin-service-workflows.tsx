import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Wrench, Clock, CheckCircle2 } from "lucide-react";
import type { Service, Workflow, WorkflowStep } from "@shared/schema";

interface ServiceWithWorkflow extends Service {
  workflow: (Workflow & { steps: WorkflowStep[] }) | null;
}

export default function AdminServiceWorkflows() {
  const { toast } = useToast();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [isStepDialogOpen, setIsStepDialogOpen] = useState(false);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [stepForm, setStepForm] = useState({ title: "", description: "", stepNumber: 1 });

  const { data: services = [], isLoading } = useQuery<ServiceWithWorkflow[]>({
    queryKey: ["/api/services-with-workflows"],
  });

  const selectedService = services.find(s => s.id === selectedServiceId);
  const workflowSteps = selectedService?.workflow?.steps || [];

  const createStepMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingStepId) {
        return apiRequest("PATCH", `/api/admin/workflow-steps/${editingStepId}`, data);
      }
      return apiRequest("POST", "/api/admin/workflow-steps", data);
    },
    onSuccess: () => {
      const message = editingStepId ? "L'étape a été mise à jour" : "L'étape a été créée avec succès";
      toast({ title: "Succès", description: message });
      setIsStepDialogOpen(false);
      setEditingStepId(null);
      setStepForm({ title: "", description: "", stepNumber: 1 });
      queryClient.invalidateQueries({ queryKey: ["/api/services-with-workflows"] });
    },
    onError: (error: Error) => toast({ title: "Erreur", description: error.message, variant: "destructive" }),
  });

  const deleteStepMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/workflow-steps/${id}`),
    onSuccess: () => {
      toast({ title: "Succès", description: "Étape supprimée" });
      queryClient.invalidateQueries({ queryKey: ["/api/services-with-workflows"] });
    },
    onError: (error: Error) => toast({ title: "Erreur", description: error.message, variant: "destructive" }),
  });

  const openAddStepDialog = (service: ServiceWithWorkflow) => {
    if (!service.workflow) {
      toast({ title: "Info", description: "Ce service n'a pas de workflow associé", variant: "destructive" });
      return;
    }
    setSelectedServiceId(service.id);
    setEditingStepId(null);
    setStepForm({ 
      title: "", 
      description: "", 
      stepNumber: (service.workflow.steps.length || 0) + 1 
    });
    setIsStepDialogOpen(true);
  };

  const openEditStepDialog = (step: WorkflowStep, serviceId: string) => {
    setSelectedServiceId(serviceId);
    setEditingStepId(step.id);
    setStepForm({
      title: step.title,
      description: step.description || "",
      stepNumber: step.stepNumber,
    });
    setIsStepDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold">Gestion des Workflows</h1>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Gestion des Workflows</h1>
        <p className="text-muted-foreground mt-1">
          Gérez les étapes de travail pour chaque service
        </p>
      </div>

      <div className="grid gap-4">
        {services.map((service) => (
          <Card key={service.id} data-testid={`card-admin-service-${service.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Wrench className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    {service.description && (
                      <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {service.basePrice && (
                    <Badge variant="secondary" className="text-sm">
                      {parseFloat(service.basePrice).toFixed(2)} €
                    </Badge>
                  )}
                  {service.estimatedDuration && (
                    <Badge variant="outline" className="text-sm">
                      <Clock className="h-3 w-3 mr-1" />
                      {service.estimatedDuration} min
                    </Badge>
                  )}
                  {service.workflow && (
                    <Button
                      size="sm"
                      onClick={() => openAddStepDialog(service)}
                      data-testid={`button-add-step-${service.id}`}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter étape
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {service.workflow && service.workflow.steps.length > 0 ? (
                <Accordion type="single" collapsible className="w-full" defaultValue="steps">
                  <AccordionItem value="steps" className="border-none">
                    <AccordionTrigger 
                      className="py-2 hover:no-underline"
                      data-testid={`accordion-admin-steps-${service.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {service.workflow.steps.length} étapes de travail
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {service.workflow.steps
                          .sort((a, b) => a.stepNumber - b.stepNumber)
                          .map((step) => (
                          <div
                            key={step.id}
                            className="flex items-start gap-3 p-3 bg-muted/50 rounded-md"
                            data-testid={`admin-step-item-${step.id}`}
                          >
                            <Badge variant="outline" className="flex-shrink-0 min-w-[28px] justify-center">
                              {step.stepNumber}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{step.title}</p>
                              {step.description && step.description !== step.title && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {step.description}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditStepDialog(step, service.id)}
                                data-testid={`button-edit-step-${step.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (confirm("Êtes-vous sûr de vouloir supprimer cette étape?")) {
                                    deleteStepMutation.mutate(step.id);
                                  }
                                }}
                                disabled={deleteStepMutation.isPending}
                                data-testid={`button-delete-step-${step.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : service.workflow ? (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    Aucune étape définie. Ajoutez la première étape!
                  </p>
                  <Button
                    size="sm"
                    onClick={() => openAddStepDialog(service)}
                    data-testid={`button-add-first-step-${service.id}`}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  Aucun workflow associé à ce service
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Aucun service disponible. Créez des services d'abord.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isStepDialogOpen} onOpenChange={(open) => {
        setIsStepDialogOpen(open);
        if (!open) {
          setEditingStepId(null);
          setStepForm({ title: "", description: "", stepNumber: 1 });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStepId ? "Modifier l'Étape" : "Ajouter une Étape"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="step-number">Numéro de l'étape</Label>
              <Input
                id="step-number"
                type="number"
                value={stepForm.stepNumber}
                onChange={(e) => setStepForm({ ...stepForm, stepNumber: parseInt(e.target.value) || 1 })}
                className="mt-2"
                data-testid="input-step-number"
              />
            </div>
            <div>
              <Label htmlFor="step-title">Titre de l'étape</Label>
              <Input
                id="step-title"
                value={stepForm.title}
                onChange={(e) => setStepForm({ ...stepForm, title: e.target.value })}
                placeholder="ex. Analyse de l'état"
                className="mt-2"
                data-testid="input-step-title"
              />
            </div>
            <div>
              <Label htmlFor="step-description">Description (optionnel)</Label>
              <Textarea
                id="step-description"
                value={stepForm.description}
                onChange={(e) => setStepForm({ ...stepForm, description: e.target.value })}
                placeholder="Décrivez l'étape..."
                className="mt-2"
                rows={3}
                data-testid="textarea-step-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsStepDialogOpen(false);
              setEditingStepId(null);
              setStepForm({ title: "", description: "", stepNumber: 1 });
            }} data-testid="button-cancel-step">Annuler</Button>
            {editingStepId && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm("Êtes-vous sûr de vouloir supprimer cette étape?")) {
                    deleteStepMutation.mutate(editingStepId);
                    setIsStepDialogOpen(false);
                    setEditingStepId(null);
                  }
                }}
                disabled={deleteStepMutation.isPending}
                data-testid="button-delete-step-dialog"
              >
                Supprimer
              </Button>
            )}
            <Button
              onClick={() => {
                const workflowId = selectedService?.workflow?.id;
                if (!workflowId) {
                  toast({ title: "Erreur", description: "Aucun workflow associé", variant: "destructive" });
                  return;
                }
                createStepMutation.mutate({ ...stepForm, workflowId });
              }}
              disabled={createStepMutation.isPending || !stepForm.title}
              data-testid="button-save-step"
            >
              {createStepMutation.isPending ? "Enregistrement..." : editingStepId ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
