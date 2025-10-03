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

interface UploadBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UploadBookDialog({ open, onOpenChange, onSuccess }: UploadBookDialogProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    subject: '',
    description: '',
  });
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !bookFile) return;

    setUploading(true);
    try {
      let fileUrl = '';
      let coverUrl = '';

      // Upload book file
      const fileExt = bookFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('books')
        .upload(fileName, bookFile);

      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('books')
        .getPublicUrl(fileName);
      fileUrl = publicUrl;

      // Upload cover image if provided
      if (coverImage) {
        const coverExt = coverImage.name.split('.').pop();
        const coverName = `${Math.random()}.${coverExt}`;
        const { error: coverError } = await supabase.storage
          .from('books')
          .upload(coverName, coverImage);

        if (!coverError) {
          const { data: { publicUrl: coverPublicUrl } } = supabase.storage
            .from('books')
            .getPublicUrl(coverName);
          coverUrl = coverPublicUrl;
        }
      }

      // Insert book record
      const { error: dbError } = await supabase.from('books').insert({
        title: formData.title,
        author: formData.author,
        subject: formData.subject,
        description: formData.description,
        file_url: fileUrl,
        cover_image_url: coverUrl || null,
        uploaded_by: user.id,
      });

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'Book uploaded successfully',
      });

      setFormData({ title: '', author: '', subject: '', description: '' });
      setBookFile(null);
      setCoverImage(null);
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
          <DialogTitle>Upload Book</DialogTitle>
          <DialogDescription>Add a new book to the library</DialogDescription>
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
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
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
            <Label htmlFor="book-file">Book File (PDF, EPUB, DOCX) *</Label>
            <Input
              id="book-file"
              type="file"
              accept=".pdf,.epub,.docx,.doc"
              onChange={(e) => setBookFile(e.target.files?.[0] || null)}
              required
            />
          </div>
          <div>
            <Label htmlFor="cover">Cover Image (Optional)</Label>
            <Input
              id="cover"
              type="file"
              accept="image/*"
              onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading}>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Book'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
