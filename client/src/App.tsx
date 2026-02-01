// Local authentication with email/password
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { UserMenu } from "@/components/user-menu";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import ClientDashboard from "@/pages/client-dashboard";
import ClientQuotes from "@/pages/client-quotes";
import ClientInvoices from "@/pages/client-invoices";
import AdminDashboard from "@/pages/admin-dashboard";
import Services from "@/pages/services";
import AdminQuotes from "@/pages/admin-quotes";
import AdminServices from "@/pages/admin-services";
import AdminInvoices from "@/pages/admin-invoices";
import AdminInvoiceEdit from "@/pages/admin-invoice-edit";
import AdminQuoteEdit from "@/pages/admin-quote-edit";
import AdminReservations from "@/pages/admin-reservations";
import AdminCalendar from "@/pages/admin-calendar";
import AdminSettings from "@/pages/admin-settings";
import AdminUsers from "@/pages/admin-users";
import AdminEngagements from "@/pages/admin-engagements";
import AdminServiceWorkflows from "@/pages/admin-service-workflows";
import AdminAuditLogs from "@/pages/admin-audit-logs";
import WorkshopManagement from "@/pages/workshop-management";
import EmployeeServices from "@/pages/employee-services";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import InternalChat from "@/pages/internal-chat";

function Router() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  useWebSocket(); // Initialize WebSocket connection

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password/:token" component={ResetPassword} />
        <Route>
          <Redirect to="/login" />
        </Route>
      </Switch>
    );
  }

  if (isAdmin) {
    const style = {
      "--sidebar-width": "16rem",
      "--sidebar-width-icon": "3rem",
    };

    return (
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <header className="flex items-center justify-between p-2 sm:p-4 border-b border-border bg-background shrink-0">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="flex items-center gap-1 sm:gap-2">
                <NotificationBell />
                <ThemeToggle />
                <UserMenu />
              </div>
            </header>
            <main className="flex-1 overflow-auto">
              <Switch>
                <Route path="/admin" component={AdminDashboard} />
                <Route path="/admin/engagements" component={AdminEngagements} />
                <Route path="/admin/service-workflows" component={AdminServiceWorkflows} />
                <Route path="/admin/services" component={AdminServices} />
                <Route path="/admin/quotes/:id/edit" component={AdminQuoteEdit} />
                <Route path="/admin/quotes" component={AdminQuotes} />
                <Route path="/admin/invoices/:id/edit" component={AdminInvoiceEdit} />
                <Route path="/admin/invoices" component={AdminInvoices} />
                <Route path="/admin/reservations" component={AdminReservations} />
                <Route path="/admin/calendar" component={AdminCalendar} />
                <Route path="/admin/workshop" component={WorkshopManagement} />
                <Route path="/admin/services-catalog" component={EmployeeServices} />
                <Route path="/admin/users" component={AdminUsers} />
                <Route path="/admin/audit-logs" component={AdminAuditLogs} />
                <Route path="/admin/settings" component={AdminSettings} />
                <Route path="/admin/chat" component={InternalChat} />
                <Route path="/login">
                  <Redirect to="/admin" />
                </Route>
                <Route path="/" component={AdminDashboard} />
                <Route component={NotFound} />
              </Switch>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between p-2 sm:p-4 border-b border-border bg-background shrink-0">
        <h1 className="text-xl sm:text-2xl font-bold text-primary">MyJantes</h1>
        <div className="flex items-center gap-1 sm:gap-2">
          <NotificationBell />
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        <Switch>
          <Route path="/" component={ClientDashboard} />
          <Route path="/services" component={Services} />
          <Route path="/quotes" component={ClientQuotes} />
          <Route path="/invoices" component={ClientInvoices} />
          <Route path="/login">
            <Redirect to="/" />
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
