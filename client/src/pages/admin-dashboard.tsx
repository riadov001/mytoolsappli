import { useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { 
  FileText, 
  DollarSign, 
  Calendar, 
  Users,
  ClipboardList,
  CalendarClock,
  CheckCircle,
  Receipt,
  Settings
} from "lucide-react";
import type { Quote, Invoice, Reservation, User } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Non autorisé",
        description: "Vous êtes déconnecté. Reconnexion...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
    if (!isLoading && !isAdmin) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas la permission d'accéder à cette page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    }
  }, [isAuthenticated, isLoading, isAdmin, toast]);

  const { data: quotes = [], isLoading: quotesLoading } = useQuery<Quote[]>({
    queryKey: ["/api/admin/quotes"],
    enabled: isAuthenticated && isAdmin,
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/admin/invoices"],
    enabled: isAuthenticated && isAdmin,
  });

  const { data: reservations = [], isLoading: reservationsLoading } = useQuery<Reservation[]>({
    queryKey: ["/api/admin/reservations"],
    enabled: isAuthenticated && isAdmin,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated && isAdmin,
  });

  const totalReservations = reservations.length;
  const totalQuotes = quotes.length;
  const totalInvoices = invoices.length;
  const totalRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + parseFloat(i.amount || "0"), 0);

  if (isLoading || !isAdmin) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-admin-dashboard-title">Dashboard Admin</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">Vue d'ensemble de votre activité</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/reservations" data-testid="card-link-reservations">
          <Card className="hover-elevate active-elevate-2 bg-card cursor-pointer transition-all">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
              <CardTitle className="text-base font-medium">Réservations</CardTitle>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-admin-reservations-count">
                {reservationsLoading ? <Skeleton className="h-9 w-16" /> : totalReservations}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/quotes" data-testid="card-link-quotes">
          <Card className="hover-elevate active-elevate-2 bg-card cursor-pointer transition-all">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
              <CardTitle className="text-base font-medium">Devis</CardTitle>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-admin-quotes-count">
                {quotesLoading ? <Skeleton className="h-9 w-16" /> : totalQuotes}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/invoices" data-testid="card-link-invoices">
          <Card className="hover-elevate active-elevate-2 bg-card cursor-pointer transition-all">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
              <CardTitle className="text-base font-medium">Factures</CardTitle>
              <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="text-admin-invoices-count">
                {invoicesLoading ? <Skeleton className="h-9 w-16" /> : totalInvoices}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/invoices" data-testid="card-link-revenue">
          <Card className="hover-elevate active-elevate-2 bg-card cursor-pointer transition-all">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
              <CardTitle className="text-base font-medium">Chiffre d'affaires</CardTitle>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono" data-testid="text-admin-revenue">
                {invoicesLoading ? <Skeleton className="h-9 w-32" /> : `${totalRevenue.toFixed(2)} €`}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-xl">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href="/admin/reservations" className="flex items-center gap-3 p-3 rounded-lg hover-elevate active-elevate-2 transition-colors" data-testid="link-manage-reservations">
            <ClipboardList className="h-5 w-5 text-primary" />
            <span className="font-medium">Gérer les réservations</span>
          </Link>

          <Link href="/admin/reservations" className="flex items-center gap-3 p-3 rounded-lg hover-elevate active-elevate-2 transition-colors" data-testid="link-planning-assignments">
            <CalendarClock className="h-5 w-5 text-primary" />
            <span className="font-medium">Planning & Assignations</span>
          </Link>

          <Link href="/admin/quotes" className="flex items-center gap-3 p-3 rounded-lg hover-elevate active-elevate-2 transition-colors" data-testid="link-validate-quotes">
            <CheckCircle className="h-5 w-5 text-primary" />
            <span className="font-medium">Valider les devis</span>
          </Link>

          <Link href="/admin/invoices" className="flex items-center gap-3 p-3 rounded-lg hover-elevate active-elevate-2 transition-colors" data-testid="link-manage-invoices">
            <Receipt className="h-5 w-5 text-primary" />
            <span className="font-medium">Gérer les factures</span>
          </Link>

          <Link href="/admin/settings" className="flex items-center gap-3 p-3 rounded-lg hover-elevate active-elevate-2 transition-colors" data-testid="link-manage-users">
            <Users className="h-5 w-5 text-primary" />
            <span className="font-medium">Gérer les utilisateurs</span>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
