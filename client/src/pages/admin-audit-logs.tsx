import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { History, User, FileText, Calendar, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import type { User as UserType } from "@shared/schema";

interface AuditLogChange {
  id: string;
  auditLogId: string;
  field: string;
  previousValue: any;
  newValue: any;
}

interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId: string | null;
  actorRole: string | null;
  actorName: string | null;
  summary: string | null;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
  occurredAt: string;
  actor?: UserType;
  changes: AuditLogChange[];
}

const entityTypeLabels: Record<string, string> = {
  quote: "Devis",
  invoice: "Facture",
  reservation: "Réservation",
  service: "Service",
  workflow: "Workflow",
  workflow_step: "Étape de workflow",
  user: "Utilisateur",
  workshop_task: "Tâche atelier",
};

const actionLabels: Record<string, string> = {
  created: "Créé",
  updated: "Modifié",
  deleted: "Supprimé",
  validated: "Validé",
  rejected: "Refusé",
  completed: "Terminé",
  cancelled: "Annulé",
  paid: "Payé",
  confirmed: "Confirmé",
};

const actionColors: Record<string, string> = {
  created: "bg-green-500",
  updated: "bg-blue-500",
  deleted: "bg-red-500",
  validated: "bg-emerald-500",
  rejected: "bg-orange-500",
  completed: "bg-purple-500",
  cancelled: "bg-gray-500",
  paid: "bg-teal-500",
  confirmed: "bg-indigo-500",
};

export default function AdminAuditLogs() {
  const [filters, setFilters] = useState({
    entityType: "all",
    action: "all",
    limit: 20,
    offset: 0,
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data, isLoading } = useQuery<{ logs: AuditLog[]; total: number }>({
    queryKey: ["/api/admin/audit-logs", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.entityType && filters.entityType !== "all") params.append("entityType", filters.entityType);
      if (filters.action && filters.action !== "all") params.append("action", filters.action);
      params.append("limit", filters.limit.toString());
      params.append("offset", filters.offset.toString());
      
      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return res.json();
    },
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const currentPage = Math.floor(filters.offset / filters.limit) + 1;
  const totalPages = Math.ceil(total / filters.limit);

  const handleNextPage = () => {
    if (filters.offset + filters.limit < total) {
      setFilters({ ...filters, offset: filters.offset + filters.limit });
    }
  };

  const handlePrevPage = () => {
    if (filters.offset > 0) {
      setFilters({ ...filters, offset: Math.max(0, filters.offset - filters.limit) });
    }
  };

  const formatFieldName = (field: string): string => {
    const fieldLabels: Record<string, string> = {
      status: "Statut",
      quoteAmount: "Montant du devis",
      amount: "Montant",
      notes: "Notes",
      scheduledDate: "Date planifiée",
      isCompleted: "Complété",
      comment: "Commentaire",
      name: "Nom",
      description: "Description",
      basePrice: "Prix de base",
      title: "Titre",
      stepNumber: "Numéro d'étape",
    };
    return fieldLabels[field] || field;
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "Oui" : "Non";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <History className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Historique d'Audit</h1>
          <p className="text-muted-foreground mt-1">Traçabilité complète de toutes les actions</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-48">
              <Select
                value={filters.entityType}
                onValueChange={(value) => setFilters({ ...filters, entityType: value, offset: 0 })}
              >
                <SelectTrigger data-testid="select-entity-type">
                  <SelectValue placeholder="Type d'entité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="quote">Devis</SelectItem>
                  <SelectItem value="invoice">Facture</SelectItem>
                  <SelectItem value="reservation">Réservation</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="workflow">Workflow</SelectItem>
                  <SelectItem value="workshop_task">Tâche atelier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select
                value={filters.action}
                onValueChange={(value) => setFilters({ ...filters, action: value, offset: 0 })}
              >
                <SelectTrigger data-testid="select-action">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="created">Créé</SelectItem>
                  <SelectItem value="updated">Modifié</SelectItem>
                  <SelectItem value="deleted">Supprimé</SelectItem>
                  <SelectItem value="validated">Validé</SelectItem>
                  <SelectItem value="rejected">Refusé</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="paid">Payé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => setFilters({ entityType: "all", action: "all", limit: 20, offset: 0 })}
              data-testid="button-reset-filters"
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-lg">
            Événements ({total})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrevPage}
              disabled={filters.offset === 0}
              data-testid="button-prev-page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} / {totalPages || 1}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleNextPage}
              disabled={filters.offset + filters.limit >= total}
              data-testid="button-next-page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun événement trouvé</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 border border-border rounded-md hover-elevate cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                  data-testid={`audit-log-${log.id}`}
                >
                  <div className={`w-2 h-2 rounded-full mt-2 ${actionColors[log.action] || "bg-gray-500"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{entityTypeLabels[log.entityType] || log.entityType}</Badge>
                      <Badge className={actionColors[log.action]}>
                        {actionLabels[log.action] || log.action}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.occurredAt), "dd MMM yyyy à HH:mm", { locale: fr })}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{log.summary || "Action effectuée"}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{log.actorName || "Système"}</span>
                      {log.actorRole && (
                        <Badge variant="secondary" className="text-xs">
                          {log.actorRole}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" data-testid={`button-view-${log.id}`}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de l'événement</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Type d'entité</p>
                    <p>{entityTypeLabels[selectedLog.entityType] || selectedLog.entityType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ID de l'entité</p>
                    <p className="font-mono text-sm">{selectedLog.entityId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Action</p>
                    <Badge className={actionColors[selectedLog.action]}>
                      {actionLabels[selectedLog.action] || selectedLog.action}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date</p>
                    <p>{format(new Date(selectedLog.occurredAt), "dd MMMM yyyy à HH:mm:ss", { locale: fr })}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Utilisateur</p>
                    <p>{selectedLog.actorName || "Système"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rôle</p>
                    <p>{selectedLog.actorRole || "-"}</p>
                  </div>
                </div>

                {selectedLog.summary && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Résumé</p>
                    <p className="p-3 bg-muted rounded-md">{selectedLog.summary}</p>
                  </div>
                )}

                {selectedLog.changes && selectedLog.changes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Modifications</p>
                    <div className="space-y-2">
                      {selectedLog.changes.map((change, index) => (
                        <div key={index} className="p-3 bg-muted rounded-md">
                          <p className="font-medium text-sm">{formatFieldName(change.field)}</p>
                          <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Avant</p>
                              <p className="text-red-600 dark:text-red-400">{formatValue(change.previousValue)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Après</p>
                              <p className="text-green-600 dark:text-green-400">{formatValue(change.newValue)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedLog.ipAddress && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Adresse IP</p>
                    <p className="font-mono text-sm">{selectedLog.ipAddress}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
