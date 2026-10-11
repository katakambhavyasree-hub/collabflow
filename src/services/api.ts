
import {
  User,
  Project,
  ProjectMember,
  Task,
  Comment,
  NotificationItem,
  Activity,
  DashboardStats,
} from '../types/index.ts';

const TOKEN_KEY = 'collabflow_token';

const API_URL = (
  import.meta.env.VITE_API_URL || ''
).replace(/\/+$/, '');

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] =
      `Bearer ${token}`;
  }

  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      'Unable to connect to the server. Please check your backend URL and internet connection.'
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      data?.error ||
      data?.message ||
      response.statusText ||
      'Request failed';

    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Authentication
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),

    register: (userData: {
      name: string;
      email: string;
      password: string;
      role?: string;
    }) =>
      request<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),

    me: () => request<{ user: User }>('/api/auth/me'),
  },

  // Users
  users: {
    create: (data: {
      name: string;
      email: string;
      password?: string;
      role?: string;
      avatar_url?: string;
    }) =>
      request<{ message: string; user: User }>('/api/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateProfile: (data: {
      name: string;
      avatar_url?: string | null;
    }) =>
      request<{ message: string; user: User }>('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    updatePassword: (data: {
      currentPassword: string;
      newPassword: string;
    }) =>
      request<{ message: string }>('/api/users/me/password', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    getAll: () =>
      request<{ users: User[] }>('/api/users'),
  },

  // Projects
  projects: {
    getAll: () =>
      request<{ projects: Project[] }>('/api/projects'),

    getById: (id: number) =>
      request<{ project: Project }>(`/api/projects/${id}`),

    create: (data: {
      name: string;
      description?: string;
      status?: string;
    }) =>
      request<{ message: string; project: Project }>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (
      id: number,
      data: {
        name: string;
        description?: string;
        status?: string;
      }
    ) =>
      request<{ message: string; project: Project }>(
        `/api/projects/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      ),

    delete: (id: number) =>
      request<{ message: string }>(`/api/projects/${id}`, {
        method: 'DELETE',
      }),

    getMembers: (id: number) =>
      request<{ members: ProjectMember[] }>(
        `/api/projects/${id}/members`
      ),

    addMember: (
      id: number,
      data: { user_id?: number; email?: string; role: string }
    ) =>
      request<{ message: string; members: ProjectMember[] }>(
        `/api/projects/${id}/members`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),

    removeMember: (id: number, userId: number) =>
      request<{ message: string }>(
        `/api/projects/${id}/members/${userId}`,
        {
          method: 'DELETE',
        }
      ),
  },

  // Tasks
  tasks: {
    getByProject: (projectId: number) =>
      request<{ tasks: Task[] }>(
        `/api/projects/${projectId}/tasks`
      ),

    getById: (taskId: number) =>
      request<{ task: Task }>(`/api/tasks/${taskId}`),

    create: (projectId: number, data: Partial<Task>) =>
      request<{ message: string; task: Task }>(
        `/api/projects/${projectId}/tasks`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),

    update: (taskId: number, data: Partial<Task>) =>
      request<{ message: string; task: Task }>(
        `/api/tasks/${taskId}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      ),

    move: (
      taskId: number,
      data: { status: string; position: number }
    ) =>
      request<{ message: string; task: Task }>(
        `/api/tasks/${taskId}/move`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        }
      ),

    delete: (taskId: number) =>
      request<{ message: string }>(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      }),

    getMyTasks: () =>
      request<{ tasks: Task[] }>('/api/tasks/my'),
  },

  // Comments
  comments: {
    getByTask: (taskId: number) =>
      request<{ comments: Comment[] }>(
        `/api/tasks/${taskId}/comments`
      ),

    add: (taskId: number, content: string) =>
      request<{ message: string; comment: Comment }>(
        `/api/tasks/${taskId}/comments`,
        {
          method: 'POST',
          body: JSON.stringify({ content }),
        }
      ),

    update: (commentId: number, content: string) =>
      request<{ message: string; comment: Comment }>(
        `/api/comments/${commentId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ content }),
        }
      ),

    delete: (commentId: number) =>
      request<{ message: string }>(
        `/api/comments/${commentId}`,
        {
          method: 'DELETE',
        }
      ),
  },

  // Notifications
  notifications: {
    getAll: () =>
      request<{ notifications: NotificationItem[] }>(
        '/api/notifications'
      ),

    markAsRead: (id: number) =>
      request<{ message: string }>(
        `/api/notifications/${id}/read`,
        {
          method: 'PUT',
        }
      ),

    markAllAsRead: () =>
      request<{ message: string }>('/api/notifications/read-all', {
        method: 'PUT',
      }),
  },

  // Activities
  activities: {
    getByProject: (projectId: number) =>
      request<{ activities: Activity[] }>(
        `/api/projects/${projectId}/activities`
      ),
  },

  // Dashboard and Search
  dashboard: {
    getOverview: () =>
      request<{
        userName: string;
        stats: DashboardStats;
        recentProjects: Project[];
        upcomingTasks: Task[];
        recentActivities: Activity[];
      }>('/api/dashboard/overview'),

    search: (query: string) =>
      request<{ projects: Project[]; tasks: Task[] }>(
        `/api/search?q=${encodeURIComponent(query)}`
      ),
  },
};
