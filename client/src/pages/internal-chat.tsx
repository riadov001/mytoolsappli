import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { 
  MessageCircle, 
  Send, 
  Plus, 
  Users,
  Paperclip,
  Search,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { User, ChatConversation, ChatMessage, ChatParticipant, ChatAttachment } from "@shared/schema";

type ConversationWithDetails = ChatConversation & {
  participants: (ChatParticipant & { user: User })[];
  unreadCount: number;
  lastMessage?: ChatMessage & { sender: User; attachmentCount: number };
};

type MessageWithDetails = ChatMessage & {
  sender: User;
  attachments: ChatAttachment[];
};

interface MessageThreadProps {
  conversation: ConversationWithDetails | undefined;
  messages: MessageWithDetails[];
  messagesLoading: boolean;
  isMobileView: boolean;
  currentUserId: string | undefined;
  messageInput: string;
  onMessageInputChange: (value: string) => void;
  onSendMessage: () => void;
  sendPending: boolean;
  onBack: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const MessageThread = memo(function MessageThread({
  conversation,
  messages,
  messagesLoading,
  isMobileView,
  currentUserId,
  messageInput,
  onMessageInputChange,
  onSendMessage,
  sendPending,
  onBack,
  messagesEndRef,
}: MessageThreadProps) {
  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getParticipantName = (participant: ChatParticipant & { user: User }) => {
    return `${participant.user.firstName || ""} ${participant.user.lastName || ""}`.trim() || participant.user.email;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendMessage();
  };

  if (!conversation) {
    return (
      <div className="flex flex-col h-full">
        <div className="h-full flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">Sélectionnez une discussion</h3>
            <p className="text-sm">Choisissez une conversation à gauche ou créez-en une nouvelle</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center gap-3">
        {isMobileView && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="flex-1">
          <h3 className="font-semibold">{conversation.title}</h3>
          <p className="text-xs text-muted-foreground">
            {conversation.participants.map(p => getParticipantName(p)).join(", ")}
          </p>
        </div>
      </div>
      <ScrollArea className="flex-1 p-4">
        {messagesLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucun message</p>
              <p className="text-sm">Envoyez le premier message</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const isOwn = msg.senderId === currentUserId;
              const showAvatar = index === 0 || messages[index - 1].senderId !== msg.senderId;
              const senderName = `${msg.sender.firstName || ""} ${msg.sender.lastName || ""}`.trim() || msg.sender.email;
              
              return (
                <div key={msg.id} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
                  {showAvatar ? (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={msg.sender.profileImageUrl || undefined} />
                      <AvatarFallback>{getInitials(senderName)}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-8" />
                  )}
                  <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
                    {showAvatar && (
                      <p className={`text-xs text-muted-foreground mb-1 ${isOwn ? "text-right" : ""}`}>
                        {senderName}
                      </p>
                    )}
                    <div className={`rounded-lg p-3 ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.attachments.map(att => (
                            <div key={att.id} className="flex items-center gap-2 text-xs">
                              <Paperclip className="h-3 w-3" />
                              <span>{att.fileName}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className={`text-xs text-muted-foreground mt-1 ${isOwn ? "text-right" : ""}`}>
                      {format(new Date(msg.createdAt!), "HH:mm", { locale: fr })}
                      {msg.isEdited && " (modifié)"}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={messageInput}
            onChange={(e) => onMessageInputChange(e.target.value)}
            placeholder="Écrivez votre message..."
            className="flex-1"
            autoComplete="off"
            data-testid="input-message"
          />
          <Button 
            type="submit"
            disabled={sendPending}
            size="icon"
            className="shrink-0"
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
});

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  conversationsLoading: boolean;
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  newConversationOpen: boolean;
  onNewConversationOpenChange: (open: boolean) => void;
  newConversationTitle: string;
  onNewConversationTitleChange: (value: string) => void;
  chatUsers: User[];
  currentUserId: string | undefined;
  selectedParticipants: string[];
  onParticipantToggle: (userId: string, checked: boolean) => void;
  onCreateConversation: () => void;
  createPending: boolean;
}

const ConversationList = memo(function ConversationList({
  conversations,
  conversationsLoading,
  selectedConversationId,
  onSelectConversation,
  searchQuery,
  onSearchChange,
  newConversationOpen,
  onNewConversationOpenChange,
  newConversationTitle,
  onNewConversationTitleChange,
  chatUsers,
  currentUserId,
  selectedParticipants,
  onParticipantToggle,
  onCreateConversation,
  createPending,
}: ConversationListProps) {
  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Discussions</h2>
          <Dialog open={newConversationOpen} onOpenChange={onNewConversationOpenChange}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" data-testid="button-new-conversation">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle discussion</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre de la discussion</Label>
                  <Input
                    id="title"
                    value={newConversationTitle}
                    onChange={(e) => onNewConversationTitleChange(e.target.value)}
                    placeholder="Ex: Projet réparation client X"
                    data-testid="input-conversation-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Participants</Label>
                  <ScrollArea className="h-48 border rounded-md p-3">
                    {chatUsers.filter(u => u.id !== currentUserId).map((chatUser) => (
                      <div key={chatUser.id} className="flex items-center gap-3 py-2">
                        <Checkbox
                          id={`user-${chatUser.id}`}
                          checked={selectedParticipants.includes(chatUser.id)}
                          onCheckedChange={(checked) => onParticipantToggle(chatUser.id, !!checked)}
                          data-testid={`checkbox-participant-${chatUser.id}`}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={chatUser.profileImageUrl || undefined} />
                          <AvatarFallback>{getInitials(`${chatUser.firstName || ""} ${chatUser.lastName || ""}`.trim() || chatUser.email)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{`${chatUser.firstName || ""} ${chatUser.lastName || ""}`.trim() || chatUser.email}</p>
                          <p className="text-xs text-muted-foreground capitalize">{chatUser.role}</p>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
                <Button 
                  onClick={onCreateConversation} 
                  className="w-full" 
                  disabled={createPending}
                  data-testid="button-create-conversation"
                >
                  {createPending ? "Création..." : "Créer la discussion"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            data-testid="input-search-conversations"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {conversationsLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucune discussion</p>
            <p className="text-sm">Créez une nouvelle discussion pour commencer</p>
          </div>
        ) : (
          <div className="p-2">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                  selectedConversationId === conv.id 
                    ? "bg-primary/10" 
                    : "hover:bg-muted"
                }`}
                data-testid={`conversation-${conv.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        <Users className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    {conv.unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">{conv.title}</p>
                      {conv.lastMessage && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(conv.lastMessage.createdAt!), "HH:mm", { locale: fr })}
                        </span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                        {conv.lastMessage.attachmentCount > 0 && <Paperclip className="h-3 w-3 shrink-0" />}
                        <span className="truncate">
                          {conv.lastMessage.sender.firstName || conv.lastMessage.sender.email}: {conv.lastMessage.content || (conv.lastMessage.attachmentCount > 0 ? "Pièce jointe" : "")}
                        </span>
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{conv.participants.length}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
});

export default function InternalChat() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageInput, setMessageInput] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [newConversationTitle, setNewConversationTitle] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [isMobileView, setIsMobileView] = useState(false);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Non autorisé",
        description: "Veuillez vous connecter pour accéder au chat.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<ConversationWithDetails[]>({
    queryKey: ["/api/chat/conversations"],
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (hasAutoSelected || conversationsLoading || conversations.length === 0) return;
    
    const params = new URLSearchParams(searchString);
    const conversationId = params.get("conversation");
    
    if (conversationId) {
      const exists = conversations.some(c => c.id === conversationId);
      if (exists) {
        setSelectedConversation(conversationId);
        setHasAutoSelected(true);
        setLocation("/admin/chat", { replace: true });
      }
    }
  }, [conversations, conversationsLoading, searchString, hasAutoSelected, setLocation]);

  const { data: chatUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/chat/users"],
    enabled: isAuthenticated,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<MessageWithDetails[]>({
    queryKey: ["/api/chat/conversations", selectedConversation, "messages"],
    enabled: !!selectedConversation,
    refetchInterval: 5000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createConversationMutation = useMutation({
    mutationFn: async (data: { title: string; participantIds: string[] }) => {
      return apiRequest("POST", "/api/chat/conversations", data);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
      setNewConversationOpen(false);
      setNewConversationTitle("");
      setSelectedParticipants([]);
      setSelectedConversation(data.id);
      toast({ title: "Discussion créée", description: "La nouvelle discussion a été créée avec succès." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer la discussion.", variant: "destructive" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { conversationId: string; content: string }) => {
      return apiRequest("POST", `/api/chat/conversations/${data.conversationId}/messages`, { content: data.content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations", selectedConversation, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
      setMessageInput("");
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'envoyer le message.", variant: "destructive" });
    },
  });

  const handleSendMessage = useCallback(() => {
    const content = messageInput.trim();
    if (!selectedConversation || !content) return;
    sendMessageMutation.mutate({ conversationId: selectedConversation, content });
  }, [messageInput, selectedConversation, sendMessageMutation]);

  const handleCreateConversation = useCallback(() => {
    if (!newConversationTitle.trim() || selectedParticipants.length === 0) {
      toast({ title: "Erreur", description: "Veuillez renseigner un titre et sélectionner au moins un participant.", variant: "destructive" });
      return;
    }
    createConversationMutation.mutate({ title: newConversationTitle.trim(), participantIds: selectedParticipants });
  }, [newConversationTitle, selectedParticipants, createConversationMutation, toast]);

  const handleMessageInputChange = useCallback((value: string) => {
    setMessageInput(value);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setSelectedConversation(id);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedConversation(null);
  }, []);

  const handleParticipantToggle = useCallback((userId: string, checked: boolean) => {
    if (checked) {
      setSelectedParticipants(prev => [...prev, userId]);
    } else {
      setSelectedParticipants(prev => prev.filter(id => id !== userId));
    }
  }, []);

  const handleNewConversationTitleChange = useCallback((value: string) => {
    setNewConversationTitle(value);
  }, []);

  const currentConversation = conversations.find(c => c.id === selectedConversation);

  if (authLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto h-[calc(100vh-80px)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold" data-testid="text-chat-title">Chat Interne</h1>
        <p className="text-muted-foreground">Communiquez avec votre équipe</p>
      </div>
      <Card className="h-[calc(100%-80px)] overflow-hidden">
        <div className="flex h-full">
          {isMobileView ? (
            selectedConversation ? (
              <div className="w-full h-full flex flex-col">
                <MessageThread
                  conversation={currentConversation}
                  messages={messages}
                  messagesLoading={messagesLoading}
                  isMobileView={isMobileView}
                  currentUserId={user?.id}
                  messageInput={messageInput}
                  onMessageInputChange={handleMessageInputChange}
                  onSendMessage={handleSendMessage}
                  sendPending={sendMessageMutation.isPending}
                  onBack={handleBack}
                  messagesEndRef={messagesEndRef}
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col">
                <ConversationList
                  conversations={conversations}
                  conversationsLoading={conversationsLoading}
                  selectedConversationId={selectedConversation}
                  onSelectConversation={handleSelectConversation}
                  searchQuery={searchQuery}
                  onSearchChange={handleSearchChange}
                  newConversationOpen={newConversationOpen}
                  onNewConversationOpenChange={setNewConversationOpen}
                  newConversationTitle={newConversationTitle}
                  onNewConversationTitleChange={handleNewConversationTitleChange}
                  chatUsers={chatUsers}
                  currentUserId={user?.id}
                  selectedParticipants={selectedParticipants}
                  onParticipantToggle={handleParticipantToggle}
                  onCreateConversation={handleCreateConversation}
                  createPending={createConversationMutation.isPending}
                />
              </div>
            )
          ) : (
            <>
              <div className="w-80 border-r shrink-0 h-full flex flex-col">
                <ConversationList
                  conversations={conversations}
                  conversationsLoading={conversationsLoading}
                  selectedConversationId={selectedConversation}
                  onSelectConversation={handleSelectConversation}
                  searchQuery={searchQuery}
                  onSearchChange={handleSearchChange}
                  newConversationOpen={newConversationOpen}
                  onNewConversationOpenChange={setNewConversationOpen}
                  newConversationTitle={newConversationTitle}
                  onNewConversationTitleChange={handleNewConversationTitleChange}
                  chatUsers={chatUsers}
                  currentUserId={user?.id}
                  selectedParticipants={selectedParticipants}
                  onParticipantToggle={handleParticipantToggle}
                  onCreateConversation={handleCreateConversation}
                  createPending={createConversationMutation.isPending}
                />
              </div>
              <div className="flex-1 h-full flex flex-col min-w-0">
                <MessageThread
                  conversation={currentConversation}
                  messages={messages}
                  messagesLoading={messagesLoading}
                  isMobileView={isMobileView}
                  currentUserId={user?.id}
                  messageInput={messageInput}
                  onMessageInputChange={handleMessageInputChange}
                  onSendMessage={handleSendMessage}
                  sendPending={sendMessageMutation.isPending}
                  onBack={handleBack}
                  messagesEndRef={messagesEndRef}
                />
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
