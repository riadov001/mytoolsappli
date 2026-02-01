// Local Authentication with Email/Password
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const SALT_ROUNDS = 10;

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Local Strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          
          if (!user) {
            return done(null, false, { message: "Email ou mot de passe incorrect" });
          }

          if (!user.password) {
            return done(null, false, { message: "Compte non configuré pour l'authentification locale" });
          }

          const isValid = await verifyPassword(password, user.password);
          
          if (!isValid) {
            return done(null, false, { message: "Email ou mot de passe incorrect" });
          }

          return done(null, { id: user.id, email: user.email, role: user.role });
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, { id: user.id, email: user.email, role: user.role });
    } catch (error) {
      done(error);
    }
  });

  // Login route
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Erreur serveur" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentification échouée" });
      }
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Erreur de session" });
        }
        return res.json({ user });
      });
    })(req, res, next);
  });

  // Register route (public - pour créer des comptes clients uniquement)
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, role, companyName, siret, tvaNumber, companyAddress } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email et mot de passe requis" });
      }

      // Restreindre les rôles privilégiés - seuls les clients peuvent s'inscrire publiquement
      const allowedRoles = ["client", "client_professionnel"];
      const userRole = role && allowedRoles.includes(role) ? role : "client";

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Cet email est déjà utilisé" });
      }

      const hashedPassword = await hashPassword(password);
      
      const userData: any = {
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        role: userRole,
      };

      // Ajouter les champs entreprise si c'est un client professionnel
      if (userRole === "client_professionnel") {
        userData.companyName = companyName || null;
        userData.siret = siret || null;
        userData.tvaNumber = tvaNumber || null;
        userData.companyAddress = companyAddress || null;
      }
      
      const newUser = await storage.createUser(userData);

      res.json({ message: "Compte créé avec succès", userId: newUser.id });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Erreur lors de la création du compte" });
    }
  });

  // Logout route
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Erreur lors de la déconnexion" });
      }
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Erreur de session" });
        }
        res.clearCookie("connect.sid");
        res.json({ message: "Déconnexion réussie" });
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  next();
};

export const isAdmin: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Non authentifié" });
  }

  const user = req.user as any;
  if (!user || (user.role !== "admin" && user.role !== "employe")) {
    return res.status(403).json({ message: "Accès administrateur requis" });
  }

  next();
};
