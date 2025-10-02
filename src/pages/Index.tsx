import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/integrations/supabase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, BookOpen, Video, Trophy, Users, ArrowRight } from 'lucide-react';
import heroImage from '@/assets/hero-image.jpg';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (data?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/student');
        }
      }
    };

    checkUserRole();
  }, [user, navigate]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="h-12 w-12 text-primary" />
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">EduLearn</h1>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                Transform Your Learning Journey
              </h2>
              <p className="text-lg text-muted-foreground">
                Access thousands of courses, books, and video lessons. Track your progress,
                take quizzes, and achieve your educational goals with our comprehensive
                e-learning platform.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={() => navigate('/auth')} className="shadow-medium">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
              </div>
            </div>
            <div className="relative">
              <img
                src={heroImage}
                alt="Students learning together"
                className="rounded-2xl shadow-large w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform provides all the tools and resources you need for effective learning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="shadow-soft hover:shadow-medium transition-shadow">
              <CardHeader>
                <GraduationCap className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Structured Courses</CardTitle>
                <CardDescription>
                  Access organized courses with books, videos, and assessments all in one place
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-shadow">
              <CardHeader>
                <BookOpen className="h-12 w-12 text-secondary mb-4" />
                <CardTitle>Rich Library</CardTitle>
                <CardDescription>
                  Explore our extensive collection of books and educational materials
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-shadow">
              <CardHeader>
                <Video className="h-12 w-12 text-accent mb-4" />
                <CardTitle>Video Lessons</CardTitle>
                <CardDescription>
                  Learn at your own pace with high-quality video content from expert instructors
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-shadow">
              <CardHeader>
                <Trophy className="h-12 w-12 text-success mb-4" />
                <CardTitle>Track Progress</CardTitle>
                <CardDescription>
                  Monitor your learning journey and celebrate your achievements
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Interactive Quizzes</CardTitle>
                <CardDescription>
                  Test your knowledge with quizzes and get instant feedback
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-shadow">
              <CardHeader>
                <BookOpen className="h-12 w-12 text-secondary mb-4" />
                <CardTitle>Personal Notes</CardTitle>
                <CardDescription>
                  Create and organize notes to enhance your learning experience
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of students already learning on our platform. Start your journey today!
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate('/auth')}
            className="shadow-large"
          >
            Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 EduLearn. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
