import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/integrations/supabase/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, ArrowLeft, FileQuestion, Clock, CheckCircle } from 'lucide-react';

export default function Quizzes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!user) return;

      const { data: quizzesData } = await supabase
        .from('quizzes')
        .select('*, quiz_questions(count)')
        .order('created_at', { ascending: false });

      const { data: attemptsData } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id);

      setQuizzes(quizzesData || []);
      setAttempts(attemptsData || []);
      setLoading(false);
    };

    fetchQuizzes();
  }, [user]);

  const getAttemptForQuiz = (quizId: string) => {
    return attempts.find(a => a.quiz_id === quizId);
  };

  if (loading) {
    return <div className="min-h-screen bg-gradient-hero flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="bg-card border-b shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Quizzes</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Available Quizzes</h2>
          <p className="text-muted-foreground">Test your knowledge and track your progress</p>
        </div>

        <div className="grid gap-6">
          {quizzes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No quizzes available yet</p>
              </CardContent>
            </Card>
          ) : (
            quizzes.map((quiz) => {
              const attempt = getAttemptForQuiz(quiz.id);
              const questionCount = quiz.quiz_questions?.[0]?.count || 0;

              return (
                <Card key={quiz.id} className="shadow-soft hover:shadow-medium transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {quiz.title}
                          {attempt && (
                            <Badge variant="secondary" className="ml-2">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-2">{quiz.description}</CardDescription>
                      </div>
                      <Badge variant="outline">
                        {quiz.content_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileQuestion className="h-4 w-4" />
                          {questionCount} questions
                        </span>
                        {attempt && (
                          <span className="flex items-center gap-1 text-success">
                            Score: {attempt.score}/{attempt.total_questions} ({Math.round((attempt.score / attempt.total_questions) * 100)}%)
                          </span>
                        )}
                      </div>
                      <Button onClick={() => navigate(`/quiz/${quiz.id}`)}>
                        {attempt ? 'Review' : 'Start Quiz'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
