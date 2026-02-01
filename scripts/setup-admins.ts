// Script pour configurer les comptes administrateurs
import { hashPassword } from "../server/localAuth";
import { storage } from "../server/storage";

async function setupAdminAccounts() {
  try {
    // Hasher le mot de passe
    const hashedPassword = await hashPassword("admin123");

    // 1. Mettre à jour admin@myjantes.fr avec le mot de passe
    const adminMyJantes = await storage.getUserByEmail("admin@myjantes.fr");
    
    if (adminMyJantes) {
      await storage.updateUser(adminMyJantes.id, {
        password: hashedPassword,
      });
      console.log("✓ Mot de passe défini pour admin@myjantes.fr");
      console.log("  Email: admin@myjantes.fr");
      console.log("  Mot de passe: admin123");
    } else {
      console.log("✗ admin@myjantes.fr n'existe pas");
    }

    // 2. Créer ou mettre à jour administrateur@myjantes.fr
    const existingAdmin = await storage.getUserByEmail("administrateur@myjantes.fr");
    
    if (existingAdmin) {
      await storage.updateUser(existingAdmin.id, {
        role: "admin",
        password: hashedPassword,
      });
      console.log("\n✓ Droits admin attribués à administrateur@myjantes.fr");
    } else {
      await storage.createUser({
        email: "administrateur@myjantes.fr",
        password: hashedPassword,
        firstName: "Administrateur",
        lastName: "MyJantes",
        role: "admin",
      });
      console.log("\n✓ Compte administrateur@myjantes.fr créé avec les droits admin");
    }
    
    console.log("  Email: administrateur@myjantes.fr");
    console.log("  Mot de passe: admin123");

  } catch (error) {
    console.error("✗ Erreur lors de la configuration des comptes admin:", error);
    process.exit(1);
  }
}

setupAdminAccounts().then(() => {
  console.log("\n✓ Configuration terminée");
  process.exit(0);
});
