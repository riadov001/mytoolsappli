import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType = "pending" | "approved" | "rejected" | "completed" | "cancelled" | "paid" | "overdue" | "confirmed";

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-muted text-muted-foreground border-muted" },
  approved: { label: "Approuvé", className: "bg-secondary text-secondary-foreground border-secondary" },
  rejected: { label: "Refusé", className: "bg-destructive text-destructive-foreground border-destructive" },
  completed: { label: "Terminé", className: "bg-primary text-primary-foreground border-primary" },
  cancelled: { label: "Annulé", className: "bg-muted text-muted-foreground border-muted" },
  paid: { label: "Payée", className: "bg-secondary text-secondary-foreground border-secondary" },
  overdue: { label: "En retard", className: "bg-destructive text-destructive-foreground border-destructive" },
  confirmed: { label: "Confirmée", className: "bg-secondary text-secondary-foreground border-secondary" },
};

export function StatusBadge({ status, className }: { status: StatusType; className?: string }) {
  const config = statusConfig[status];
  
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs uppercase tracking-wide font-medium",
        config.className,
        className
      )}
      data-testid={`badge-status-${status}`}
    >
      {config.label}
    </Badge>
  );
}
