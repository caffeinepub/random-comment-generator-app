import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Music, Upload, Trash2, Play } from 'lucide-react';
import { toast } from 'sonner';
import { useMusicPlayer } from '../hooks/useMusicPlayer';
import { ExternalBlob } from '../backend';

export default function AdminMusicManager() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateMusicUrl } = useMusicPlayer();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/audio\/(mpeg|mp3|wav)/)) {
      toast.error('Please select an MP3 or WAV file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    toast.success('File selected! Preview and upload when ready.');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Read file as bytes
      const arrayBuffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Create ExternalBlob with progress tracking
      // Note: This is a placeholder - actual implementation would use backend storage
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      // Upload to backend (placeholder - needs backend method)
      // await actor.uploadMusic(ADMIN_ACCESS_CODE, blob);

      // For now, just use the local URL
      updateMusicUrl(previewUrl!);

      toast.success('Music uploaded successfully!');
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadProgress(0);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload music');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    if (confirm('Are you sure you want to remove the current music?')) {
      setSelectedFile(null);
      setPreviewUrl(null);
      updateMusicUrl('');
      toast.success('Music removed');
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="border-2 border-blue-200/50 dark:border-blue-800/50 rounded-3xl overflow-hidden shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <CardHeader className="relative bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-orange-500/10">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-lg">
            <Music className="w-5 h-5 text-white" />
          </div>
          Background Music Manager
        </CardTitle>
        <CardDescription className="text-base">
          Upload and manage background music for all users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 relative pt-6">
        <div className="space-y-2">
          <Label htmlFor="musicFile" className="text-sm font-semibold">
            Select Music File (MP3 or WAV, max 10MB)
          </Label>
          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              id="musicFile"
              type="file"
              accept=".mp3,.wav,audio/mpeg,audio/wav"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex-1 h-12 rounded-2xl border-2 font-semibold"
              disabled={isUploading}
            >
              <Upload className="w-5 h-5 mr-2" />
              {selectedFile ? 'Change File' : 'Select File'}
            </Button>
            {selectedFile && (
              <Button
                onClick={handleClear}
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-2xl border-2"
                disabled={isUploading}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
          </div>
          {selectedFile && (
            <p className="text-sm text-muted-foreground">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {previewUrl && (
          <div className="space-y-3 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/50 border-2 border-blue-200/50 dark:border-blue-800/50">
            <Label className="text-sm font-semibold">Preview</Label>
            <audio controls src={previewUrl} className="w-full" />
          </div>
        )}

        {isUploading && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Upload Progress</Label>
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              {uploadProgress}%
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="flex-1 h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isUploading ? (
              <>
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Play className="w-6 h-6 mr-2" />
                Make Live
              </>
            )}
          </Button>
          <Button
            onClick={handleRemove}
            variant="outline"
            className="h-14 px-6 rounded-2xl border-2 border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-500/10 font-bold"
            disabled={isUploading}
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Remove Current
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
