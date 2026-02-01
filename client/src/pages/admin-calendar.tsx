import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Reservation, User, Service } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { formatLocalTime, formatLocalDateTime, parseWithoutTimezoneShift } from "@/lib/dateUtils";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Download, Calendar as CalendarIcon, User as UserIcon, Wrench, ExternalLink, Clock, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function AdminCalendar() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigningEmployee, setAssigningEmployee] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      toast({
        title: "Non autorisé",
        description: "Vous n'avez pas la permission d'accéder à cette page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    }
  }, [isAuthenticated, isLoading, isAdmin, toast]);

  const { data: reservations = [], isLoading: reservationsLoading } = useQuery<Reservation[]>({
    queryKey: ["/api/admin/reservations"],
    enabled: isAuthenticated && isAdmin,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated && isAdmin,
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    enabled: isAuthenticated,
  });

  const assignEmployeeMutation = useMutation({
    mutationFn: async ({ reservationId, employeeId }: { reservationId: string; employeeId: string | null }) => {
      return apiRequest("PATCH", `/api/admin/reservations/${reservationId}`, {
        assignedEmployeeId: employeeId,
      });
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Employé assigné avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reservations"] });
      setAssigningEmployee(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec de l'assignation",
        variant: "destructive",
      });
    },
  });

  const handleAssignEmployee = (reservationId: string, employeeId: string) => {
    const newEmployeeId = employeeId === "unassigned" ? null : employeeId;
    assignEmployeeMutation.mutate({ reservationId, employeeId: newEmployeeId });
    
    // Update selected reservation locally for immediate UI feedback
    if (selectedReservation && selectedReservation.id === reservationId) {
      setSelectedReservation({
        ...selectedReservation,
        assignedEmployeeId: newEmployeeId,
      });
    }
  };

  const employees = useMemo(() => 
    users.filter(u => u.role === "employe" || u.role === "admin"),
    [users]
  );

  const getClientName = (clientId: string) => {
    const client = users.find(u => u.id === clientId);
    if (!client) return `Client-${clientId.slice(0, 8)}`;
    return `${client.firstName || ""} ${client.lastName || ""}`.trim() || client.email;
  };

  const getEmployeeName = (employeeId: string | null) => {
    if (!employeeId) return "Non assigné";
    const employee = users.find(u => u.id === employeeId);
    if (!employee) return `Employé-${employeeId.slice(0, 8)}`;
    return `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || employee.email;
  };

  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service?.name || `Service-${serviceId.slice(0, 8)}`;
  };

  const getServiceDuration = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service?.estimatedDuration || 60;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-500";
      case "pending": return "bg-yellow-500";
      case "completed": return "bg-blue-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed": return "Confirmé";
      case "pending": return "En attente";
      case "completed": return "Terminé";
      case "cancelled": return "Annulé";
      default: return status;
    }
  };

  const filteredReservations = useMemo(() => {
    return reservations.filter(r => {
      const matchesEmployee = employeeFilter === "all" || r.assignedEmployeeId === employeeFilter;
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesEmployee && matchesStatus;
    });
  }, [reservations, employeeFilter, statusFilter]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const getReservationsForDay = (date: Date) => {
    return filteredReservations.filter(r => {
      const scheduledDate = parseWithoutTimezoneShift(r.scheduledDate);
      return isSameDay(scheduledDate, date);
    });
  };

  const selectedDayReservations = selectedDate ? getReservationsForDay(selectedDate) : [];

  const escapeICSText = (text: string) => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  const formatICSDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const foldICSLine = (line: string): string => {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(line);
    const maxBytes = 75;
    
    if (bytes.length <= maxBytes) return line;
    
    const result: string[] = [];
    const decoder = new TextDecoder();
    let start = 0;
    let isFirst = true;
    
    while (start < bytes.length) {
      const limit = isFirst ? maxBytes : maxBytes - 1;
      let end = Math.min(start + limit, bytes.length);
      
      while (end > start && (bytes[end] & 0xC0) === 0x80) {
        end--;
      }
      
      const chunk = decoder.decode(bytes.slice(start, end));
      result.push(isFirst ? chunk : ' ' + chunk);
      start = end;
      isFirst = false;
    }
    
    return result.join('\r\n');
  };

  const buildICSContent = (lines: string[]): string => {
    return lines.map(line => foldICSLine(line)).join('\r\n');
  };

  const generateICS = (reservation: Reservation) => {
    const startDate = new Date(reservation.scheduledDate);
    const duration = getServiceDuration(reservation.serviceId);
    const endDate = reservation.estimatedEndDate 
      ? new Date(reservation.estimatedEndDate) 
      : new Date(startDate.getTime() + duration * 60000);

    const clientName = escapeICSText(getClientName(reservation.clientId));
    const employeeName = escapeICSText(getEmployeeName(reservation.assignedEmployeeId));
    const serviceName = escapeICSText(getServiceName(reservation.serviceId));
    const reservationUrl = `${window.location.origin}/admin/reservations`;

    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MyJantes//Reservation Calendar//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `UID:${reservation.id}@myjantes.fr`,
      `SUMMARY:${serviceName} - ${clientName}`,
      `DESCRIPTION:Reservation ID: ${reservation.id.slice(0, 8)}\\nClient: ${clientName}\\nEmploye: ${employeeName}\\nService: ${serviceName}\\n\\nLien: ${reservationUrl}`,
      'LOCATION:MyJantes Atelier',
      `STATUS:${reservation.status === 'confirmed' ? 'CONFIRMED' : reservation.status === 'cancelled' ? 'CANCELLED' : 'TENTATIVE'}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ];

    const icsContent = buildICSContent(icsLines);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reservation-${reservation.id.slice(0, 8)}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Fichier ICS téléchargé",
      description: "L'événement a été exporté pour votre calendrier.",
    });
  };

  const generateAllICS = () => {
    const eventLines: string[] = [];

    filteredReservations.forEach(reservation => {
      const startDate = new Date(reservation.scheduledDate);
      const duration = getServiceDuration(reservation.serviceId);
      const endDate = reservation.estimatedEndDate 
        ? new Date(reservation.estimatedEndDate) 
        : new Date(startDate.getTime() + duration * 60000);

      const clientName = escapeICSText(getClientName(reservation.clientId));
      const employeeName = escapeICSText(getEmployeeName(reservation.assignedEmployeeId));
      const serviceName = escapeICSText(getServiceName(reservation.serviceId));
      const reservationUrl = `${window.location.origin}/admin/reservations`;

      eventLines.push(
        'BEGIN:VEVENT',
        `DTSTART:${formatICSDate(startDate)}`,
        `DTEND:${formatICSDate(endDate)}`,
        `DTSTAMP:${formatICSDate(new Date())}`,
        `UID:${reservation.id}@myjantes.fr`,
        `SUMMARY:${serviceName} - ${clientName}`,
        `DESCRIPTION:Reservation ID: ${reservation.id.slice(0, 8)}\\nClient: ${clientName}\\nEmploye: ${employeeName}\\nService: ${serviceName}\\n\\nLien: ${reservationUrl}`,
        'LOCATION:MyJantes Atelier',
        `STATUS:${reservation.status === 'confirmed' ? 'CONFIRMED' : reservation.status === 'cancelled' ? 'CANCELLED' : 'TENTATIVE'}`,
        'END:VEVENT'
      );
    });

    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MyJantes//Reservation Calendar//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      ...eventLines,
      'END:VCALENDAR'
    ];

    const icsContent = buildICSContent(icsLines);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `planning-myjantes-${format(currentMonth, 'yyyy-MM')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Planning exporté",
      description: `${filteredReservations.length} réservations exportées au format ICS.`,
    });
  };

  if (isLoading || reservationsLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-calendar-title">
            Calendrier des Réservations
          </h1>
          <p className="text-sm text-muted-foreground">
            Planification intelligente de l'atelier
          </p>
        </div>
        <Button 
          onClick={generateAllICS}
          className="w-full sm:w-auto"
          data-testid="button-export-all-ics"
        >
          <Download className="h-4 w-4 mr-2" />
          Exporter ICS
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold min-w-[180px] text-center capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: fr })}
              </h2>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                data-testid="button-next-month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-employee-filter">
                  <UserIcon className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Employé" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les employés</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {`${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]" data-testid="select-status-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="confirmed">Confirmé</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs sm:text-sm font-medium text-muted-foreground p-1 sm:p-2">
                {day}
              </div>
            ))}
            {calendarDays.map((day, idx) => {
              const dayReservations = getReservationsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    min-h-[60px] sm:min-h-[80px] md:min-h-[100px] p-1 border rounded-md cursor-pointer transition-colors
                    ${!isCurrentMonth ? 'bg-muted/30 text-muted-foreground' : 'bg-background'}
                    ${isToday ? 'ring-2 ring-primary' : ''}
                    ${isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'}
                  `}
                  data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
                >
                  <div className="text-xs sm:text-sm font-medium mb-1">
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    {dayReservations.slice(0, 3).map(res => (
                      <div
                        key={res.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReservation(res);
                        }}
                        className={`
                          ${getStatusColor(res.status)} text-white text-[10px] sm:text-xs 
                          px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80
                        `}
                        title={`${getServiceName(res.serviceId)} - ${getClientName(res.clientId)}`}
                      >
                        <span className="hidden sm:inline">{formatLocalTime(res.scheduledDate)} </span>
                        {getClientName(res.clientId).split(' ')[0]}
                      </div>
                    ))}
                    {dayReservations.length > 3 && (
                      <div className="text-[10px] sm:text-xs text-muted-foreground">
                        +{dayReservations.length - 3} autres
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarIcon className="h-5 w-5" />
              {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
              <Badge variant="outline">{selectedDayReservations.length} réservation(s)</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDayReservations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucune réservation pour cette date
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDayReservations.map(res => (
                  <div
                    key={res.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg hover:bg-muted/50"
                    data-testid={`reservation-card-${res.id}`}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${getStatusColor(res.status)} text-white`}>
                          {getStatusLabel(res.status)}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          ID: {res.id.slice(0, 8)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {formatLocalTime(res.scheduledDate)}
                        </span>
                        <span className="text-muted-foreground">-</span>
                        <span>
                          {res.estimatedEndDate 
                            ? formatLocalTime(res.estimatedEndDate)
                            : formatLocalTime(new Date(parseWithoutTimezoneShift(res.scheduledDate).getTime() + getServiceDuration(res.serviceId) * 60000))
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                        <span>{getServiceName(res.serviceId)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        <span>Client: <strong>{getClientName(res.clientId)}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <UserIcon className="h-4 w-4 text-primary" />
                        <span className="shrink-0">Employé:</span>
                        <Select
                          value={res.assignedEmployeeId || "unassigned"}
                          onValueChange={(value) => handleAssignEmployee(res.id, value)}
                          disabled={assignEmployeeMutation.isPending}
                        >
                          <SelectTrigger className="h-7 w-[140px] text-xs" data-testid={`select-assign-employee-${res.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Non assigné</SelectItem>
                            {employees.map(emp => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {`${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateICS(res)}
                        data-testid={`button-download-ics-${res.id}`}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">ICS</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation("/admin/reservations")}
                        data-testid={`button-view-reservation-${res.id}`}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Voir</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span className="truncate">Détails de la réservation</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {selectedReservation && `ID: ${selectedReservation.id.slice(0, 8)}`}
            </DialogDescription>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={`${getStatusColor(selectedReservation.status)} text-white text-xs`}>
                  {getStatusLabel(selectedReservation.status)}
                </Badge>
              </div>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                  <span className="text-muted-foreground shrink-0">Début:</span>
                  <span className="font-medium break-words">
                    {formatLocalDateTime(selectedReservation.scheduledDate)}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                  <span className="text-muted-foreground shrink-0">Fin:</span>
                  <span className="font-medium break-words">
                    {selectedReservation.estimatedEndDate 
                      ? formatLocalDateTime(selectedReservation.estimatedEndDate)
                      : formatLocalDateTime(new Date(parseWithoutTimezoneShift(selectedReservation.scheduledDate).getTime() + getServiceDuration(selectedReservation.serviceId) * 60000))
                    }
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                  <span className="text-muted-foreground shrink-0">Service:</span>
                  <span className="font-medium break-words">{getServiceName(selectedReservation.serviceId)}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                  <span className="text-muted-foreground shrink-0">Client:</span>
                  <span className="font-medium break-words">{getClientName(selectedReservation.clientId)}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="text-muted-foreground shrink-0">Employé:</span>
                  <Select
                    value={selectedReservation.assignedEmployeeId || "unassigned"}
                    onValueChange={(value) => handleAssignEmployee(selectedReservation.id, value)}
                    disabled={assignEmployeeMutation.isPending}
                  >
                    <SelectTrigger className="h-8 w-full sm:w-[180px]" data-testid="select-modal-assign-employee">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Non assigné</SelectItem>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {`${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedReservation.productDetails && (
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground">Détails:</span>
                    <p className="mt-1 break-words">{selectedReservation.productDetails}</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-3 sm:pt-4">
                <Button
                  onClick={() => generateICS(selectedReservation)}
                  className="flex-1"
                  size="sm"
                  data-testid="button-modal-download-ics"
                >
                  <Download className="h-4 w-4 mr-2" />
                  <span className="text-xs sm:text-sm">Télécharger ICS</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedReservation(null);
                    setLocation("/admin/reservations");
                  }}
                  className="flex-1"
                  data-testid="button-modal-view-reservation"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  <span className="text-xs sm:text-sm">Voir prestation</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
