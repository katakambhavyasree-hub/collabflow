export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar_url?: string | null;
  created_at?: string;
}

export type TaskStatus = 'Backlog' | 'To Do' | 'In Progress' | 'Review' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type ProjectStatus = 'Active' | 'Planning' | 'On Hold' | 'Completed';
export type MemberRole = 'Owner' | 'Admin' | 'Member';

export interface Project {
  id: number;
  name: string;
  description: string;
  status: ProjectStatus;
  owner_id: number;
  owner_name?: string;
  user_role?: MemberRole;
  currentUserRole?: MemberRole;
  member_count?: number;
  task_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: number;
  project_id: number;
  user_id: number;
  role: MemberRole;
  joined_at: string;
  name: string;
  email: string;
  avatar_url: string | null;
  user_role_title?: string;
}

export interface Task {
  id: number;
  project_id: number;
  project_name?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: number | null;
  assigned_name: string | null;
  assigned_email?: string | null;
  assigned_avatar: string | null;
  created_by: number;
  creator_name: string | null;
  due_date: string | null;
  labels: string;
  position: number;
  comments_count?: number;
  comments?: Comment[];
  activities?: Activity[];
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  task_id: number;
  user_id: number;
  user_name: string;
  user_avatar: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean | number;
  created_at: string;
}

export interface Activity {
  id: number;
  project_id: number;
  task_id: number | null;
  task_title?: string | null;
  user_id: number;
  user_name: string;
  user_avatar: string | null;
  action: string;
  details: string | null;
  created_at: string;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  myTasks: number;
  completedTasks: number;
}
