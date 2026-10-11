import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { SocketProvider, useSocket } from './context/SocketContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { GlobalSearchModal } from './components/GlobalSearchModal.tsx';
import { TaskDetailsModal } from './components/TaskDetailsModal.tsx';
import { Task, Project } from './types/index.ts';
import { api } from './services/api.ts';

// Pages
import { Login } from './pages/Login.tsx';
import { Register } from './pages/Register.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Projects } from './pages/Projects.tsx';
import { ProjectDetails } from './pages/ProjectDetails.tsx';
import { MyTasks } from './pages/MyTasks.tsx';
import { Notifications } from './pages/Notifications.tsx';
import { Profile } from './pages/Profile.tsx';

function MainApp() {
  const { user, loading } = useAuth();
  const { socket } = useSocket();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  // Global modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Fetch unread notifications count
  const refreshUnreadCount = async () => {
    if (!user) return;
    try {
      const res = await api.notifications.getAll();
      const unread = (res.notifications || []).filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (user) {
      refreshUnreadCount();
    }
  }, [user]);

  // Real-time notification updates
  useEffect(() => {
    if (!socket) return;
    const handleNewNote = () => {
      setUnreadCount((prev) => prev + 1);
    };
    socket.on('notification-created', handleNewNote);
    socket.on('notification:created', handleNewNote);

    return () => {
      socket.off('notification-created', handleNewNote);
      socket.off('notification:created', handleNewNote);
    };
  }, [socket]);

  // Global keyboard shortcuts (Ctrl+K or '/' for search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
          <p className="text-xs font-medium text-neutral-500">Initializing CollabFlow...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated view
  if (!user) {
    if (authView === 'register') {
      return (
        <Register
          onNavigateLogin={() => setAuthView('login')}
          onSuccess={() => setCurrentTab('dashboard')}
        />
      );
    }
    return (
      <Login
        onNavigateRegister={() => setAuthView('register')}
        onSuccess={() => setCurrentTab('dashboard')}
      />
    );
  }

  // Navigation helpers
  const handleOpenProject = (id: number) => {
    setSelectedProjectId(id);
    setCurrentTab('project-details');
  };

  const handleOpenTask = (task: Task) => {
    setSelectedTaskId(task.id);
  };

  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab);
    if (tab !== 'project-details') {
      setSelectedProjectId(null);
    }
    if (tab === 'notifications') {
      setUnreadCount(0);
    }
  };

  // Header Title derivation
  let pageTitle = 'Dashboard';
  let pageSubtitle = 'Overview of your work and team metrics';

  if (currentTab === 'projects') {
    pageTitle = 'Projects';
    pageSubtitle = 'Manage your projects and collaborate with your team';
  } else if (currentTab === 'project-details') {
    pageTitle = 'Project Details';
    pageSubtitle = 'Kanban board, member permissions, and live activity stream';
  } else if (currentTab === 'my-tasks') {
    pageTitle = 'My Tasks';
    pageSubtitle = 'All tasks assigned to you across active projects';
  } else if (currentTab === 'notifications') {
    pageTitle = 'Notifications';
    pageSubtitle = 'Real-time collaborative updates and task alerts';
  } else if (currentTab === 'profile') {
    pageTitle = 'Profile';
    pageSubtitle = 'Account preferences and security credentials';
  }

  return (
    <div className="min-h-screen bg-neutral-50/70 text-neutral-900 font-sans flex flex-col antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab === 'project-details' ? 'projects' : currentTab}
        onSelectTab={handleSelectTab}
        unreadCount={unreadCount}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main App Canvas */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <Header
          title={pageTitle}
          subtitle={pageSubtitle}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onNavigateTab={handleSelectTab}
          unreadCount={unreadCount}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <Dashboard
              onNavigateProjects={() => handleSelectTab('projects')}
              onOpenProject={handleOpenProject}
              onOpenTask={handleOpenTask}
            />
          )}

          {currentTab === 'projects' && (
            <Projects onOpenProject={handleOpenProject} />
          )}

          {currentTab === 'project-details' && selectedProjectId && (
            <ProjectDetails
              projectId={selectedProjectId}
              onBackToProjects={() => handleSelectTab('projects')}
            />
          )}

          {currentTab === 'my-tasks' && (
            <MyTasks onOpenTaskDetails={handleOpenTask} />
          )}

          {currentTab === 'notifications' && <Notifications />}

          {currentTab === 'profile' && <Profile />}
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProject={(projId) => handleOpenProject(projId)}
        onSelectTask={(task) => handleOpenTask(task)}
      />

      {/* Reusable Task Details Modal */}
      {selectedTaskId && (
        <TaskDetailsModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={() => {}}
          onTaskDeleted={() => setSelectedTaskId(null)}
          members={[]}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainApp />
      </SocketProvider>
    </AuthProvider>
  );
}
