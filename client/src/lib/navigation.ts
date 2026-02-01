/**
 * Utilitaires de navigation avec contexte pour gérer les redirections
 * entre les pages de création de clients, devis et réservations
 */

export type RedirectionContext = {
  returnTo: "quote" | "reservation";
  timestamp: number;
};

const REDIRECTION_KEY = "myJantes_clientCreationRedirect";

/**
 * Initialise une redirection vers la page de création de client
 * @param context Le contexte de redirection (quote ou reservation)
 */
export function initiateClientCreationRedirect(
  returnTo: "quote" | "reservation"
): void {
  const context: RedirectionContext = {
    returnTo,
    timestamp: Date.now(),
  };
  localStorage.setItem(REDIRECTION_KEY, JSON.stringify(context));
}

/**
 * Récupère le contexte de redirection actuel
 * @returns Le contexte de redirection ou null si aucun
 */
export function getRedirectionContext(): RedirectionContext | null {
  const stored = localStorage.getItem(REDIRECTION_KEY);
  if (!stored) return null;

  try {
    const context = JSON.parse(stored) as RedirectionContext;
    // Expire après 1 heure
    if (Date.now() - context.timestamp > 60 * 60 * 1000) {
      clearRedirectionContext();
      return null;
    }
    return context;
  } catch {
    clearRedirectionContext();
    return null;
  }
}

/**
 * Nettoie le contexte de redirection
 */
export function clearRedirectionContext(): void {
  localStorage.removeItem(REDIRECTION_KEY);
}

/**
 * Effectue la redirection de retour après création du client
 * @param newClientId L'ID du client nouvellement créé
 * @returns L'URL de redirection ou null si aucun contexte
 */
export function performReturnRedirect(newClientId?: string): string | null {
  const context = getRedirectionContext();
  if (!context) return null;

  clearRedirectionContext();

  // Construire l'URL avec les paramètres
  const params = new URLSearchParams();
  params.set("openDialog", "true");
  if (newClientId) {
    params.set("clientId", newClientId);
  }

  if (context.returnTo === "quote") {
    return `/admin/quotes?${params.toString()}`;
  } else {
    return `/admin/reservations?${params.toString()}`;
  }
}
