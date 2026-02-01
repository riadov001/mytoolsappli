// Reference: javascript_websocket blueprint
import { useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";

export function useWebSocket() {
  const { user, isAuthenticated } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const connectWebSocket = async () => {
      try {
        // Get authentication token from server
        const tokenResponse = await apiRequest("POST", "/api/ws/auth-token") as { token: string };
        
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("WebSocket connected");
          // Authenticate with server-issued token
          ws.send(JSON.stringify({
            type: "authenticate",
            token: tokenResponse.token,
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Handle authentication response
            if (data.type === "authenticated") {
              if (data.success) {
                console.log("WebSocket authenticated successfully");
              } else {
                console.error("WebSocket authentication failed:", data.error);
              }
              return;
            }
            
            // Invalidate relevant queries based on notification type
            if (data.type === "quote_updated") {
              queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
              queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
            } else if (data.type === "invoice_created") {
              queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
              queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
            } else if (data.type === "reservation_confirmed") {
              queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
              queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
            } else if (data.type === "chat_message") {
              // Real-time chat message received
              queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations", data.conversationId, "messages"] });
              queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
              queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
            }
          } catch (error) {
            console.error("WebSocket message error:", error);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
        };

        ws.onclose = () => {
          console.log("WebSocket disconnected");
        };
      } catch (error) {
        console.error("Failed to connect WebSocket:", error);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [isAuthenticated, user]);

  return wsRef;
}
