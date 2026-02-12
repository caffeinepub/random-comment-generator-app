import { useState } from 'react';
import { useGetAllUserRatingImages, useUploadRatingImage, useRemoveRatingImage } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Upload, Download, Trash2, Image as ImageIcon, User } from 'lucide-react';
import { ExternalBlob } from '../backend';
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

  const { data: userImages = [], isLoading } = useGetAllUserRatingImages();
  const { mutateAsync: uploadImage } = useUploadRatingImage();
  const { mutate: removeImage } = useRemoveRatingImage();

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
      
      // Update status to uploading
      setSelectedFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading' as UploadStatus } : f))
      );

      try {
        const arrayBuffer = await fileState.file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setSelectedFiles((prev) =>
            prev.map((f, idx) => (idx === i ? { ...f, progress: percentage } : f))
          );
        });

        await uploadImage({ userName: userName.trim(), image: blob });

        // Update status to success
        setSelectedFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: 'success' as UploadStatus, progress: 100 } : f))
        );
        successCount++;
      } catch (error: any) {
        // Update status to error
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
      // Full success - clear everything
      toast.success(`Successfully uploaded ${successCount} images`);
      setSelectedFiles([]);
      setUserName('');
    } else {
      // Partial or full failure - keep files for retry
      toast.error(`Upload completed with ${errorCount} errors. ${successCount} succeeded.`);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleDownloadUserImages = async (userName: string, images: any[]) => {
    for (const image of images) {
      try {
        const bytes = await image.image.getBytes();
        const blob = new Blob([bytes], { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${userName}_${image.id}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Download error:', error);
        toast.error(`Failed to download image ${image.id}`);
      }
    }
    toast.success(`Downloaded ${images.length} images for ${userName}`);
  };

  const handleRemoveImage = (userName: string, imageId: string) => {
    removeImage({ userName, imageId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-transparent border-t-[oklch(var(--gradient-start))] rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="card-glow border-2 border-[oklch(var(--gradient-start)/0.2)] rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Upload className="w-5 h-5 text-[oklch(var(--gradient-start))]" />
            Upload Images
          </CardTitle>
          <CardDescription className="text-base">
            Upload images for a specific user
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
            <Input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={isUploading || !userName.trim()}
              className="h-12 rounded-xl border-2 text-base cursor-pointer"
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Selected Files ({selectedFiles.length})</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFiles([])}
                  disabled={isUploading}
                  className="h-8 rounded-lg"
                >
                  Clear All
                </Button>
              </div>
              <ScrollArea className="h-[200px] rounded-xl border-2 border-[oklch(var(--gradient-start)/0.2)] p-3">
                <div className="space-y-2">
                  {selectedFiles.map((fileState, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border-2 bg-accent/10 border-[oklch(var(--gradient-start)/0.2)]"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-sm font-medium truncate flex-1">{fileState.file.name}</p>
                        <Badge
                          variant={
                            fileState.status === 'success'
                              ? 'default'
                              : fileState.status === 'error'
                              ? 'destructive'
                              : 'outline'
                          }
                          className="text-xs"
                        >
                          {fileState.status}
                        </Badge>
                        {fileState.status === 'idle' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFile(idx)}
                            className="h-6 w-6"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      {fileState.status === 'uploading' && (
                        <Progress value={fileState.progress} className="h-2" />
                      )}
                      {fileState.status === 'error' && fileState.error && (
                        <p className="text-xs text-destructive mt-1">{fileState.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <Button
            onClick={handleBulkUpload}
            disabled={!userName.trim() || selectedFiles.length === 0 || isUploading}
            className="w-full h-12 rounded-xl gradient-bg btn-glow font-bold text-base"
          >
            {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} Images`}
          </Button>
        </CardContent>
      </Card>

      <Card className="card-glow border-2 border-[oklch(var(--gradient-mid)/0.2)] rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ImageIcon className="w-5 h-5 text-[oklch(var(--gradient-mid))]" />
            User Images
          </CardTitle>
          <CardDescription className="text-base">
            Manage images grouped by user
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userImages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No images uploaded yet</p>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {userImages.map(([userName, images]) => (
                  <div
                    key={userName}
                    className="p-5 rounded-xl border-2 bg-gradient-to-br from-accent/20 to-accent/5 border-[oklch(var(--gradient-start)/0.2)] hover:border-[oklch(var(--gradient-start)/0.4)] transition-all"
                  >
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-lg font-bold">{userName}</p>
                          <p className="text-sm text-muted-foreground">{images.length} images</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadUserImages(userName, images)}
                        className="h-9 rounded-lg border-2 font-semibold"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download All
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {images.map((image: any) => (
                        <div
                          key={image.id}
                          className="relative group rounded-lg overflow-hidden border-2 border-[oklch(var(--gradient-start)/0.2)] bg-accent/10"
                        >
                          <img
                            src={image.image.getDirectURL()}
                            alt={`${userName} - ${image.id}`}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="h-10 w-10 rounded-lg"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-2xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Image?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete this image. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemoveImage(userName, image.id)}
                                    className="rounded-xl bg-destructive hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
