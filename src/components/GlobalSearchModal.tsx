import React, { useState, useEffect, useRef } from 'react';
import { Project, Task } from '../types/index.ts';
import { api } from '../services/api.ts';
import { Search, X, FolderKanban, CheckSquare, ArrowRight } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (projectId: number) => void;
  onSelectTask: (task: Task) => void;
}

export function GlobalSearchModal({
  isOpen,
  onClose,
  onSelectProject,
  onSelectTask,
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setProjects([]);
      setTasks([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setProjects([]);
      setTasks([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.dashboard.search(query.trim());
        setProjects(res.projects || []);
        setTasks(res.tasks || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-neutral-900/40">
      <div className="bg-white border border-neutral-200 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search input header */}
        <div className="p-3.5 border-b border-neutral-200 flex items-center gap-3">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects or tasks..."
            className="flex-1 text-sm bg-transparent border-none outline-none text-neutral-900 placeholder:text-neutral-400"
          />
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="overflow-y-auto p-3 space-y-4 flex-1">
          {loading && (
            <p className="text-xs text-neutral-400 py-4 text-center">Searching...</p>
          )}

          {!loading && query && projects.length === 0 && tasks.length === 0 && (
            <p className="text-xs text-neutral-400 py-6 text-center">
              No matching projects or tasks found for "{query}".
            </p>
          )}

          {!loading && !query && (
            <p className="text-xs text-neutral-400 py-6 text-center">
              Type to search projects and tasks across your workspace.
            </p>
          )}

          {/* Projects results */}
          {projects.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-2 block mb-1">
                Projects ({projects.length})
              </span>
              <div className="space-y-1">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectProject(p.id);
                      onClose();
                    }}
                    className="w-full text-left p-2 rounded-md hover:bg-neutral-100 flex items-center justify-between text-xs text-neutral-800 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FolderKanban className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <div className="truncate">
                        <span className="font-semibold text-neutral-900">{p.name}</span>
                        {p.description && (
                          <span className="text-neutral-500 ml-1.5 truncate hidden sm:inline">
                            - {p.description}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tasks results */}
          {tasks.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-2 block mb-1">
                Tasks ({tasks.length})
              </span>
              <div className="space-y-1">
                {tasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onSelectTask(t);
                      onClose();
                    }}
                    className="w-full text-left p-2 rounded-md hover:bg-neutral-100 flex items-center justify-between text-xs text-neutral-800 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CheckSquare className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <div className="truncate">
                        <span className="font-semibold text-neutral-900">{t.title}</span>
                        <span className="text-neutral-500 ml-1.5 font-mono text-[11px]">
                          ({t.status})
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-neutral-500 font-medium px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200 shrink-0 ml-2">
                      {t.priority}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
