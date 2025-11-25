import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginPage } from './pages/auth/LoginPage';
import { SignUpPage } from './pages/auth/SignUpPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { ParentDashboard } from './pages/parent/ParentDashboard';
import { LibraryPage } from './pages/library/LibraryPage';
import { ExamCenterPage } from './pages/exams/ExamCenterPage';

function AppContent() {
  const { user, profile, loading, signOut } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);
  const [currentPath, setCurrentPath] = useState('/dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return showSignUp ? (
      <SignUpPage onToggleForm={() => setShowSignUp(false)} />
    ) : (
      <LoginPage onToggleForm={() => setShowSignUp(true)} />
    );
  }

  const renderPage = () => {
    if (currentPath === '/library') {
      return <LibraryPage />;
    }
    if (currentPath === '/exams') {
      return <ExamCenterPage />;
    }

    if (profile.user_type === 'student') {
      return <StudentDashboard />;
    }
    if (profile.user_type === 'teacher') {
      return <TeacherDashboard />;
    }
    if (profile.user_type === 'parent') {
      return <ParentDashboard />;
    }
    if (profile.user_type === 'admin') {
      return <StudentDashboard />;
    }

    return <StudentDashboard />;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        userType={profile.user_type}
        currentPath={currentPath}
        onNavigate={setCurrentPath}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header profile={profile} onSignOut={signOut} />
        <main className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
