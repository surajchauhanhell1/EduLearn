-- Create app_role enum for proper role management
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');

-- Create user_roles table with proper security
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add table to store quiz answers from students
CREATE TABLE public.quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_answer INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(quiz_attempt_id, question_id)
);

-- Enable RLS on quiz_answers
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

-- RLS policies for quiz_answers
CREATE POLICY "Users can view own quiz answers"
ON public.quiz_answers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quiz_attempts
    WHERE quiz_attempts.id = quiz_answers.quiz_attempt_id
    AND quiz_attempts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own quiz answers"
ON public.quiz_answers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quiz_attempts
    WHERE quiz_attempts.id = quiz_answers.quiz_attempt_id
    AND quiz_attempts.user_id = auth.uid()
  )
);

CREATE POLICY "Teachers and admins can view all quiz answers"
ON public.quiz_answers
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher') OR 
  public.has_role(auth.uid(), 'admin')
);

-- Update quiz_attempts to allow teachers/admins to view all attempts
CREATE POLICY "Teachers and admins can view all quiz attempts"
ON public.quiz_attempts
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher') OR 
  public.has_role(auth.uid(), 'admin')
);

-- Add teacher role support to quizzes RLS
DROP POLICY IF EXISTS "Admins can manage quizzes" ON public.quizzes;
CREATE POLICY "Teachers and admins can manage quizzes"
ON public.quizzes
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher') OR 
  public.has_role(auth.uid(), 'admin')
);

-- Add teacher role support to quiz_questions RLS
DROP POLICY IF EXISTS "Admins can manage quiz questions" ON public.quiz_questions;
CREATE POLICY "Teachers and admins can manage quiz questions"
ON public.quiz_questions
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher') OR 
  public.has_role(auth.uid(), 'admin')
);