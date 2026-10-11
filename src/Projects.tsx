import React, { useState, useEffect } from 'react';
import { Project } from '../types/index.ts';
import { api } from '../services/api.ts';
import { ProjectFormModal } from '../components/ProjectFormModal.tsx';
import { CreateUserModal } from '../components/CreateUserModal.tsx';
import { Plus, Users, CheckSquare, Clock, ArrowRight, UserPlus } from 'lucide-react';

interface ProjectsPageProps {
  onOpenProject: (projectId: number) => void;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getStatusStyle(status: string): string {
  switch (status) {
    case 'Active':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'Planning':
      return 'text-blue-700 bg-blue-50 border-blue-200';
    case 'On Hold':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'Completed':
      return 'text-neutral-700 bg-neutral-100 border-neutral-200';
    default:
      return 'text-neutral-700 bg-neutral-100 border-neutral-200';
  }
}

function getCardTopBorder(status: string): string {
  switch (status) {
    case 'Active':
      return 'border-t-2 border-t-emerald-500';
    case 'Planning':
      return 'border-t-2 border-t-blue-500';
    case 'On Hold':
      return 'border-t-2 border-t-amber-500';
    case 'Completed':
      return 'border-t-2 border-t-neutral-400';
    default:
      return 'border-t-2 border-t-neutral-400';
  }
}

export function Projects({ onOpenProject }: ProjectsPageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.projects.getAll();
      setProjects(res.projects || []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (data: { name: string; description?: string; status?: any }) => {
    const res = await api.projects.create(data);
    setProjects([res.project, ...projects]);
    setIsCreateOpen(false);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
            Projects
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Manage your projects and collaborate with your team.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsCreateUserOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-md transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create User</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
          <p className="text-xs text-neutral-500">Loading projects...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {error}
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center bg-white border border-dashed border-neutral-200 rounded-lg space-y-3">
          <p className="text-sm font-semibold text-neutral-800">No projects yet.</p>
          <p className="text-xs text-neutral-500">Create a project to get started with your team.</p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => onOpenProject(proj.id)}
              className={`bg-white border border-neutral-200/90 hover:border-neutral-400 ${getCardTopBorder(
                proj.status
              )} rounded-lg p-5 cursor-pointer transition-all flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-sm group`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-neutral-900 group-hover:text-neutral-950 tracking-tight leading-snug">
                    {proj.name}
                  </h3>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded border shrink-0 ${getStatusStyle(
                      proj.status
                    )}`}
                  >
                    {proj.status}
                  </span>
                </div>

                <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed mb-4">
                  {proj.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Users className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{proj.member_count || 1} Members</span>
                  </span>
                  <span aria-hidden="true" className="text-neutral-300">·</span>
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <CheckSquare className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{proj.task_count || 0} Tasks</span>
                  </span>
                </div>

                <span className="text-[11px] text-neutral-400 font-mono">
                  {formatDate(proj.updated_at || proj.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <ProjectFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateProject}
      />

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
      />
    </div>
  );
}

