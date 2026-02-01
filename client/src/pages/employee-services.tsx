import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Clock, Wrench, CheckCircle2 } from "lucide-react";
import type { Service, Workflow, WorkflowStep } from "@shared/schema";

interface ServiceWithWorkflow extends Service {
  workflow: (Workflow & { steps: WorkflowStep[] }) | null;
}

export default function EmployeeServices() {
  const { data: services = [], isLoading } = useQuery<ServiceWithWorkflow[]>({
    queryKey: ["/api/services-with-workflows"],
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold">Catalogue des Services</h1>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Catalogue des Services</h1>
        <p className="text-muted-foreground mt-1">
          Consultez les services disponibles et leurs étapes de travail
        </p>
      </div>

      <div className="grid gap-4">
        {services.map((service) => (
          <Card key={service.id} data-testid={`card-service-${service.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Wrench className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    {service.description && (
                      <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {service.basePrice && (
                    <Badge variant="secondary" className="text-sm">
                      {parseFloat(service.basePrice).toFixed(2)} €
                    </Badge>
                  )}
                  {service.estimatedDuration && (
                    <Badge variant="outline" className="text-sm">
                      <Clock className="h-3 w-3 mr-1" />
                      {service.estimatedDuration} min
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {service.workflow && service.workflow.steps.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="steps" className="border-none">
                    <AccordionTrigger 
                      className="py-2 hover:no-underline"
                      data-testid={`accordion-steps-${service.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {service.workflow.steps.length} étapes de travail
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {service.workflow.steps
                          .sort((a, b) => a.stepNumber - b.stepNumber)
                          .map((step, index) => (
                          <div
                            key={step.id}
                            className="flex items-start gap-3 p-3 bg-muted/50 rounded-md"
                            data-testid={`step-item-${step.id}`}
                          >
                            <Badge variant="outline" className="flex-shrink-0 min-w-[28px] justify-center">
                              {step.stepNumber}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{step.title}</p>
                              {step.description && step.description !== step.title && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {step.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  Aucun workflow défini pour ce service
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Aucun service disponible pour le moment
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
