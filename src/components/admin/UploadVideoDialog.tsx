import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/integrations/supabase/auth';
import { toast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';

interface UploadVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UploadVideoDialog({ open, onOpenChange, onSuccess }: UploadVideoDialogProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    duration_minutes: '',
    video_url: '',
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUploading(true);
    try {
      let videoUrl = formData.video_url;
      let thumbnailUrl = '';

      // Upload video file if provided (instead of URL)
      if (videoFile) {
        const fileExt = videoFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(fileName, videoFile);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('videos')
          .getPublicUrl(fileName);
        videoUrl = publicUrl;
      }

      // Upload thumbnail if provided
      if (thumbnail) {
        const thumbExt = thumbnail.name.split('.').pop();
        const thumbName = `${Math.random()}.${thumbExt}`;
        const { error: thumbError } = await supabase.storage
          .from('videos')
          .upload(thumbName, thumbnail);

        if (!thumbError) {
          const { data: { publicUrl: thumbPublicUrl } } = supabase.storage
            .from('videos')
            .getPublicUrl(thumbName);
          thumbnailUrl = thumbPublicUrl;
        }
      }

      // Insert video record
      const { error: dbError } = await supabase.from('videos').insert({
        title: formData.title,
        subject: formData.subject,
        description: formData.description,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl || null,
        uploaded_by: user.id,
      });

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'Video uploaded successfully',
      });

      setFormData({ title: '', subject: '', description: '', duration_minutes: '', video_url: '' });
      setVideoFile(null);
      setThumbnail(null);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Video</DialogTitle>
          <DialogDescription>Add a new video lesson</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
            />
          </div>
          <div>
            <Label>Video Source</Label>
            <div className="space-y-2">
              <div>
                <Label htmlFor="video-url" className="text-sm text-muted-foreground">
                  YouTube/External URL
                </Label>
                <Input
                  id="video-url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  disabled={!!videoFile}
                />
              </div>
              <div className="text-center text-muted-foreground">OR</div>
              <div>
                <Label htmlFor="video-file" className="text-sm text-muted-foreground">
                  Upload Video File
                </Label>
                <Input
                  id="video-file"
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  disabled={!!formData.video_url}
                />
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="thumbnail">Thumbnail Image (Optional)</Label>
            <Input
              id="thumbnail"
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading || (!formData.video_url && !videoFile)}>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Video'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
