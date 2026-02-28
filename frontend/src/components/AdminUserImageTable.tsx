import { useState } from 'react';
import { useGetImages, useUploadImage } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, Download, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface FileUploadState {
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
}

export default function AdminUserImageTable() {
  const [userName, setUserName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileUploadState[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { data: images = [], isLoading } = useGetImages();
  const { mutateAsync: uploadImage } = useUploadImage();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles: FileUploadState[] = files.map((file) => ({
      file,
      status: 'idle',
      progress: 0,
    }));
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleBulkUpload = async () => {
    if (!userName.trim()) {
      toast.error('Please enter a user name');
      return;
    }
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const fileState = selectedFiles[i];

      setSelectedFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading' as UploadStatus } : f))
      );

      try {
        await uploadImage(fileState.file);

        setSelectedFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: 'success' as UploadStatus, progress: 100 } : f
          )
        );
        successCount++;
      } catch (error: any) {
        setSelectedFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: 'error' as UploadStatus, error: error.message } : f
          )
        );
        errorCount++;
      }
    }

    setIsUploading(false);

    if (errorCount === 0) {
      toast.success(`Successfully uploaded ${successCount} images`);
      setSelectedFiles([]);
      setUserName('');
    } else {
      toast.error(`Upload completed with ${errorCount} errors. ${successCount} succeeded.`);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleDownloadImage = async (imageId: string, imageBlob: any) => {
    try {
      const url = imageBlob.getDirectURL();
      const a = document.createElement('a');
      a.href = url;
      a.download = `image_${imageId}.jpg`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download image');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <Card className="border-2 border-blue-200/50 dark:border-blue-800/50 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Upload className="w-5 h-5 text-blue-500" />
            Upload Images
          </CardTitle>
          <CardDescription className="text-base">
            Upload rating images
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userName" className="text-sm font-semibold">User Name</Label>
            <Input
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter user name"
              disabled={isUploading}
              className="h-12 rounded-xl border-2 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="images" className="text-sm font-semibold">Select Images</Label>
            <input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={isUploading}
              className="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-primary/20 file:text-primary hover:file:bg-primary/30 cursor-pointer border border-white/20 rounded-lg p-2 bg-background/80"
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-white/10 bg-background/40">
                  <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-xs text-foreground flex-1 truncate">{f.file.name}</span>
                  {f.status === 'uploading' && (
                    <Progress value={f.progress} className="w-16 h-1.5" />
                  )}
                  {f.status === 'success' && (
                    <Badge variant="default" className="text-xs bg-green-500">Done</Badge>
                  )}
                  {f.status === 'error' && (
                    <Badge variant="destructive" className="text-xs">Error</Badge>
                  )}
                  {f.status === 'idle' && (
                    <button
                      onClick={() => handleRemoveFile(i)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleBulkUpload}
            disabled={selectedFiles.length === 0 || !userName.trim() || isUploading}
            className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white"
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Uploading...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload {selectedFiles.length > 0 ? `${selectedFiles.length} Image${selectedFiles.length !== 1 ? 's' : ''}` : 'Images'}
              </span>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Images Grid */}
      <Card className="border-2 border-blue-200/50 dark:border-blue-800/50 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ImageIcon className="w-5 h-5 text-blue-500" />
            Uploaded Images ({images.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <div className="text-center py-10">
              <ImageIcon className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No images uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {images.map((img) => (
                <div key={img.id} className="rounded-lg border border-white/10 overflow-hidden bg-background/40">
                  <img
                    src={img.image.getDirectURL()}
                    alt={img.userName}
                    className="w-full h-28 object-cover"
                  />
                  <div className="p-2 flex items-center justify-between gap-1">
                    <span className="text-xs font-medium text-foreground truncate flex-1">{img.userName}</span>
                    <button
                      onClick={() => handleDownloadImage(img.id, img.image)}
                      className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
