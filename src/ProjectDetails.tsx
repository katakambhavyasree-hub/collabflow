import React, { useState, useEffect, useCallback } from 'react';
import { Project, Task, ProjectMember, Activity, TaskStatus } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useSocket } from '../context/SocketContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { KanbanBoard } from '../components/KanbanBoard.tsx';
import { TaskDetailsModal } from '../components/TaskDetailsModal.tsx';
import { TaskFormModal } from '../components/TaskFormModal.tsx';
import { MemberInviteModal } from '../components/MemberInviteModal.tsx';
import { ActivityFeed } from '../components/ActivityFeed.tsx';
import { ProjectFormModal } from '../components/ProjectFormModal.tsx';
import { CreateUserModal } from '../components/CreateUserModal.tsx';
import {
  Kanban,
  Users,
  History,
  FileText,
  Plus,
  UserPlus,
  Settings,
  Trash2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

interface ProjectDetailsProps {
  projectId: number;
  onBackToProjects: () => void;
}

type TabType = 'board' | 'overview' | 'members' | 'activity';

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function ProjectDetails({ projectId, onBackToProjects }: ProjectDetailsProps) {
  const { user } = useAuth();
  const { socket, joinProject, leaveProject } = useSocket();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('board');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createTaskStatus, setCreateTaskStatus] = useState<TaskStatus>('To Do');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);

  // Load project data
  const loadProjectData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [projRes, tasksRes, membersRes, actRes] = await Promise.all([
        api.projects.getById(projectId),
        api.tasks.getByProject(projectId),
        api.projects.getMembers(projectId),
        api.activities.getByProject(projectId),
      ]);

      setProject(projRes.project);
      setTasks(tasksRes.tasks || []);
      setMembers(membersRes.members || []);
      setActivities(actRes.activities || []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load project details.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProjectData();
    joinProject(projectId);

    return () => {
      leaveProject(projectId);
    };
  }, [projectId, loadProjectData]);

  // Socket.IO Real-time event subscriptions
  useEffect(() => {
    if (!socket) return;

    // Task events with strict deduplication
    const handleTaskCreated = (newTask: Task) => {
      if (newTask.project_id === projectId) {
        setTasks((prev) => {
          if (prev.some((t) => t.id === newTask.id)) {
            return prev.map((t) => (t.id === newTask.id ? newTask : t));
          }
          return [...prev, newTask];
        });
      }
    };

    const handleTaskUpdated = (updatedTask: Task) => {
      if (updatedTask.project_id === projectId) {
        setTasks((prev) =>
          prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
        );
      }
    };

    const handleTaskMoved = (data: any) => {
      if (data.projectId === projectId || (data.task && data.task.project_id === projectId)) {
        const taskId = data.taskId || data.task?.id;
        const newStatus = data.newStatus || data.task?.status;
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );
      }
    };

    const handleTaskDeleted = (data: { taskId: number; projectId: number }) => {
      if (data.projectId === projectId) {
        setTasks((prev) => prev.filter((t) => t.id !== data.taskId));
      }
    };

    // Activity event
    const handleActivityNew = (newAct: Activity) => {
      if (newAct.project_id === projectId) {
        setActivities((prev) => {
          if (prev.some((a) => a.id === newAct.id)) return prev;
          return [newAct, ...prev];
        });
      }
    };

    // Member events
    const handleMemberChanged = () => {
      api.projects.getMembers(projectId).then((res) => {
        setMembers(res.members || []);
      });
    };

    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:moved', handleTaskMoved);
    socket.on('task:deleted', handleTaskDeleted);
    socket.on('activity:new', handleActivityNew);
    socket.on('member-added', handleMemberChanged);
    socket.on('member-removed', handleMemberChanged);

    return () => {
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:moved', handleTaskMoved);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('activity:new', handleActivityNew);
      socket.off('member-added', handleMemberChanged);
      socket.off('member-removed', handleMemberChanged);
    };
  }, [socket, projectId]);

  // Task Move (Drag & Drop) Handler
  const handleMoveTask = async (taskId: number, newStatus: TaskStatus) => {
    // 1. Optimistic local state update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      // 2. Call backend MySQL endpoint
      await api.tasks.move(taskId, {
        status: newStatus,
        position: tasks.filter((t) => t.status === newStatus).length + 1,
      });
    } catch (err) {
      console.error('Failed to move task on backend:', err);
      loadProjectData();
    }
  };

  const handleOpenAddTask = (status: TaskStatus) => {
    setCreateTaskStatus(status);
    setIsCreateTaskOpen(true);
  };

  const handleCreateTaskSubmit = async (taskData: Partial<Task>) => {
    const res = await api.tasks.create(projectId, {
      ...taskData,
      status: taskData.status || createTaskStatus,
    });
    setTasks((prev) => {
      if (prev.some((t) => t.id === res.task.id)) return prev;
      return [...prev, res.task];
    });
    setIsCreateTaskOpen(false);
  };

  const handleInviteMember = async (data: { user_id?: number; email?: string; role: any }) => {
    const res = await api.projects.addMember(projectId, data);
    setMembers(res.members || []);
    setIsInviteOpen(false);
  };

  const handleRemoveMember = async (memberUserId: number) => {
    const confirmed = window.confirm('Are you sure you want to remove this member from the project?');
    if (!confirmed) return;

    try {
      await api.projects.removeMember(projectId, memberUserId);
      setMembers((prev) => prev.filter((m) => m.user_id !== memberUserId));
    } catch (err: any) {
      alert(err?.message || 'Unable to remove member.');
    }
  };

  const handleEditProject = async (data: { name: string; description?: string; status?: any }) => {
    const res = await api.projects.update(projectId, data);
    setProject(res.project);
    setIsEditProjectOpen(false);
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete project "${project.name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await api.projects.delete(projectId);
      onBackToProjects();
    } catch (err: any) {
      alert(err?.message || 'Unable to delete project.');
    }
  };

  const isOwnerOrAdmin =
    project?.currentUserRole === 'Owner' || project?.currentUserRole === 'Admin';
  const isOwner = project?.currentUserRole === 'Owner';

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
        <p className="text-xs text-neutral-500">Loading project...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6 bg-white border border-neutral-200 rounded-lg space-y-3">
        <div className="flex items-center gap-2 text-red-600 text-sm font-semibold">
          <AlertCircle className="w-4 h-4" />
          <span>The project could not be found.</span>
        </div>
        <p className="text-xs text-neutral-500">
          {error || 'This project may have been deleted or you may not have access.'}
        </p>
        <button
          onClick={onBackToProjects}
          className="text-xs text-neutral-800 hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to projects
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Header & Meta */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-neutral-200">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToProjects}
              className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1 mr-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Projects</span>
            </button>
            <span className="text-neutral-300">/</span>
            <span className="text-xs text-neutral-500 font-mono">{project.status}</span>
          </div>

          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
            {project.name}
          </h2>

          <p className="text-xs text-neutral-600 max-w-2xl leading-relaxed">
            {project.description || 'No project description provided.'}
          </p>

          {/* Members avatar strip */}
          <div className="flex items-center gap-2 pt-1 text-xs text-neutral-500">
            <div className="flex -space-x-1.5 overflow-hidden">
              {members.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  title={`${m.name} (${m.role})`}
                  className="w-5 h-5 rounded-full bg-neutral-200 border border-white flex items-center justify-center text-[9px] font-semibold text-neutral-800 shrink-0"
                >
                  {m.name.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            <span>
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {isOwnerOrAdmin && (
            <button
              onClick={() => setIsInviteOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md border border-neutral-200 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite</span>
            </button>
          )}

          <button
            onClick={() => handleOpenAddTask('To Do')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Project Navigation Tabs: Board (default), Overview, Members, Activity */}
      <div className="flex items-center gap-1 border-b border-neutral-200 text-xs font-medium">
        <button
          onClick={() => setActiveTab('board')}
          className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 transition-colors ${
            activeTab === 'board'
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Kanban className="w-3.5 h-3.5" />
          <span>Board</span>
          <span className="font-mono text-[11px] text-neutral-400">({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 transition-colors ${
            activeTab === 'members'
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Members</span>
          <span className="font-mono text-[11px] text-neutral-400">({members.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 transition-colors ${
            activeTab === 'activity'
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Activity</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {/* 1. Board Tab (Default) */}
        {activeTab === 'board' && (
          <KanbanBoard
            tasks={tasks}
            onTaskClick={(t) => setSelectedTaskId(t.id)}
            onAddTask={handleOpenAddTask}
            onMoveTask={handleMoveTask}
          />
        )}

        {/* 2. Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 max-w-3xl">
            <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider text-xs">
                Project Summary
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs pt-2">
                <div>
                  <span className="text-neutral-400 block text-[11px]">Status</span>
                  <span className="font-semibold text-neutral-900">{project.status}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[11px]">Your Role</span>
                  <span className="font-semibold text-neutral-900">{project.currentUserRole || 'Member'}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[11px]">Created</span>
                  <span className="font-semibold text-neutral-900 font-mono text-[11px]">{formatDate(project.created_at)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100">
                <span className="text-neutral-400 block text-[11px] mb-1">Description</span>
                <p className="text-xs text-neutral-800 leading-relaxed">
                  {project.description || 'No detailed description provided.'}
                </p>
              </div>

              {isOwnerOrAdmin && (
                <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
                  <button
                    onClick={() => setIsEditProjectOpen(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 border border-neutral-200 rounded-md transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Edit Project Details</span>
                  </button>

                  {isOwner && (
                    <button
                      onClick={handleDeleteProject}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Project</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Members Tab */}
        {activeTab === 'members' && (
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Project Members</h3>
                <p className="text-xs text-neutral-500">
                  Manage team access and assigned roles for this project.
                </p>
              </div>

              {isOwnerOrAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCreateUserOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-md transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create User</span>
                  </button>
                  <button
                    onClick={() => setIsInviteOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Member</span>
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium">
                  <tr>
                    <th className="px-4 py-2.5">Name</th>
                    <th className="px-4 py-2.5">Email</th>
                    <th className="px-4 py-2.5">Role</th>
                    <th className="px-4 py-2.5">Joined</th>
                    {isOwnerOrAdmin && <th className="px-4 py-2.5 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-neutral-50/60">
                      <td className="px-4 py-3 font-medium text-neutral-900 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-800 flex items-center justify-center text-[10px] font-semibold shrink-0">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{m.name}</span>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{m.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            m.role === 'Owner'
                              ? 'bg-neutral-900 text-white'
                              : m.role === 'Admin'
                              ? 'bg-neutral-200 text-neutral-800'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {m.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-400 font-mono text-[11px]">
                        {formatDate(m.joined_at)}
                      </td>
                      {isOwnerOrAdmin && (
                        <td className="px-4 py-3 text-right">
                          {m.role !== 'Owner' && m.user_id !== user?.id && (
                            <button
                              onClick={() => handleRemoveMember(m.user_id)}
                              className="text-neutral-400 hover:text-red-600 p-1 rounded transition-colors"
                              title="Remove member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Activity Tab */}
        {activeTab === 'activity' && (
          <div className="max-w-4xl space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">Project Activity</h3>
              <p className="text-xs text-neutral-500">
                Audit trail of changes made by collaborators across tasks and settings.
              </p>
            </div>
            <ActivityFeed activities={activities} />
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      {selectedTaskId && (
        <TaskDetailsModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={(updated) => {
            setTasks((prev) =>
              prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
            );
          }}
          onTaskDeleted={(deletedId) => {
            setTasks((prev) => prev.filter((t) => t.id !== deletedId));
            setSelectedTaskId(null);
          }}
          members={members}
        />
      )}

      {/* Create Task Modal */}
      <TaskFormModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onSubmit={handleCreateTaskSubmit}
        defaultStatus={createTaskStatus}
        members={members}
        title="Create Task"
      />

      {/* Invite Member Modal */}
      <MemberInviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInvite={handleInviteMember}
        existingUserIds={members.map((m) => m.user_id)}
      />

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
        onUserCreated={(newUser) => {
          // auto refresh members dropdown
          api.projects.getMembers(projectId).then((res) => {
            setMembers(res.members || []);
          });
        }}
      />

      {/* Edit Project Modal */}
      <ProjectFormModal
        isOpen={isEditProjectOpen}
        onClose={() => setIsEditProjectOpen(false)}
        onSubmit={handleEditProject}
        initialProject={project}
        title="Edit Project"
      />
    </div>
  );
}
