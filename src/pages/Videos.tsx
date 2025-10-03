import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, ArrowLeft, Play } from 'lucide-react';

export default function Videos() {
  const [videos, setVideos] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVideos = async () => {
      const { data } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });
      setVideos(data || []);
    };
    fetchVideos();
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
            <Video className="h-8 w-8 text-accent" />
            Video Lessons
          </h1>
          <p className="text-muted-foreground">Watch educational videos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <Card key={video.id} className="shadow-soft hover:shadow-medium transition-shadow">
              {video.thumbnail_url && (
                <div className="relative">
                  <img 
                    src={video.thumbnail_url} 
                    alt={video.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-primary/80 rounded-full p-4">
                      <Play className="h-8 w-8 text-primary-foreground" />
                    </div>
                  </div>
                </div>
              )}
              <CardHeader>
                <CardTitle>{video.title}</CardTitle>
                {video.subject && (
                  <CardDescription className="text-accent">{video.subject}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {video.description}
                </p>
                {video.duration_minutes && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Duration: {video.duration_minutes} minutes
                  </p>
                )}
                {video.video_url && (
                  <Button className="w-full" asChild>
                    <a href={video.video_url} target="_blank" rel="noopener noreferrer">
                      <Play className="h-4 w-4 mr-2" />
                      Watch Video
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
          {videos.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No videos available yet</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
