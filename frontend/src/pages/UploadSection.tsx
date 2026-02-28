import React, { useState, useRef } from 'react';
import { Zap, Copy, Check, Sparkles, ChevronDown, Key, Eye, EyeOff, Image, MessageSquare, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { useGenerateAiComments } from '../hooks/useAiCommentQueries';
import { useActor } from '../hooks/useActor';
import { ExternalBlob } from '../backend';

const LENGTH_OPTIONS = [
  { label: 'Short', value: 80 },
  { label: 'Medium', value: 200 },
  { label: 'Long', value: 400 },
];

export default function UploadSection() {
  // ── Card 1: Upload Comment ──────────────────────────────────────────────────
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // ── Card 2: Bulk Comment Generator ─────────────────────────────────────────
  const [accessKey, setAccessKey] = useState('');
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [accessKeyError, setAccessKeyError] = useState('');
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const [commentCount, setCommentCount] = useState(10);
  const [lengthOption, setLengthOption] = useState(200);
  const [generatedComments, setGeneratedComments] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // ── Card 3: Upload Rating Image ─────────────────────────────────────────────
  const [imageName, setImageName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateMutation = useGenerateAiComments();
  const { actor } = useActor();

  // ── Handlers: Card 1 ────────────────────────────────────────────────────────
  const handleSubmitComment = async () => {
    const text = commentText.trim();
    if (!text) { toast.error('Enter a comment first'); return; }
    if (!actor) { toast.error('Not connected to backend'); return; }
    setIsSubmittingComment(true);
    try {
      await actor.generateUserComments([text]);
      setCommentText('');
      toast.success('Comment uploaded successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // ── Handlers: Card 2 ────────────────────────────────────────────────────────
  const handleVerifyKey = async () => {
    const key = accessKey.trim();
    if (!key) { setAccessKeyError('Please enter an access key'); return; }
    if (!actor) { setAccessKeyError('Not connected to backend'); return; }
    setIsVerifyingKey(true);
    setAccessKeyError('');
    try {
      const valid = await actor.validateAccessKey(key);
      if (valid) {
        setIsUnlocked(true);
        toast.success('Access granted! Bulk generator unlocked.');
      } else {
        setAccessKeyError('Invalid access key. Please try again.');
      }
    } catch (err: any) {
      setAccessKeyError(err?.message || 'Failed to verify key. Please try again.');
    } finally {
      setIsVerifyingKey(false);
    }
  };

  const handleGenerate = async () => {
    try {
      const results = await generateMutation.mutateAsync({
        commentCount,
        commentLength: lengthOption,
      });
      setGeneratedComments(results.map(([, content]) => content));
    } catch {
      // error handled by mutation onError
    }
  };

  const handleCopyOne = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleCopyAll = async () => {
    if (generatedComments.length === 0) return;
    try {
      await navigator.clipboard.writeText(generatedComments.join('\n\n'));
      setCopiedAll(true);
      toast.success('All comments copied!');
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  // ── Handlers: Card 3 ────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (file && !imageName) {
      setImageName(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUploadImage = async () => {
    if (!selectedFile) { toast.error('Select an image file first'); return; }
    if (!imageName.trim()) { toast.error('Enter an image name'); return; }
    if (!actor) { toast.error('Not connected to backend'); return; }

    setIsUploadingImage(true);
    setUploadProgress(0);
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
        setUploadProgress(pct);
      });
      await actor.uploadImage(blob);
      setSelectedFile(null);
      setImageName('');
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Image uploaded successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 relative z-10">

        {/* ── Card 1: Upload Comment ─────────────────────────────────────── */}
        <div className="bg-card border border-teal-500/20 rounded-2xl p-5 shadow-lg shadow-teal-900/10 animate-fade-slide-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Upload Comment</h3>
              <p className="text-xs text-muted-foreground">Submit a comment to the backend</p>
            </div>
          </div>

          <textarea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Type your comment here..."
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl border border-teal-500/20 bg-background/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-sm resize-none mb-3"
          />

          <button
            onClick={handleSubmitComment}
            disabled={isSubmittingComment || !commentText.trim()}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:from-teal-500 hover:to-emerald-400 transition-all shadow-md shadow-teal-900/20"
          >
            {isSubmittingComment ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {isSubmittingComment ? 'Uploading...' : 'Upload Comment'}
          </button>
        </div>

        {/* ── Card 2: Bulk Comment Generator ────────────────────────────── */}
        <div className="bg-card border border-teal-500/20 rounded-2xl p-5 shadow-lg shadow-teal-900/10 animate-fade-slide-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Bulk Comment Generator</h3>
              <p className="text-xs text-muted-foreground">Generate multiple AI comments at once</p>
            </div>
            {isUnlocked && (
              <span className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                <Check className="w-3 h-3" /> Unlocked
              </span>
            )}
          </div>

          {/* Locked state — access key entry */}
          {!isUnlocked ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-teal-500/5 border border-teal-500/15 flex items-start gap-2">
                <Key className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  An <span className="text-teal-400 font-medium">access key</span> is required to use the Bulk Comment Generator. Contact the admin to get your key.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Access Key</label>
                <div className="relative">
                  <input
                    type={showAccessKey ? 'text' : 'password'}
                    value={accessKey}
                    onChange={e => { setAccessKey(e.target.value); setAccessKeyError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleVerifyKey()}
                    placeholder="Enter your access key..."
                    className="w-full px-3 py-2.5 pr-10 rounded-xl border border-teal-500/20 bg-background/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccessKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-teal-400 transition-colors"
                  >
                    {showAccessKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {accessKeyError && (
                  <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
                    <X className="w-3 h-3" /> {accessKeyError}
                  </p>
                )}
              </div>

              <button
                onClick={handleVerifyKey}
                disabled={isVerifyingKey || !accessKey.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:from-teal-500 hover:to-emerald-400 transition-all shadow-md shadow-teal-900/20"
              >
                {isVerifyingKey ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Key className="w-4 h-4" />
                )}
                {isVerifyingKey ? 'Verifying...' : 'Verify Key & Unlock'}
              </button>
            </div>
          ) : (
            /* Unlocked state — generator controls */
            <div className="space-y-4">
              {/* Count */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Number of Comments <span className="text-muted-foreground">(max 115)</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={115}
                  value={commentCount}
                  onChange={e => setCommentCount(Math.max(1, Math.min(115, parseInt(e.target.value) || 1)))}
                  className="w-full px-3 py-2 rounded-xl border border-teal-500/20 bg-background/60 text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                />
              </div>

              {/* Length */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Comment Length</label>
                <div className="relative">
                  <select
                    value={lengthOption}
                    onChange={e => setLengthOption(Number(e.target.value))}
                    className="w-full px-3 py-2 pr-8 rounded-xl border border-teal-500/20 bg-background/60 text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40 appearance-none"
                  >
                    {LENGTH_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:from-teal-500 hover:to-emerald-400 transition-all shadow-md shadow-teal-900/20"
              >
                {generateMutation.isPending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {generateMutation.isPending ? 'Generating...' : `Generate ${commentCount} Comment${commentCount !== 1 ? 's' : ''}`}
              </button>

              {/* Results */}
              {generatedComments.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{generatedComments.length} comments generated</p>
                    <button
                      onClick={handleCopyAll}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-teal-500/20 bg-teal-500/5 text-teal-400 hover:bg-teal-500/15 transition-colors"
                    >
                      {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedAll ? 'Copied!' : 'Copy All'}
                    </button>
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {generatedComments.map((comment, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-teal-500/5 border border-teal-500/15 group">
                        <span className="text-xs text-muted-foreground mt-0.5 shrink-0 w-5">{i + 1}.</span>
                        <p className="flex-1 text-sm text-foreground leading-relaxed break-words">{comment}</p>
                        <button
                          onClick={() => handleCopyOne(comment, i)}
                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-teal-400"
                        >
                          {copiedIndex === i ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Card 3: Upload Rating Image ────────────────────────────────── */}
        <div className="bg-card border border-teal-500/20 rounded-2xl p-5 shadow-lg shadow-teal-900/10 animate-fade-slide-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Image className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Upload Rating Image</h3>
              <p className="text-xs text-muted-foreground">Upload a screenshot or rating image</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Image Name */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Image Name</label>
              <input
                type="text"
                value={imageName}
                onChange={e => setImageName(e.target.value)}
                placeholder="Enter image name..."
                className="w-full px-3 py-2.5 rounded-xl border border-teal-500/20 bg-background/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-sm"
              />
            </div>

            {/* File Picker */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Select Image</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-6 rounded-xl border-2 border-dashed border-teal-500/25 bg-teal-500/5 hover:bg-teal-500/10 hover:border-teal-500/40 transition-all cursor-pointer flex flex-col items-center gap-2"
              >
                {selectedFile ? (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Image className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-teal-400" />
                    </div>
                    <p className="text-sm text-muted-foreground">Click to select an image</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, WEBP supported</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Upload progress */}
            {isUploadingImage && uploadProgress > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-teal-500/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUploadImage}
              disabled={isUploadingImage || !selectedFile || !imageName.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:from-teal-500 hover:to-emerald-400 transition-all shadow-md shadow-teal-900/20"
            >
              {isUploadingImage ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isUploadingImage ? 'Uploading...' : 'Upload Image'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
