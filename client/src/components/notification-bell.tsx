import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Notification } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation } from "wouter";

export function NotificationBell() {
  const [, setLocation] = useLocation();
  
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read first
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }

    // Navigate to related page based on notification type and relatedId
    switch (notification.type) {
      case "quote":
        if (notification.relatedId) {
          setLocation(`/admin/quotes/${notification.relatedId}/edit`);
        } else {
          setLocation("/admin/quotes");
        }
        break;
      case "invoice":
        if (notification.relatedId) {
          setLocation(`/admin/invoices/${notification.relatedId}/edit`);
        } else {
          setLocation("/admin/invoices");
        }
        break;
      case "reservation":
        if (notification.relatedId) {
          setLocation(`/admin/reservations?highlight=${notification.relatedId}`);
        } else {
          setLocation("/admin/reservations");
        }
        break;
      case "service":
        if (notification.relatedId) {
          setLocation(`/admin/services?highlight=${notification.relatedId}`);
        } else {
          setLocation("/admin/services");
        }
        break;
      case "chat":
        if (notification.relatedId) {
          setLocation(`/admin/chat?conversation=${notification.relatedId}`);
        } else {
          setLocation("/admin/chat");
        }
        break;
      default:
        break;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover-elevate active-elevate-2"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
              data-testid="badge-notification-count"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="text-base font-semibold">Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Aucune notification
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-4 cursor-pointer ${
                  !notification.isRead ? "bg-accent/50" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
                data-testid={`notification-${notification.id}`}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                  </div>
                  {!notification.isRead && (
                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(notification.createdAt!), { addSuffix: true, locale: fr })}
                </p>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
