import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Mic, Square, Loader2, Send, AlertTriangle, RefreshCw } from "lucide-react";

interface VoiceDictationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientEmail: string;
  clientName: string;
  prestations: string[];
  technicalDetails?: string;
  attachments?: string[];
  documentType: "quote" | "invoice";
  documentNumber: string;
  documentId: string;
  onEmailSent?: () => void;
  onEmailGenerated?: (emailContent: string) => void;
  mode?: "standalone" | "inline";
}

export function VoiceDictationDialog({
  open,
  onOpenChange,
  clientEmail,
  clientName,
  prestations,
  technicalDetails = "",
  attachments = [],
  documentType,
  documentNumber,
  documentId,
  onEmailSent,
  onEmailGenerated,
  mode = "standalone",
}: VoiceDictationDialogProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [hasEdited, setHasEdited] = useState(false);
  const [hasConfirmedReview, setHasConfirmedReview] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au microphone. Vérifiez les permissions.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const generateEmailMutation = useMutation({
    mutationFn: async () => {
      if (!audioBlob) throw new Error("Aucun enregistrement audio");

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('clientName', clientName);
      formData.append('prestations', JSON.stringify(prestations));
      formData.append('technicalDetails', technicalDetails);
      formData.append('attachments', JSON.stringify(attachments));
      formData.append('documentType', documentType);
      formData.append('documentNumber', documentNumber);

      const response = await fetch('/api/voice-dictation/generate-email', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la génération');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedEmail(data.email);
      setHasEdited(false);
      toast({
        title: "Email généré",
        description: "Veuillez vérifier et modifier le contenu avant envoi.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/voice-dictation/send-email", {
        to: clientEmail,
        subject: `MY JANTES - ${documentType === 'quote' ? 'Devis' : 'Facture'} ${documentNumber}`,
        body: generatedEmail,
        documentType,
        documentNumber,
        documentId,
        clientName,
      });
    },
    onSuccess: () => {
      toast({
        title: "Email envoyé",
        description: `L'email a été envoyé à ${clientEmail}`,
      });
      onEmailSent?.();
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur d'envoi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setAudioBlob(null);
    setGeneratedEmail("");
    setHasEdited(false);
    setHasConfirmedReview(false);
    setRecordingTime(0);
    if (isRecording) {
      stopRecording();
    }
    onOpenChange(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl w-[95vw] p-0 gap-0 overflow-hidden flex flex-col h-[90vh] sm:h-auto max-h-[90vh]">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            Dictée vocale - Récapitulatif client
          </DialogTitle>
          <DialogDescription>
            Dictez votre récapitulatif. L'IA générera un email professionnel basé uniquement sur les prestations cochées.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 py-4">
            {/* Services list (for reference) */}
            {prestations.length > 0 && (
              <div className="p-4 border rounded-lg bg-muted/20">
                <Label className="text-xs font-medium">Services disponibles (référence)</Label>
                <ScrollArea className="h-20 mt-1">
                  <ul className="text-[10px] text-muted-foreground list-disc list-inside space-y-0.5">
                    {prestations.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}

            {/* Recording section */}
            <div className="flex flex-col items-center gap-4 p-4 sm:p-6 border rounded-lg bg-muted/30">
              {!audioBlob ? (
                <>
                  <div className="text-3xl sm:text-4xl font-mono">
                    {formatTime(recordingTime)}
                  </div>
                  {isRecording ? (
                    <Button
                      variant="destructive"
                      size="lg"
                      onClick={stopRecording}
                      className="gap-2 w-full sm:w-auto"
                      data-testid="button-stop-recording"
                    >
                      <Square className="h-4 w-4" />
                      Arrêter
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={startRecording}
                      className="gap-2 w-full sm:w-auto"
                      data-testid="button-start-recording"
                    >
                      <Mic className="h-4 w-4" />
                      Commencer
                    </Button>
                  )}
                  {isRecording && (
                    <p className="text-xs sm:text-sm text-muted-foreground animate-pulse text-center">
                      Enregistrement en cours... (20-40s recommandés)
                    </p>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 w-full">
                  <p className="text-sm text-muted-foreground">
                    Enregistrement terminé ({formatTime(recordingTime)})
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAudioBlob(null);
                        setRecordingTime(0);
                      }}
                      className="gap-2 w-full sm:w-auto"
                      data-testid="button-new-recording"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Recommencer
                    </Button>
                    <Button
                      onClick={() => generateEmailMutation.mutate()}
                      disabled={generateEmailMutation.isPending}
                      className="gap-2 w-full sm:w-auto"
                      data-testid="button-generate-email"
                    >
                      {generateEmailMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                      Générer l'email
                    </Button>
                  </div>
                </div>
              )}
            </div>

          {/* Generated email */}
          {generatedEmail && (
            <div className="space-y-4">
                <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200 text-xs sm:text-sm">
                    Vérifiez le contenu avant envoi. Pas d'envoi automatique.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="email-content" className="text-sm">Contenu de l'email (modifiable)</Label>
                  <Textarea
                    id="email-content"
                    value={generatedEmail}
                    onChange={(e) => {
                      setGeneratedEmail(e.target.value);
                      setHasEdited(true);
                    }}
                    className="min-h-[200px] sm:min-h-[250px] font-mono text-sm resize-none"
                    data-testid="textarea-email-content"
                  />
                </div>

                <div className="text-sm bg-muted/50 p-3 rounded-md break-all">
                  <strong className="text-muted-foreground">Destinataire :</strong> {clientEmail}
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-lg bg-muted/30 mb-2">
                  <Checkbox
                    id="confirm-review"
                    checked={hasConfirmedReview}
                    onCheckedChange={(checked) => setHasConfirmedReview(checked === true)}
                    className="mt-1"
                    data-testid="checkbox-confirm-review"
                  />
                  <label
                    htmlFor="confirm-review"
                    className="text-sm font-medium leading-tight cursor-pointer"
                  >
                    J'ai vérifié le contenu de l'email et je confirme qu'il correspond aux prestations réalisées.
                  </label>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-2 flex flex-col sm:flex-row gap-2 border-t mt-auto">
          <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto" data-testid="button-cancel-dictation">
            Annuler
          </Button>
          {generatedEmail && mode === "inline" && (
            <Button
              onClick={() => {
                onEmailGenerated?.(generatedEmail);
                handleClose();
              }}
              disabled={!generatedEmail.trim()}
              className="gap-2 w-full sm:w-auto"
              data-testid="button-use-content"
            >
              Utiliser ce contenu
            </Button>
          )}
          {generatedEmail && mode === "standalone" && (
            <Button
              onClick={() => sendEmailMutation.mutate()}
              disabled={sendEmailMutation.isPending || !generatedEmail.trim() || !hasConfirmedReview}
              className="gap-2 w-full sm:w-auto"
              data-testid="button-send-email"
            >
              {sendEmailMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Envoyer l'email
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
