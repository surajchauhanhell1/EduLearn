import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowLeft, Download } from 'lucide-react';

export default function Books() {
  const [books, setBooks] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBooks = async () => {
      const { data } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });
      setBooks(data || []);
    };
    fetchBooks();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="bg-card border-b shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-secondary" />
            Library
          </h1>
          <p className="text-muted-foreground">Browse available books</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <Card key={book.id} className="shadow-soft hover:shadow-medium transition-shadow">
              {book.cover_image_url && (
                <img 
                  src={book.cover_image_url} 
                  alt={book.title}
                  className="w-full h-64 object-cover rounded-t-lg"
                />
              )}
              <CardHeader>
                <CardTitle className="text-lg">{book.title}</CardTitle>
                {book.author && (
                  <CardDescription>by {book.author}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {book.subject && (
                  <p className="text-sm text-primary mb-2">{book.subject}</p>
                )}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {book.description}
                </p>
                {book.file_url && (
                  <Button className="w-full" size="sm" asChild>
                    <a href={book.file_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
          {books.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No books available yet</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
