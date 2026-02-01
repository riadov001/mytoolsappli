import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NewClientFormProps {
  email: string;
  setEmail: (value: string) => void;
  firstName: string;
  setFirstName: (value: string) => void;
  lastName: string;
  setLastName: (value: string) => void;
  phone?: string;
  setPhone?: (value: string) => void;
  address?: string;
  setAddress?: (value: string) => void;
  postalCode?: string;
  setPostalCode?: (value: string) => void;
  city?: string;
  setCity?: (value: string) => void;
  role: "client" | "client_professionnel";
  setRole: (value: "client" | "client_professionnel") => void;
  companyName: string;
  setCompanyName: (value: string) => void;
  siret: string;
  setSiret: (value: string) => void;
  tvaNumber: string;
  setTvaNumber: (value: string) => void;
  companyAddress: string;
  setCompanyAddress: (value: string) => void;
}

export function NewClientForm({
  email,
  setEmail,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  phone = '',
  setPhone = () => {},
  address = '',
  setAddress = () => {},
  postalCode = '',
  setPostalCode = () => {},
  city = '',
  setCity = () => {},
  role,
  setRole,
  companyName,
  setCompanyName,
  siret,
  setSiret,
  tvaNumber,
  setTvaNumber,
  companyAddress,
  setCompanyAddress,
}: NewClientFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="client-email">Email *</Label>
        <Input
          id="client-email"
          type="email"
          placeholder="client@exemple.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          data-testid="input-client-email"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="client-firstname">Prénom *</Label>
          <Input
            id="client-firstname"
            placeholder="Jean"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            data-testid="input-client-firstname"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client-lastname">Nom *</Label>
          <Input
            id="client-lastname"
            placeholder="Dupont"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            data-testid="input-client-lastname"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="client-phone">Téléphone</Label>
        <Input
          id="client-phone"
          type="tel"
          placeholder="+33 6 12 34 56 78"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          data-testid="input-client-phone"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="client-address">Adresse personnelle</Label>
        <Input
          id="client-address"
          placeholder="123 rue de la Paix"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          data-testid="input-client-address"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="client-postalcode">Code postal</Label>
          <Input
            id="client-postalcode"
            placeholder="75001"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            data-testid="input-client-postalcode"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client-city">Ville</Label>
          <Input
            id="client-city"
            placeholder="Paris"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            data-testid="input-client-city"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="client-role">Type de client *</Label>
        <Select value={role} onValueChange={(value: "client" | "client_professionnel") => setRole(value)}>
          <SelectTrigger id="client-role" data-testid="select-client-role">
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
            <Label htmlFor="client-company">Nom de l'entreprise</Label>
            <Input
              id="client-company"
              placeholder="Mon Entreprise SARL"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              data-testid="input-client-company"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-siret">SIRET</Label>
              <Input
                id="client-siret"
                placeholder="123 456 789 00012"
                value={siret}
                onChange={(e) => setSiret(e.target.value)}
                data-testid="input-client-siret"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-tva">Numéro TVA</Label>
              <Input
                id="client-tva"
                placeholder="FR12345678901"
                value={tvaNumber}
                onChange={(e) => setTvaNumber(e.target.value)}
                data-testid="input-client-tva"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-address">Adresse de l'entreprise</Label>
            <Input
              id="client-address"
              placeholder="123 rue de la Paix, 75001 Paris"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              data-testid="input-client-address"
            />
          </div>
        </>
      )}
    </div>
  );
}
