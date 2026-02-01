import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Service } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Upload, X, Image, FileVideo, Camera, Send, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

interface UploadedFile {
  key: string;
  type: string;
  name: string;
  previewUrl?: string;
}

export default function Services() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [requestDetails, setRequestDetails] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "wire_transfer" | "card">("wire_transfer");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Non autorisé",
        description: "Vous êtes déconnecté. Reconnexion...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  useEffect(() => {
    return () => {
      uploadedFiles.forEach(file => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    };
  }, [uploadedFiles]);

  const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    enabled: isAuthenticated,
  });

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newFiles: UploadedFile[] = [];

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('media', file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || `Échec de l'upload (${response.status})`);
        }
        
        const result = await response.json();

        let previewUrl: string | undefined;
        if (file.type.startsWith('image/')) {
          previewUrl = URL.createObjectURL(file);
        }

        newFiles.push({
          key: result.objectPath,
          type: file.type,
          name: file.name,
          previewUrl,
        });
      }

      setUploadedFiles(prev => [...prev, ...newFiles]);

      toast({
        title: "Fichiers ajoutés",
        description: `${newFiles.length} fichier(s) téléchargé(s)`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erreur de téléchargement",
        description: error instanceof Error ? error.message : "Échec du téléchargement",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }, [toast]);

  const removeFile = (index: number) => {
    const fileToRemove = uploadedFiles[index];
    if (fileToRemove.previewUrl) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const requestQuoteMutation = useMutation({
    mutationFn: async (data: { 
      serviceId: string; 
      paymentMethod: "cash" | "wire_transfer" | "card"; 
      requestDetails: any;
      mediaFiles: UploadedFile[];
    }) => {
      return apiRequest("POST", "/api/quotes", data);
    },
    onSuccess: () => {
      toast({
        title: "Demande envoyée !",
        description: "Votre demande de devis a été envoyée avec succès. Nous vous recontacterons rapidement.",
      });
      setSelectedServiceId("");
      setRequestDetails("");
      setPaymentMethod("wire_transfer");
      setUploadedFiles([]);
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: error.message || "Échec de la soumission de la demande de devis",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    const imageCount = uploadedFiles.filter(f => f.type.startsWith('image/')).length;
    
    if (!selectedServiceId) {
      toast({
        title: "Service requis",
        description: "Veuillez sélectionner un service",
        variant: "destructive",
      });
      return;
    }
    
    if (imageCount < 3) {
      toast({
        title: "Photos requises",
        description: `Veuillez ajouter au moins 3 photos (${imageCount}/3)`,
        variant: "destructive",
      });
      return;
    }
    
    requestQuoteMutation.mutate({
      serviceId: selectedServiceId,
      paymentMethod,
      requestDetails: { message: requestDetails },
      mediaFiles: uploadedFiles.map(f => ({ key: f.key, type: f.type, name: f.name })),
    });
  };

  const imageCount = uploadedFiles.filter(f => f.type.startsWith('image/')).length;
  const videoCount = uploadedFiles.filter(f => f.type.startsWith('video/')).length;
  const isFormValid = selectedServiceId && imageCount >= 3;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl sm:text-2xl">Demander un Devis</CardTitle>
          <CardDescription>
            Sélectionnez un service et ajoutez des photos de vos jantes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="service" className="text-base font-medium">
              Service souhaité *
            </Label>
            {servicesLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                <SelectTrigger id="service" className="w-full" data-testid="select-service">
                  <SelectValue placeholder="Choisir un service..." />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      <div className="flex items-center gap-2">
                        <span>{service.name}</span>
                        {service.basePrice && (
                          <span className="text-muted-foreground text-sm">
                            - à partir de {service.basePrice}€
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment" className="text-base font-medium">
              Mode de paiement préféré
            </Label>
            <Select value={paymentMethod} onValueChange={(v: "cash" | "wire_transfer" | "card") => setPaymentMethod(v)}>
              <SelectTrigger id="payment" className="w-full" data-testid="select-payment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Espèces</SelectItem>
                <SelectItem value="wire_transfer">Virement bancaire</SelectItem>
                <SelectItem value="card">Carte bancaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Photos / Vidéos *
              </Label>
              <span className={`text-sm ${imageCount >= 3 ? 'text-green-600' : 'text-muted-foreground'}`}>
                {imageCount >= 3 ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    {imageCount} photo(s)
                  </span>
                ) : (
                  `${imageCount}/3 photos minimum`
                )}
              </span>
            </div>
            
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
              <Input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                id="file-upload"
                data-testid="input-file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <div className="p-3 bg-primary/10 rounded-full">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium">
                  {uploading ? "Téléchargement..." : "Cliquez pour ajouter des photos"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Photos de vos jantes (avant, après, détails)
                </span>
              </label>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2">
                  {uploadedFiles.filter(f => f.type.startsWith('image/')).map((file, idx) => {
                    const originalIndex = uploadedFiles.findIndex(f2 => f2.key === file.key);
                    return (
                      <div
                        key={file.key}
                        className="relative group aspect-square rounded-md overflow-hidden border border-border bg-muted"
                      >
                        {file.previewUrl ? (
                          <img
                            src={file.previewUrl}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(originalIndex)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`button-remove-file-${originalIndex}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                {videoCount > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {uploadedFiles.filter(f => f.type.startsWith('video/')).map((file) => {
                      const originalIndex = uploadedFiles.findIndex(f2 => f2.key === file.key);
                      return (
                        <div
                          key={file.key}
                          className="flex items-center gap-2 px-2 py-1 rounded-md border border-border bg-muted text-sm"
                        >
                          <FileVideo className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-32">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(originalIndex)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="details" className="text-base font-medium">
              Détails supplémentaires
            </Label>
            <Textarea
              id="details"
              placeholder="Décrivez l'état de vos jantes, les réparations souhaitées, etc."
              value={requestDetails}
              onChange={(e) => setRequestDetails(e.target.value)}
              rows={4}
              data-testid="textarea-details"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || requestQuoteMutation.isPending}
            className="w-full"
            size="lg"
            data-testid="button-submit-quote"
          >
            {requestQuoteMutation.isPending ? (
              "Envoi en cours..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer ma demande
              </>
            )}
          </Button>

          {!isFormValid && (
            <p className="text-sm text-center text-muted-foreground">
              {!selectedServiceId && "Sélectionnez un service"}
              {selectedServiceId && imageCount < 3 && ` • Ajoutez ${3 - imageCount} photo(s) supplémentaire(s)`}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
