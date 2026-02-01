// Seed script for MyJantes services and workflows
import { db } from "./db";
import { services, workflows, workflowSteps } from "@shared/schema";
import { eq } from "drizzle-orm";

interface ServiceData {
  name: string;
  description: string;
  basePrice: string;
  estimatedDuration?: number;
  steps: string[];
}

const servicesData: ServiceData[] = [
  {
    name: "Réparation de jantes",
    description: "Service complet de réparation de jantes endommagées",
    basePrice: "80.00",
    estimatedDuration: 180,
    steps: [
      "Réception du véhicule / jante",
      "Diagnostic visuel et technique",
      "Démontage du pneu",
      "Redressage / débosselage",
      "Soudure (si fissure)",
      "Ponçage et mise à niveau",
      "Préparation peinture / apprêt",
      "Peinture ou poudre epoxy",
      "Cuisson / séchage",
      "Remontage du pneu",
      "Équilibrage",
      "Contrôle qualité final",
      "Livraison au client"
    ]
  },
  {
    name: "Peinture jantes",
    description: "Peinture complète de jantes avec finition professionnelle",
    basePrice: "70.00",
    estimatedDuration: 150,
    steps: [
      "Réception et inspection",
      "Démontage du pneu",
      "Décapage complet",
      "Sablage / microbillage",
      "Préparation et apprêt",
      "Application couleur / couches",
      "Application vernis",
      "Cuisson / séchage",
      "Contrôle qualité couleur/vernis",
      "Remontage + équilibrage",
      "Livraison"
    ]
  },
  {
    name: "Personnalisation",
    description: "Personnalisation sur mesure de vos jantes selon vos envies",
    basePrice: "120.00",
    estimatedDuration: 240,
    steps: [
      "Brief client / choix du design",
      "Création du modèle numérique (mockup)",
      "Validation client du design",
      "Démontage / nettoyage",
      "Décapage complet",
      "Masquage précis (zones à protéger)",
      "Peinture base",
      "Peinture secondaire / motifs",
      "Finition et vernis",
      "Séchage / cuisson",
      "Contrôle qualité esthétique",
      "Livraison"
    ]
  },
  {
    name: "Débosselage / redressage",
    description: "Redressage de jantes voilées ou déformées",
    basePrice: "60.00",
    estimatedDuration: 90,
    steps: [
      "Inspection et diagnostic",
      "Mesure du voile / déformation",
      "Montage sur machine de redressage",
      "Redressage progressif",
      "Contrôle du voile",
      "Ponçage léger si nécessaire",
      "Contrôle final",
      "Livraison"
    ]
  },
  {
    name: "Dévoilage / équilibrage",
    description: "Correction du voile et équilibrage dynamique",
    basePrice: "50.00",
    estimatedDuration: 60,
    steps: [
      "Diagnostic de vibrations / test",
      "Mesure du voile",
      "Ajustement / dévoilage",
      "Équilibrage dynamique",
      "Contrôle final",
      "Restitution"
    ]
  },
  {
    name: "Nettoyage / polissage / rénovation esthétique",
    description: "Rénovation esthétique complète de vos jantes",
    basePrice: "40.00",
    estimatedDuration: 60,
    steps: [
      "Nettoyage chimique",
      "Décontamination",
      "Polissage mécanique",
      "Traitement / protection",
      "Contrôle brillance",
      "Livraison"
    ]
  }
];

export async function seedServicesAndWorkflows() {
  console.log("Starting services and workflows seeding...");

  for (const serviceData of servicesData) {
    // Check if service already exists
    const existingServices = await db.select().from(services)
      .where(eq(services.name, serviceData.name));
    
    let serviceId: string;
    
    if (existingServices.length > 0) {
      serviceId = existingServices[0].id;
      console.log(`Service "${serviceData.name}" already exists, updating...`);
      
      // Update existing service
      await db.update(services)
        .set({
          description: serviceData.description,
          basePrice: serviceData.basePrice,
          estimatedDuration: serviceData.estimatedDuration,
          isActive: true,
          updatedAt: new Date()
        })
        .where(eq(services.id, serviceId));
    } else {
      // Create new service
      const [newService] = await db.insert(services).values({
        name: serviceData.name,
        description: serviceData.description,
        basePrice: serviceData.basePrice,
        estimatedDuration: serviceData.estimatedDuration,
        isActive: true,
        category: "jantes"
      }).returning();
      
      serviceId = newService.id;
      console.log(`Created service: ${serviceData.name}`);
    }

    // Check if workflow already exists for this service
    const existingWorkflows = await db.select().from(workflows)
      .where(eq(workflows.serviceId, serviceId));
    
    let workflowId: string;
    
    if (existingWorkflows.length > 0) {
      workflowId = existingWorkflows[0].id;
      console.log(`Workflow for "${serviceData.name}" already exists, updating steps...`);
      
      // Delete existing steps
      await db.delete(workflowSteps).where(eq(workflowSteps.workflowId, workflowId));
    } else {
      // Create workflow
      const [newWorkflow] = await db.insert(workflows).values({
        serviceId: serviceId,
        name: `Workflow - ${serviceData.name}`,
        description: `Étapes de travail pour ${serviceData.name}`
      }).returning();
      
      workflowId = newWorkflow.id;
      console.log(`Created workflow for: ${serviceData.name}`);
    }

    // Create workflow steps
    for (let i = 0; i < serviceData.steps.length; i++) {
      await db.insert(workflowSteps).values({
        workflowId: workflowId,
        stepNumber: i + 1,
        title: serviceData.steps[i],
        description: serviceData.steps[i]
      });
    }
    
    console.log(`Created ${serviceData.steps.length} steps for: ${serviceData.name}`);
  }

  console.log("Services and workflows seeding completed!");
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedServicesAndWorkflows()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seeding failed:", err);
      process.exit(1);
    });
}
