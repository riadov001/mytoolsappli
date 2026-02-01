import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Mail, Plus, X, Mic } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VoiceDictationDialog } from "./voice-dictation-dialog";

interface SendEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (params: EmailParams) => void;
  isPending: boolean;
  defaultRecipient: string;
  defaultSubject: string;
  defaultMessage: string;
  type: "quote" | "invoice";
  documentNumber: string;
  amount: string;
  clientId?: string;
  clientName?: string;
  prestations?: string[];
  technicalDetails?: string;
  documentId?: string;
}

export interface EmailParams {
  recipient: string;
  subject: string;
  message: string;
  additionalRecipients: string[];
  sendCopy: boolean;
}

export function SendEmailDialog({
  open,
  onOpenChange,
  onSend,
  isPending,
  defaultRecipient,
  defaultSubject,
  defaultMessage,
  type,
  documentNumber,
  amount,
  clientId,
  clientName,
  prestations = [],
  technicalDetails = "",
  documentId = "",
}: SendEmailDialogProps) {
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultMessage);
  const [additionalRecipients, setAdditionalRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState("");
  const [sendCopy, setSendCopy] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [showVoiceDictation, setShowVoiceDictation] = useState(false);

  useEffect(() => {
    if (open) {
      setRecipient(defaultRecipient);
      setSubject(defaultSubject);
      setMessage(defaultMessage);
      setAdditionalRecipients([]);
      setNewRecipient("");
      setSendCopy(false);
      setSaveAsDefault(false);
    }
  }, [open, defaultRecipient, defaultSubject, defaultMessage]);

  const handleAddRecipient = () => {
    const email = newRecipient.trim();
    if (email && email.includes("@") && !additionalRecipients.includes(email)) {
      setAdditionalRecipients([...additionalRecipients, email]);
      setNewRecipient("");
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setAdditionalRecipients(additionalRecipients.filter((r) => r !== email));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddRecipient();
    }
  };

  const handleSend = () => {
    onSend({
      recipient,
      subject,
      message,
      additionalRecipients,
      sendCopy,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Envoyer un {type === "quote" ? "devis" : "facture"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1">
          <div className="space-y-2">
            <Label htmlFor="recipient">Destinataire</Label>
            <Input
              id="recipient"
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="email@exemple.com"
              data-testid="input-email-recipient"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional-recipients">Autres destinataires</Label>
            <div className="flex gap-2">
              <Input
                id="additional-recipients"
                type="email"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ajouter un destinataire..."
                data-testid="input-additional-recipient"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={handleAddRecipient}
                disabled={!newRecipient.trim()}
                data-testid="button-add-recipient"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {additionalRecipients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {additionalRecipients.map((email) => (
                  <Badge
                    key={email}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => handleRemoveRecipient(email)}
                      className="ml-1 hover:text-destructive"
                      data-testid={`button-remove-recipient-${email}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Sujet</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Sujet de l'email"
              data-testid="input-email-subject"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="message">Message au destinataire</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-2"
                onClick={() => setShowVoiceDictation(true)}
                data-testid="button-voice-dictation-email"
              >
                <Mic className="h-4 w-4" />
                Dicter
              </Button>
            </div>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Votre message..."
              rows={6}
              className="resize-none"
              data-testid="input-email-message"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="save-default" className="cursor-pointer">
              Enregistrer comme message par défaut
            </Label>
            <Switch
              id="save-default"
              checked={saveAsDefault}
              onCheckedChange={setSaveAsDefault}
              data-testid="switch-save-default"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="send-copy" className="cursor-pointer">
              M'envoyer une copie
            </Label>
            <Switch
              id="send-copy"
              checked={sendCopy}
              onCheckedChange={setSendCopy}
              data-testid="switch-send-copy"
            />
          </div>
        </div>

        <VoiceDictationDialog
          open={showVoiceDictation}
          onOpenChange={setShowVoiceDictation}
          clientEmail={recipient}
          clientName={clientName || "Client"}
          prestations={prestations}
          technicalDetails={technicalDetails}
          attachments={[type === "quote" ? "Devis PDF" : "Facture PDF"]}
          documentType={type}
          documentNumber={documentNumber}
          documentId={documentId}
          onEmailSent={() => onOpenChange(false)}
          mode="inline"
          onEmailGenerated={(content) => setMessage(content)}
        />

        <DialogFooter className="flex-shrink-0 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            data-testid="button-cancel-email"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSend}
            disabled={isPending || !recipient.trim()}
            data-testid="button-send-email"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Envoi...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Envoyer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
