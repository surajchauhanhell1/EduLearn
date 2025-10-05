import { useEffect, useState } from 'react';
import { useAuth } from '@/integrations/supabase/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, LogOut, BookOpen, Video, Users, FileQuestion, Plus, Edit, Trash2, TrendingUp, Calendar } from 'lucide-react';
import { UploadBookDialog } from '@/components/admin/UploadBookDialog';
import { UploadVideoDialog } from '@/components/admin/UploadVideoDialog';
import { CreateCourseDialog } from '@/components/admin/CreateCourseDialog';
import { CreateQuizDialog } from '@/components/admin/CreateQuizDialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalVideos: 0,
    totalCourses: 0,
    totalStudents: 0,
    totalQuizzes: 0,
  });
  
  const [uploadBookOpen, setUploadBookOpen] = useState(false);
  const [uploadVideoOpen, setUploadVideoOpen] = useState(false);
  const [createCourseOpen, setCreateCourseOpen] = useState(false);
  const [createQuizOpen, setCreateQuizOpen] = useState(false);
  
  const [quizAnalytics, setQuizAnalytics] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [contentList, setContentList] = useState<any[]>([]);

  useEffect(() => {
    fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    if (!user) return;

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(profileData);

    // Fetch stats
    const { data: booksData } = await supabase.from('books').select('id');
    const { data: videosData } = await supabase.from('videos').select('id');
    const { data: coursesData } = await supabase.from('courses').select('id');
    const { data: studentsData } = await supabase
      .from('user_roles')
      .select('id')
      .eq('role', 'student');
    const { data: quizzesData } = await supabase.from('quizzes').select('id');

    setStats({
      totalBooks: booksData?.length || 0,
      totalVideos: videosData?.length || 0,
      totalCourses: coursesData?.length || 0,
      totalStudents: studentsData?.length || 0,
      totalQuizzes: quizzesData?.length || 0,
    });

    // Fetch quiz analytics
    await fetchQuizAnalytics();
    
    // Fetch user statistics
    await fetchUserStatistics();
    
    // Fetch all content
    await fetchAllContent();
  };

  const fetchQuizAnalytics = async () => {
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('id, title, created_at');

    if (!quizzes) return;

    const analytics = await Promise.all(
      quizzes.map(async (quiz) => {
        const { data: attempts } = await supabase
          .from('quiz_attempts')
          .select('*, profiles!inner(full_name)')
          .eq('quiz_id', quiz.id);

        const totalAttempts = attempts?.length || 0;
        const averageScore = totalAttempts > 0
          ? Math.round((attempts?.reduce((sum, a) => sum + (a.score / a.total_questions) * 100, 0) || 0) / totalAttempts)
          : 0;

        return {
          ...quiz,
          attempts: attempts || [],
          totalAttempts,
          averageScore,
        };
      })
    );

    setQuizAnalytics(analytics);
  };

  const fetchUserStatistics = async () => {
    // Get total users count
    const { data: allUsers } = await supabase
      .from('user_roles')
      .select('user_id, role, created_at');

    // Get roles distribution
    const roleDistribution = allUsers?.reduce((acc: any, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    // Get recent users
    const { data: recentUsers } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get users with roles
    const usersWithRoles = await Promise.all(
      (recentUsers || []).map(async (user) => {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        return { ...user, role: roleData?.role || 'student' };
      })
    );

    // Calculate monthly growth
    const monthlyGrowth = allUsers?.reduce((acc: any, user) => {
      const month = format(new Date(user.created_at), 'MMM yyyy');
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    setUserStats({
      totalUsers: allUsers?.length || 0,
      roleDistribution: roleDistribution || {},
      recentUsers: usersWithRoles || [],
      monthlyGrowth: Object.entries(monthlyGrowth || {}).map(([month, count]) => ({
        month,
        count,
      })),
    });
  };

  const fetchAllContent = async () => {
    const [books, videos, courses, quizzes] = await Promise.all([
      supabase.from('books').select('id, title, subject, created_at').then(r => r.data?.map((item: any) => ({ ...item, type: 'book' as const })) || []),
      supabase.from('videos').select('id, title, subject, created_at').then(r => r.data?.map((item: any) => ({ ...item, type: 'video' as const })) || []),
      supabase.from('courses').select('id, title, subject, created_at').then(r => r.data?.map((item: any) => ({ ...item, type: 'course' as const })) || []),
      supabase.from('quizzes').select('id, title, created_at').then(r => r.data?.map((item: any) => ({ ...item, type: 'quiz' as const, subject: null })) || []),
    ]);

    const allContent: any[] = [...books, ...videos, ...courses, ...quizzes];
    setContentList(allContent.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ));
  };

  const refreshStats = () => {
    fetchAllData();
  };

  const handleDeleteContent = async (contentId: string, contentType: string) => {
    let tableName: 'books' | 'videos' | 'courses' | 'quizzes';
    if (contentType === 'quiz') {
      tableName = 'quizzes';
    } else if (contentType === 'book') {
      tableName = 'books';
    } else if (contentType === 'video') {
      tableName = 'videos';
    } else {
      tableName = 'courses';
    }
    await supabase.from(tableName).delete().eq('id', contentId);
    fetchAllContent();
    refreshStats();
  };

  const totalQuizAttempts = quizAnalytics.reduce((sum, q) => sum + q.totalAttempts, 0);
  const overallAverageScore = quizAnalytics.length > 0
    ? Math.round(quizAnalytics.reduce((sum, q) => sum + q.averageScore, 0) / quizAnalytics.length)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">EduLearn Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {profile?.full_name || 'Admin'}
            </span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Admin Dashboard</h2>
          <p className="text-muted-foreground">Manage content and monitor platform activity</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <BookOpen className="h-4 w-4 text-primary" />
                Books
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalBooks}</p>
              <p className="text-xs text-muted-foreground">Total books uploaded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Video className="h-4 w-4 text-secondary" />
                Videos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalVideos}</p>
              <p className="text-xs text-muted-foreground">Total video lessons</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <GraduationCap className="h-4 w-4 text-accent" />
                Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalCourses}</p>
              <p className="text-xs text-muted-foreground">Active courses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4 text-success" />
                Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalStudents}</p>
              <p className="text-xs text-muted-foreground">Registered students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <FileQuestion className="h-4 w-4 text-primary" />
                Quizzes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalQuizzes}</p>
              <p className="text-xs text-muted-foreground">Created quizzes</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quiz-analytics">Quiz Analytics</TabsTrigger>
            <TabsTrigger value="user-statistics">User Statistics</TabsTrigger>
            <TabsTrigger value="content-management">Content Management</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Management</CardTitle>
                <CardDescription>Upload and manage learning materials</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button 
                    className="h-24 flex flex-col items-center gap-2"
                    onClick={() => setUploadBookOpen(true)}
                  >
                    <Plus className="h-6 w-6" />
                    <span className="font-semibold">Upload Book</span>
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="h-24 flex flex-col items-center gap-2"
                    onClick={() => setUploadVideoOpen(true)}
                  >
                    <Plus className="h-6 w-6" />
                    <span className="font-semibold">Upload Video</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col items-center gap-2"
                    onClick={() => setCreateCourseOpen(true)}
                  >
                    <Plus className="h-6 w-6" />
                    <span className="font-semibold">Create Course</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col items-center gap-2"
                    onClick={() => setCreateQuizOpen(true)}
                  >
                    <Plus className="h-6 w-6" />
                    <span className="font-semibold">Create Quiz</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quiz Analytics Tab */}
          <TabsContent value="quiz-analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Quiz Performance Overview
                </CardTitle>
                <CardDescription>Track student performance and quiz completion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-3xl font-bold text-primary">{stats.totalQuizzes}</p>
                    <p className="text-sm text-muted-foreground">Total Quizzes</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-secondary">{totalQuizAttempts}</p>
                    <p className="text-sm text-muted-foreground">Total Attempts</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-accent">{overallAverageScore}%</p>
                    <p className="text-sm text-muted-foreground">Average Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {quizAnalytics.map((quiz) => (
              <Card key={quiz.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">"{quiz.title}"</CardTitle>
                      <CardDescription>
                        {quiz.totalAttempts} attempts • Average: {quiz.averageScore}%
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {quiz.totalAttempts} student{quiz.totalAttempts !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Average Performance</p>
                    <Progress value={quiz.averageScore} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{quiz.averageScore}%</p>
                  </div>

                  {quiz.attempts.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Percentage</TableHead>
                          <TableHead>Completed</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quiz.attempts.map((attempt: any) => {
                          const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
                          return (
                            <TableRow key={attempt.id}>
                              <TableCell>{attempt.profiles?.full_name || 'Unknown'}</TableCell>
                              <TableCell>{attempt.score}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={percentage} className="h-1 w-24" />
                                  <span className="text-sm">{percentage}%</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {format(new Date(attempt.completed_at), 'dd/MM/yyyy')}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* User Statistics Tab */}
          <TabsContent value="user-statistics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <Users className="h-4 w-4" />
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{userStats?.totalUsers || 0}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <TrendingUp className="h-4 w-4" />
                    Active This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {userStats?.monthlyGrowth?.[userStats.monthlyGrowth.length - 1]?.count || 0}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <Users className="h-4 w-4" />
                    Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{userStats?.roleDistribution?.student || 0}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <TrendingUp className="h-4 w-4" />
                    New This Week
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">0</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Distribution</CardTitle>
                  <CardDescription>Breakdown by user roles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(userStats?.roleDistribution || {}).map(([role, count]: [string, any]) => {
                      const percentage = Math.round((count / (userStats?.totalUsers || 1)) * 100);
                      return (
                        <div key={role}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-primary" />
                              <span className="text-sm font-medium capitalize">{role}s</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {count} ({percentage}%)
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Growth</CardTitle>
                  <CardDescription>User registration trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {userStats?.monthlyGrowth?.slice(-6).map((item: any) => (
                      <div key={item.month} className="flex items-center justify-between">
                        <span className="text-sm">{item.month}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(item.count * 20, 100)}%` }} />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>Latest user registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userStats?.recentUsers?.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name || 'Unknown'}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {format(new Date(user.created_at), 'dd/MM/yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Management Tab */}
          <TabsContent value="content-management" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Management</CardTitle>
                <CardDescription>Manage all uploaded content including books, videos, courses, and quizzes</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contentList.map((content) => (
                      <TableRow key={`${content.type}-${content.id}`}>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {content.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{content.title}</TableCell>
                        <TableCell>
                          {content.subject && (
                            <Badge variant="secondary">{content.subject}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {format(new Date(content.created_at), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteContent(content.id, content.type)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <UploadBookDialog 
          open={uploadBookOpen} 
          onOpenChange={setUploadBookOpen}
          onSuccess={refreshStats}
        />
        <UploadVideoDialog 
          open={uploadVideoOpen} 
          onOpenChange={setUploadVideoOpen}
          onSuccess={refreshStats}
        />
        <CreateCourseDialog 
          open={createCourseOpen} 
          onOpenChange={setCreateCourseOpen}
          onSuccess={refreshStats}
        />
        <CreateQuizDialog 
          open={createQuizOpen} 
          onOpenChange={setCreateQuizOpen}
          onSuccess={refreshStats}
        />
      </main>
    </div>
  );
}
