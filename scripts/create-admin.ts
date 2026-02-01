// Script pour créer le compte administrateur initial
import { hashPassword } from "../server/localAuth";
import { storage } from "../server/storage";

async function createAdminAccount() {
  try {
    // Vérifier si le compte existe déjà
    const existingUser = await storage.getUserByEmail("admin@myjantes.fr");
    
    if (existingUser) {
      console.log("✓ Le compte admin@myjantes.fr existe déjà");
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword("admin123");

    // Créer le compte admin
    const admin = await storage.createUser({
      email: "admin@myjantes.fr",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "MyJantes",
      role: "admin",
    });

    console.log("✓ Compte administrateur créé avec succès");
    console.log("  Email: admin@myjantes.fr");
    console.log("  Mot de passe: admin123");
    console.log("  ID:", admin.id);
  } catch (error) {
    console.error("✗ Erreur lors de la création du compte admin:", error);
    process.exit(1);
  }
}

createAdminAccount().then(() => {
  console.log("\n✓ Script terminé");
  process.exit(0);
});
