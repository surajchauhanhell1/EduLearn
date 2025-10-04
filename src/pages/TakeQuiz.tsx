import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/integrations/supabase/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export default function TakeQuiz() {
  const { quizId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId || !user) return;

      const { data: quizData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      const { data: questionsData } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId);

      const { data: attemptData } = await supabase
        .from('quiz_attempts')
        .select('*, quiz_answers(*)')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .maybeSingle();

      setQuiz(quizData);
      setQuestions(questionsData || []);

      if (attemptData) {
        setSubmitted(true);
        setResults(attemptData);
        const savedAnswers: { [key: string]: number } = {};
        attemptData.quiz_answers?.forEach((ans: any) => {
          savedAnswers[ans.question_id] = ans.selected_answer;
        });
        setAnswers(savedAnswers);
      }

      setLoading(false);
    };

    fetchQuiz();
  }, [quizId, user]);

  const handleAnswer = (questionId: string, answer: number) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user || !quizId) return;

    if (Object.keys(answers).length < questions.length) {
      toast({ title: 'Please answer all questions', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      let score = 0;
      const answerRecords: any[] = [];

      const { data: attempt, error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_id: quizId,
          score: 0,
          total_questions: questions.length,
        })
        .select()
        .single();

      if (attemptError) throw attemptError;

      questions.forEach((q) => {
        const userAnswer = answers[q.id];
        const isCorrect = userAnswer === q.correct_answer;
        if (isCorrect) score++;

        answerRecords.push({
          quiz_attempt_id: attempt.id,
          question_id: q.id,
          selected_answer: userAnswer,
          is_correct: isCorrect,
        });
      });

      const { error: answersError } = await supabase
        .from('quiz_answers')
        .insert(answerRecords);

      if (answersError) throw answersError;

      const { error: updateError } = await supabase
        .from('quiz_attempts')
        .update({ score })
        .eq('id', attempt.id);

      if (updateError) throw updateError;

      setSubmitted(true);
      setResults({ ...attempt, score, quiz_answers: answerRecords });
      toast({ title: 'Quiz submitted successfully!' });
    } catch (error: any) {
      toast({ title: 'Error submitting quiz', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !quiz) {
    return <div className="min-h-screen bg-gradient-hero flex items-center justify-center">Loading...</div>;
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];
  const userAnswer = answers[currentQ?.id];
  const answerResult = results?.quiz_answers?.find((a: any) => a.question_id === currentQ?.id);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="bg-card border-b shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/quizzes')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quizzes
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {submitted ? (
          <Card className="shadow-medium">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Quiz Results</CardTitle>
              <CardDescription>{quiz.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8">
                <div className="text-6xl font-bold text-primary mb-4">
                  {Math.round((results.score / results.total_questions) * 100)}%
                </div>
                <p className="text-xl text-muted-foreground">
                  You scored {results.score} out of {results.total_questions}
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Review Your Answers</h3>
                {questions.map((q, index) => {
                  const ans = results.quiz_answers?.find((a: any) => a.question_id === q.id);
                  return (
                    <Card key={q.id} className={ans?.is_correct ? 'border-success' : 'border-destructive'}>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          {ans?.is_correct ? (
                            <CheckCircle className="h-5 w-5 text-success" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                          Question {index + 1}
                        </CardTitle>
                        <CardDescription>{q.question}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {q.options.map((opt: string, i: number) => (
                            <div
                              key={i}
                              className={`p-2 rounded ${
                                i === q.correct_answer
                                  ? 'bg-success/10 border border-success'
                                  : i === ans?.selected_answer && !ans?.is_correct
                                  ? 'bg-destructive/10 border border-destructive'
                                  : 'bg-muted'
                              }`}
                            >
                              {opt}
                              {i === q.correct_answer && <span className="ml-2 text-success">(Correct)</span>}
                              {i === ans?.selected_answer && i !== q.correct_answer && (
                                <span className="ml-2 text-destructive">(Your answer)</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Button onClick={() => navigate('/quizzes')} className="w-full">
                Back to Quizzes
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <Progress value={progress} className="h-2 mb-2" />
              <p className="text-sm text-muted-foreground text-right">
                Question {currentQuestion + 1} of {questions.length}
              </p>
            </div>

            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>{quiz.title}</CardTitle>
                <CardDescription>Question {currentQuestion + 1}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">{currentQ?.question}</h3>
                  <RadioGroup
                    value={userAnswer?.toString()}
                    onValueChange={(value) => handleAnswer(currentQ.id, parseInt(value))}
                  >
                    {currentQ?.options.map((option: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted">
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                  >
                    Previous
                  </Button>

                  {currentQuestion === questions.length - 1 ? (
                    <Button onClick={handleSubmit} disabled={loading}>
                      {loading ? 'Submitting...' : 'Submit Quiz'}
                    </Button>
                  ) : (
                    <Button onClick={handleNext}>Next</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
