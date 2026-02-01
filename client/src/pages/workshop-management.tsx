import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Reservation, Service } from "@shared/schema";

interface WorkshopTask {
  id: string;
  reservationId: string;
  isCompleted: boolean;
  comment?: string;
  completedAt?: Date;
  step: {
    id: string;
    stepNumber: number;
    title: string;
    description?: string;
  };
}

export default function WorkshopManagement() {
  const { toast } = useToast();
  const [selectedReservationId, setSelectedReservationId] = useState<string>("");
  const [commentingTaskId, setCommentingTaskId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const { data: reservations = [] } = useQuery<Reservation[]>({
    queryKey: ["/api/admin/reservations"],
  });

  const { data: tasks = [] } = useQuery<WorkshopTask[]>({
    queryKey: ["/api/workshop/reservations", selectedReservationId, "tasks"],
    enabled: !!selectedReservationId,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, isCompleted, comment }: any) =>
      apiRequest("PATCH", `/api/workshop/tasks/${taskId}`, { isCompleted, comment }),
    onSuccess: () => {
      toast({ title: "Succès", description: "Étape mise à jour" });
      queryClient.invalidateQueries({ queryKey: ["/api/workshop/reservations", selectedReservationId, "tasks"] });
      setCommentingTaskId(null);
      setCommentText("");
    },
    onError: (error: Error) => 
      toast({ title: "Erreur", description: error.message, variant: "destructive" }),
  });

  const handleCompleteTask = (task: WorkshopTask) => {
    updateTaskMutation.mutate({
      taskId: task.id,
      isCompleted: !task.isCompleted,
      comment: task.comment,
    });
  };

  const handleAddComment = (task: WorkshopTask) => {
    updateTaskMutation.mutate({
      taskId: task.id,
      isCompleted: task.isCompleted,
      comment: commentText,
    });
  };

  const selectedReservation = reservations.find(r => r.id === selectedReservationId);
  const completedCount = tasks.filter(t => t.isCompleted).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Gestion de l'Atelier</h1>
        <p className="text-muted-foreground mt-1">Suivi des travaux et validation des étapes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sélectionner une Réservation</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedReservationId} onValueChange={setSelectedReservationId}>
            <SelectTrigger data-testid="select-reservation-workshop">
              <SelectValue placeholder="Sélectionner une réservation" />
            </SelectTrigger>
            <SelectContent>
              {reservations
                .filter(r => r.status === "confirmed" || r.status === "pending")
                .map(reservation => (
                  <SelectItem key={reservation.id} value={reservation.id}>
                    Réservation {reservation.id.slice(0, 8)} - Service {reservation.serviceId.slice(0, 8)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedReservation && tasks.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Progression des Travaux</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Avancement</span>
                  <span className="text-sm font-bold">{completedCount}/{tasks.length} ({progressPercent}%)</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Checklist des Étapes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-4 border border-border rounded-md hover-elevate"
                    data-testid={`task-item-${task.id}`}
                  >
                    <Checkbox
                      checked={task.isCompleted}
                      onCheckedChange={() => handleCompleteTask(task)}
                      className="mt-1"
                      data-testid={`checkbox-task-${task.id}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{task.step.stepNumber}</Badge>
                        <p className={`font-medium ${task.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                          {task.step.title}
                        </p>
                        {task.isCompleted && <Badge variant="default">Complété</Badge>}
                      </div>
                      {task.step.description && (
                        <p className="text-sm text-muted-foreground mt-1">{task.step.description}</p>
                      )}
                      {task.comment && (
                        <div className="mt-2 p-2 bg-secondary rounded text-sm">
                          <p className="font-medium text-xs mb-1">Commentaire:</p>
                          <p>{task.comment}</p>
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCommentingTaskId(task.id)}
                      data-testid={`button-comment-${task.id}`}
                    >
                      {task.comment ? "Modifier" : "Ajouter"} Commentaire
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {selectedReservation && tasks.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Aucune étape de workflow associée à cette réservation
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!commentingTaskId} onOpenChange={(open) => !open && setCommentingTaskId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un Commentaire</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Ajoutez un commentaire si nécessaire..."
              rows={4}
              data-testid="textarea-comment"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCommentingTaskId(null);
                setCommentText("");
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                const task = tasks.find(t => t.id === commentingTaskId);
                if (task) {
                  handleAddComment(task);
                }
              }}
              disabled={updateTaskMutation.isPending}
              data-testid="button-save-comment"
            >
              {updateTaskMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
