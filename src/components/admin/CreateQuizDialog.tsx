import { useState } from 'react';
import { useAuth } from '@/integrations/supabase/auth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';

interface Question {
  question: string;
  options: string[];
  correct_answer: number;
}

export function CreateQuizDialog({ 
  open, 
  onOpenChange,
  onSuccess 
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState<'book' | 'video' | 'course'>('book');
  const [contentId, setContentId] = useState('');
  const [contents, setContents] = useState<any[]>([]);
  const [questions, setQuestions] = useState<Question[]>([
    { question: '', options: ['', '', '', ''], correct_answer: 0 }
  ]);

  const fetchContents = async (type: 'book' | 'video' | 'course') => {
    const tableName = type === 'book' ? 'books' : type === 'video' ? 'videos' : 'courses';
    const { data } = await supabase.from(tableName).select('id, title');
    setContents(data || []);
  };

  const handleContentTypeChange = (type: 'book' | 'video' | 'course') => {
    setContentType(type);
    setContentId('');
    fetchContents(type);
  };

  const addQuestion = () => {
    setQuestions([...questions, { question: '', options: ['', '', '', ''], correct_answer: 0 }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !title || !contentId || questions.length === 0) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    const hasEmptyQuestions = questions.some(q => 
      !q.question || q.options.some(opt => !opt)
    );
    
    if (hasEmptyQuestions) {
      toast({ title: 'Please complete all questions and options', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title,
          description,
          content_id: contentId,
          content_type: contentType,
          created_by: user.id,
        })
        .select()
        .single();

      if (quizError) throw quizError;

      const questionsData = questions.map(q => ({
        quiz_id: quiz.id,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
      }));

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(questionsData);

      if (questionsError) throw questionsError;

      toast({ title: 'Quiz created successfully!' });
      onOpenChange(false);
      onSuccess?.();
      
      setTitle('');
      setDescription('');
      setContentId('');
      setQuestions([{ question: '', options: ['', '', '', ''], correct_answer: 0 }]);
    } catch (error: any) {
      toast({ title: 'Error creating quiz', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Quiz</DialogTitle>
          <DialogDescription>Design an assessment for your content</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Quiz Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter quiz title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter quiz description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Content Type</Label>
                <Select value={contentType} onValueChange={handleContentTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="book">Book</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Select Content</Label>
                <Select value={contentId} onValueChange={setContentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select content" />
                  </SelectTrigger>
                  <SelectContent>
                    {contents.map((content) => (
                      <SelectItem key={content.id} value={content.id}>
                        {content.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">Questions</Label>
              <Button type="button" onClick={addQuestion} size="sm">
                <Plus className="h-4 w-4 mr-2" /> Add Question
              </Button>
            </div>

            {questions.map((q, qIndex) => (
              <div key={qIndex} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <Label>Question {qIndex + 1}</Label>
                  {questions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(qIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <Textarea
                  value={q.question}
                  onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                  placeholder="Enter your question"
                  required
                />

                <div className="space-y-2">
                  <Label>Options (Select the correct answer)</Label>
                  <RadioGroup
                    value={q.correct_answer.toString()}
                    onValueChange={(value) => updateQuestion(qIndex, 'correct_answer', parseInt(value))}
                  >
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-o${oIndex}`} />
                        <Input
                          value={opt}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          placeholder={`Option ${oIndex + 1}`}
                          className="flex-1"
                          required
                        />
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Quiz'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
