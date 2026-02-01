import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import QRCode from "qrcode";
import type { Invoice, Quote } from "@shared/schema";

interface LabelsPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentNumber: string;
  onDownload: () => void;
  type: 'invoice' | 'quote';
}

interface LabelData {
  position: string;
  name: string;
  qrCodeDataUrl: string;
}

export function LabelsPreview({ open, onOpenChange, documentNumber, onDownload, type }: LabelsPreviewProps) {
  const [labels, setLabels] = useState<LabelData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const labelDefinitions = [
    { position: 'AVG', name: 'AVANT GAUCHE' },
    { position: 'AVD', name: 'AVANT DROITE' },
    { position: 'ARG', name: 'ARRIÈRE GAUCHE' },
    { position: 'ARD', name: 'ARRIÈRE DROITE' },
    { position: 'CLÉ', name: 'CLÉ VÉHICULE' }
  ];

  useEffect(() => {
    if (open && documentNumber) {
      generateQRCodes();
    }
  }, [open, documentNumber]);

  const generateQRCodes = async () => {
    setIsGenerating(true);
    try {
      const generatedLabels = await Promise.all(
        labelDefinitions.map(async (label) => {
          const qrData = `${documentNumber}-${label.position}`;
          const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
            width: 200,
            margin: 1,
          });
          return {
            ...label,
            qrCodeDataUrl,
          };
        })
      );
      setLabels(generatedLabels);
    } catch (error) {
      console.error("Error generating QR codes:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aperçu des Étiquettes</DialogTitle>
          <DialogDescription>
            5 étiquettes avec QR codes pour identifier les jantes et la clé du véhicule
          </DialogDescription>
        </DialogHeader>

        {isGenerating ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Génération des QR codes...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {labels.map((label, index) => (
              <div
                key={index}
                className="border-2 border-border rounded-lg p-4 flex items-center gap-4 hover-elevate"
                data-testid={`label-preview-${label.position}`}
              >
                <div className="flex-shrink-0">
                  <img
                    src={label.qrCodeDataUrl}
                    alt={`QR Code ${label.position}`}
                    className="w-24 h-24"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold text-primary mb-1">{label.position}</p>
                  <p className="text-sm font-medium text-muted-foreground mb-2">{label.name}</p>
                  <p className="text-xs font-mono text-muted-foreground">{documentNumber}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-labels-preview"
          >
            Annuler
          </Button>
          <Button
            onClick={() => {
              onDownload();
              onOpenChange(false);
            }}
            disabled={isGenerating}
            data-testid="button-download-labels"
          >
            <Download className="h-4 w-4 mr-2" />
            Télécharger PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
