import { Home, FileText, DollarSign, Calendar, CalendarCheck, Settings, Package, Users, Briefcase, Wrench, ClipboardList, GitBranch, History, MessageCircle, LifeBuoy } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useLocation } from "wouter";
import logoMyJantes from "@assets/cropped-Logo-2-1-768x543_(3)_1767977972324.png";

const menuItems = [
  {
    title: "Tableau de bord",
    url: "/admin",
    icon: Home,
  },
  {
    title: "Prestations",
    url: "/admin/engagements",
    icon: Briefcase,
  },
  {
    title: "Atelier",
    url: "/admin/workshop",
    icon: Wrench,
  },
  {
    title: "Catalogue Services",
    url: "/admin/services-catalog",
    icon: ClipboardList,
  },
  {
    title: "Services",
    url: "/admin/services",
    icon: Package,
  },
  {
    title: "Workflows",
    url: "/admin/service-workflows",
    icon: GitBranch,
  },
  {
    title: "Devis",
    url: "/admin/quotes",
    icon: FileText,
  },
  {
    title: "Factures",
    url: "/admin/invoices",
    icon: DollarSign,
  },
  {
    title: "Réservations",
    url: "/admin/reservations",
    icon: Calendar,
  },
  {
    title: "Planning",
    url: "/admin/calendar",
    icon: CalendarCheck,
  },
  {
    title: "Utilisateurs",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Chat Interne",
    url: "/admin/chat",
    icon: MessageCircle,
  },
  {
    title: "Historique",
    url: "/admin/audit-logs",
    icon: History,
  },
  {
    title: "Paramètres",
    url: "/admin/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-6">
            <div className="bg-white rounded-lg p-3 border border-border inline-block">
              <img 
                src={logoMyJantes} 
                alt="MyJantes Logo" 
                className="h-12 w-auto"
                data-testid="logo-myjantes"
              />
            </div>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase()}`}
                  >
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild data-testid="button-support">
              <a href="mailto:contact@myjantes.com">
                <LifeBuoy className="h-4 w-4" />
                <span>Support</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
