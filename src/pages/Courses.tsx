import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, ArrowLeft, BookOpen } from 'lucide-react';
import { useAuth } from '@/integrations/supabase/auth';

export default function Courses() {
  const [courses, setCourses] = useState<any[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      setCourses(data || []);
    };
    fetchCourses();
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
            <GraduationCap className="h-8 w-8 text-primary" />
            All Courses
          </h1>
          <p className="text-muted-foreground">Browse available courses</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="shadow-soft hover:shadow-medium transition-shadow">
              {course.thumbnail_url && (
                <img 
                  src={course.thumbnail_url} 
                  alt={course.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              )}
              <CardHeader>
                <CardTitle>{course.title}</CardTitle>
                {course.subject && (
                  <CardDescription className="text-primary">{course.subject}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{course.description}</p>
                <Button className="w-full">
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Course
                </Button>
              </CardContent>
            </Card>
          ))}
          {courses.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No courses available yet</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
