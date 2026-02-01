import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, UserPlus } from "lucide-react";

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated: (clientId: string, clientName: string) => void;
}

export function CreateClientDialog({ open, onOpenChange, onClientCreated }: CreateClientDialogProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState<"client" | "client_professionnel">("client");
  const [companyName, setCompanyName] = useState("");
  const [siret, setSiret] = useState("");
  const [tvaNumber, setTvaNumber] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");

  const resetForm = () => {
    setEmail("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setAddress("");
    setPostalCode("");
    setCity("");
    setRole("client");
    setCompanyName("");
    setSiret("");
    setTvaNumber("");
    setCompanyAddress("");
  };

  const createClientMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/users", {
        email,
        password: "123user",
        firstName,
        lastName,
        phone: phone || undefined,
        address: address || undefined,
        postalCode: postalCode || undefined,
        city: city || undefined,
        role,
        companyName: role === "client_professionnel" ? companyName : undefined,
        siret: role === "client_professionnel" ? siret : undefined,
        tvaNumber: role === "client_professionnel" ? tvaNumber : undefined,
        companyAddress: role === "client_professionnel" ? companyAddress : undefined,
      });
      return response;
    },
    onSuccess: async (data: any) => {
      toast({
        title: "Client créé",
        description: `Le client ${firstName} ${lastName} a été créé avec succès.`,
      });
      const clientName = `${firstName} ${lastName}`;
      await queryClient.refetchQueries({ queryKey: ["/api/admin/users"] });
      resetForm();
      onOpenChange(false);
      onClientCreated(data.id, clientName);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec de la création du client",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!email || !firstName || !lastName) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir l'email, le prénom et le nom",
        variant: "destructive",
      });
      return;
    }
    createClientMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Créer un Nouveau Client
          </DialogTitle>
          <DialogDescription>
            Remplissez les informations du client. Il sera automatiquement sélectionné après création.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 overflow-y-auto pr-2 flex-1">
          <div className="space-y-2">
            <Label htmlFor="dialog-client-email">Email *</Label>
            <Input
              id="dialog-client-email"
              type="email"
              placeholder="client@exemple.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="dialog-input-client-email"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dialog-client-firstname">Prénom *</Label>
              <Input
                id="dialog-client-firstname"
                placeholder="Jean"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                data-testid="dialog-input-client-firstname"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-client-lastname">Nom *</Label>
              <Input
                id="dialog-client-lastname"
                placeholder="Dupont"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                data-testid="dialog-input-client-lastname"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-client-phone">Téléphone</Label>
            <Input
              id="dialog-client-phone"
              type="tel"
              placeholder="+33 6 12 34 56 78"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              data-testid="dialog-input-client-phone"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-client-address">Adresse personnelle</Label>
            <Input
              id="dialog-client-address"
              placeholder="123 rue de la Paix"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              data-testid="dialog-input-client-address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dialog-client-postalcode">Code postal</Label>
              <Input
                id="dialog-client-postalcode"
                placeholder="75001"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                data-testid="dialog-input-client-postalcode"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-client-city">Ville</Label>
              <Input
                id="dialog-client-city"
                placeholder="Paris"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                data-testid="dialog-input-client-city"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-client-role">Type de client *</Label>
            <Select value={role} onValueChange={(value: "client" | "client_professionnel") => setRole(value)}>
              <SelectTrigger id="dialog-client-role" data-testid="dialog-select-client-role">
                <SelectValue placeholder="Sélectionner le type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client particulier</SelectItem>
                <SelectItem value="client_professionnel">Client professionnel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {role === "client_professionnel" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="dialog-client-company">Nom de l'entreprise</Label>
                <Input
                  id="dialog-client-company"
                  placeholder="Mon Entreprise SARL"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  data-testid="dialog-input-client-company"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dialog-client-siret">SIRET</Label>
                  <Input
                    id="dialog-client-siret"
                    placeholder="123 456 789 00012"
                    value={siret}
                    onChange={(e) => setSiret(e.target.value)}
                    data-testid="dialog-input-client-siret"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dialog-client-tva">Numéro TVA</Label>
                  <Input
                    id="dialog-client-tva"
                    placeholder="FR12345678901"
                    value={tvaNumber}
                    onChange={(e) => setTvaNumber(e.target.value)}
                    data-testid="dialog-input-client-tva"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dialog-client-company-address">Adresse de l'entreprise</Label>
                <Input
                  id="dialog-client-company-address"
                  placeholder="123 rue de la Paix, 75001 Paris"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  data-testid="dialog-input-client-company-address"
                />
              </div>
            </>
          )}

          <p className="text-xs text-muted-foreground">
            Mot de passe par défaut: <span className="font-mono font-semibold">123user</span> (à changer lors de la première connexion)
          </p>
        </div>

        <DialogFooter className="shrink-0 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="dialog-button-cancel-client">
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createClientMutation.isPending}
            data-testid="dialog-button-create-client"
          >
            {createClientMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Créer le client
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
