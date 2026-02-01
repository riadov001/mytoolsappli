import { useState, useCallback, useRef, useId } from "react";
import { Upload, X, FileVideo, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UploadedFile {
  key: string;
  type: string;
  name: string;
  previewUrl?: string;
}

interface ObjectUploaderProps {
  onUploadComplete: (files: UploadedFile[]) => void;
  accept?: Record<string, string[]>;
  "data-testid"?: string;
  label?: string;
  showPreview?: boolean;
}

export function ObjectUploader({
  onUploadComplete,
  accept = { 'image/*': [], 'video/*': [] },
  "data-testid": testId,
  label,
  showPreview = true,
}: ObjectUploaderProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      const allFiles = [...uploadedFiles, ...newFiles];
      setUploadedFiles(allFiles);
      onUploadComplete(allFiles);

      toast({
        title: "Succès",
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
  }, [uploadedFiles, onUploadComplete, toast]);

  const removeFile = (index: number) => {
    const fileToRemove = uploadedFiles[index];
    if (fileToRemove.previewUrl) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    onUploadComplete(newFiles);
  };

  const acceptString = Object.keys(accept).join(',');
  const imageFiles = uploadedFiles.filter(f => f.type.startsWith('image/'));
  const videoFiles = uploadedFiles.filter(f => f.type.startsWith('video/'));

  return (
    <div className="space-y-3">
      {label && (
        <Label className="flex items-center gap-2 text-base font-semibold">
          <Image className="h-4 w-4" />
          {label}
        </Label>
      )}
      
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          type="file"
          id={inputId}
          accept={acceptString}
          multiple
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
          data-testid={testId}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full"
          data-testid="button-select-files"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Téléchargement..." : "Ajouter des photos"}
        </Button>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {imageFiles.length} image(s){videoFiles.length > 0 && `, ${videoFiles.length} vidéo(s)`}
          </p>
          
          {showPreview && imageFiles.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {imageFiles.map((file, index) => {
                const originalIndex = uploadedFiles.findIndex(f => f.key === file.key);
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
                      <img
                        src={file.key.startsWith('/uploads/') ? file.key : `/uploads/${file.key}`}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(originalIndex)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`button-remove-file-${originalIndex}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1 py-0.5 truncate">
                      {file.name}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {videoFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {videoFiles.map((file) => {
                const originalIndex = uploadedFiles.findIndex(f => f.key === file.key);
                return (
                  <div
                    key={file.key}
                    className="flex items-center gap-2 px-2 py-1 rounded-md border border-border bg-muted text-sm"
                  >
                    <FileVideo className="h-4 w-4 text-muted-foreground" />
                    <span className="max-w-[150px] truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(originalIndex)}
                      className="p-0.5 rounded-full hover:bg-destructive hover:text-destructive-foreground"
                      data-testid={`button-remove-video-${originalIndex}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
