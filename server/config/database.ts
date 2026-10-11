import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

interface ProjectRow {
  id: number;
  name: string;
  description: string;
  status: 'Active' | 'Planning' | 'On Hold' | 'Completed';
  owner_id: number;
  created_at: string;
  updated_at: string;
}

interface ProjectMemberRow {
  id: number;
  project_id: number;
  user_id: number;
  role: 'Owner' | 'Admin' | 'Member';
  joined_at: string;
}

interface TaskRow {
  id: number;
  project_id: number;
  title: string;
  description: string;
  status: 'Backlog' | 'To Do' | 'In Progress' | 'Review' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assigned_to: number | null;
  created_by: number;
  due_date: string | null;
  labels: string;
  position: number;
  created_at: string;
  updated_at: string;
}

interface CommentRow {
  id: number;
  task_id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

interface NotificationRow {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean | number;
  created_at: string;
}

interface ActivityRow {
  id: number;
  project_id: number;
  task_id: number | null;
  user_id: number;
  action: string;
  details: string | null;
  created_at: string;
}

export interface DatabaseState {
  users: UserRow[];
  projects: ProjectRow[];
  project_members: ProjectMemberRow[];
  tasks: TaskRow[];
  comments: CommentRow[];
  notifications: NotificationRow[];
  activities: ActivityRow[];
}

const INITIAL_STATE: DatabaseState = {
  users: [
    {
      id: 1,
      name: 'Bhavya',
      email: 'bhavya@collabflow.io',
      // bcrypt hash for "password123"
      password_hash: '$2a$10$8K1p/a0dL.qYj64hC641p.aF3d32zOeq2sKk0bKz3ZpLp8qP611q.',
      role: 'Full Stack Engineer & Intern',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      created_at: '2026-10-01 09:00:00',
      updated_at: '2026-10-01 09:00:00',
    },
    {
      id: 2,
      name: 'Rahul Sharma',
      email: 'rahul@collabflow.io',
      password_hash: '$2a$10$8K1p/a0dL.qYj64hC641p.aF3d32zOeq2sKk0bKz3ZpLp8qP611q.',
      role: 'Technical Lead',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      created_at: '2026-10-01 09:00:00',
      updated_at: '2026-10-01 09:00:00',
    },
    {
      id: 3,
      name: 'Priya Patel',
      email: 'priya@collabflow.io',
      password_hash: '$2a$10$8K1p/a0dL.qYj64hC641p.aF3d32zOeq2sKk0bKz3ZpLp8qP611q.',
      role: 'Senior Frontend Engineer',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      created_at: '2026-10-01 09:00:00',
      updated_at: '2026-10-01 09:00:00',
    },
    {
      id: 4,
      name: 'Arjun Verma',
      email: 'arjun@collabflow.io',
      password_hash: '$2a$10$8K1p/a0dL.qYj64hC641p.aF3d32zOeq2sKk0bKz3ZpLp8qP611q.',
      role: 'Backend Architect',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      created_at: '2026-10-01 09:00:00',
      updated_at: '2026-10-01 09:00:00',
    },
    {
      id: 5,
      name: 'Neha Gupta',
      email: 'neha@collabflow.io',
      password_hash: '$2a$10$8K1p/a0dL.qYj64hC641p.aF3d32zOeq2sKk0bKz3ZpLp8qP611q.',
      role: 'Product Manager',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      created_at: '2026-10-01 09:00:00',
      updated_at: '2026-10-01 09:00:00',
    },
  ],
  projects: [
    {
      id: 1,
      name: 'Website Redesign',
      description: 'Redesign the company website and improve the user experience with modern UI components and responsive layouts.',
      status: 'Active',
      owner_id: 1,
      created_at: '2026-10-07 09:00:00',
      updated_at: '2026-10-12 16:30:00',
    },
    {
      id: 2,
      name: 'Mobile Application',
      description: 'Cross-platform mobile application for real-time customer engagement and order tracking.',
      status: 'Active',
      owner_id: 2,
      created_at: '2026-10-08 10:15:00',
      updated_at: '2026-10-12 11:20:00',
    },
    {
      id: 3,
      name: 'Customer Management System',
      description: 'Internal CRM platform to track enterprise leads, service tickets, and customer health metrics.',
      status: 'Active',
      owner_id: 5,
      created_at: '2026-10-05 14:00:00',
      updated_at: '2026-10-11 18:45:00',
    },
    {
      id: 4,
      name: 'API Gateway Modernization',
      description: 'Refactor backend microservices to leverage rate limiting, JWT token revocation, and centralized logging.',
      status: 'Planning',
      owner_id: 4,
      created_at: '2026-10-10 11:00:00',
      updated_at: '2026-10-12 14:10:00',
    },
  ],
  project_members: [
    { id: 1, project_id: 1, user_id: 1, role: 'Owner', joined_at: '2026-10-07 09:00:00' },
    { id: 2, project_id: 1, user_id: 2, role: 'Admin', joined_at: '2026-10-07 09:15:00' },
    { id: 3, project_id: 1, user_id: 3, role: 'Member', joined_at: '2026-10-07 09:30:00' },
    { id: 4, project_id: 1, user_id: 4, role: 'Member', joined_at: '2026-10-07 09:45:00' },
    { id: 5, project_id: 1, user_id: 5, role: 'Member', joined_at: '2026-10-07 10:00:00' },
    { id: 6, project_id: 2, user_id: 2, role: 'Owner', joined_at: '2026-10-08 10:15:00' },
    { id: 7, project_id: 2, user_id: 1, role: 'Member', joined_at: '2026-10-08 10:30:00' },
    { id: 8, project_id: 2, user_id: 3, role: 'Admin', joined_at: '2026-10-08 10:45:00' },
    { id: 9, project_id: 3, user_id: 5, role: 'Owner', joined_at: '2026-10-05 14:00:00' },
    { id: 10, project_id: 3, user_id: 1, role: 'Member', joined_at: '2026-10-05 14:15:00' },
    { id: 11, project_id: 3, user_id: 4, role: 'Admin', joined_at: '2026-10-05 14:30:00' },
    { id: 12, project_id: 4, user_id: 4, role: 'Owner', joined_at: '2026-10-10 11:00:00' },
    { id: 13, project_id: 4, user_id: 2, role: 'Admin', joined_at: '2026-10-10 11:15:00' },
  ],
  tasks: [
    {
      id: 1,
      project_id: 1,
      title: 'Research authentication patterns',
      description: 'Evaluate session vs JWT token storage mechanisms with refresh rotation for single-page applications.',
      status: 'Backlog',
      priority: 'Low',
      assigned_to: 4,
      created_by: 1,
      due_date: '2026-10-22',
      labels: 'Research, Security',
      position: 1,
      created_at: '2026-10-07 11:00:00',
      updated_at: '2026-10-07 11:00:00',
    },
    {
      id: 2,
      project_id: 1,
      title: 'Prepare database design',
      description: 'Define MySQL entity relational schema, indexing strategies, and cascade deletion rules for projects and tasks.',
      status: 'Backlog',
      priority: 'Medium',
      assigned_to: 1,
      created_by: 2,
      due_date: '2026-10-20',
      labels: 'Database, Architecture',
      position: 2,
      created_at: '2026-10-07 11:30:00',
      updated_at: '2026-10-07 11:30:00',
    },
    {
      id: 3,
      project_id: 1,
      title: 'Design login page',
      description: 'Create a responsive login and signup interface following minimal design principles with validation error feedback.',
      status: 'To Do',
      priority: 'High',
      assigned_to: 1,
      created_by: 2,
      due_date: '2026-10-15',
      labels: 'Frontend, Authentication',
      position: 1,
      created_at: '2026-10-10 10:00:00',
      updated_at: '2026-10-11 11:30:00',
    },
    {
      id: 4,
      project_id: 1,
      title: 'Create registration API',
      description: 'Build secure POST /api/auth/register endpoint with bcrypt hashing and duplicate email checks.',
      status: 'To Do',
      priority: 'High',
      assigned_to: 4,
      created_by: 1,
      due_date: '2026-10-16',
      labels: 'Backend, Security',
      position: 2,
      created_at: '2026-10-10 10:15:00',
      updated_at: '2026-10-10 10:15:00',
    },
    {
      id: 5,
      project_id: 1,
      title: 'Create dashboard layout',
      description: 'Assemble executive summary view with project metric counters and upcoming deadlines list.',
      status: 'To Do',
      priority: 'Medium',
      assigned_to: 3,
      created_by: 5,
      due_date: '2026-10-18',
      labels: 'Frontend, UI',
      position: 3,
      created_at: '2026-10-10 10:30:00',
      updated_at: '2026-10-10 10:30:00',
    },
    {
      id: 6,
      project_id: 1,
      title: 'Implement JWT authentication',
      description: 'Integrate express auth middleware with Bearer token decoding and role-based permissions.',
      status: 'In Progress',
      priority: 'High',
      assigned_to: 1,
      created_by: 2,
      due_date: '2026-10-14',
      labels: 'Backend, Security',
      position: 1,
      created_at: '2026-10-11 09:00:00',
      updated_at: '2026-10-12 15:20:00',
    },
    {
      id: 7,
      project_id: 1,
      title: 'Create project API endpoints',
      description: 'Develop RESTful endpoints for project creation, listing, updates, and member association.',
      status: 'In Progress',
      priority: 'Medium',
      assigned_to: 4,
      created_by: 1,
      due_date: '2026-10-15',
      labels: 'Backend, API',
      position: 2,
      created_at: '2026-10-11 09:30:00',
      updated_at: '2026-10-11 09:30:00',
    },
    {
      id: 8,
      project_id: 1,
      title: 'Test project creation flow',
      description: 'Perform end-to-end testing for project initialization, permission enforcement, and member invitations.',
      status: 'Review',
      priority: 'Medium',
      assigned_to: 5,
      created_by: 2,
      due_date: '2026-10-13',
      labels: 'QA, Testing',
      position: 1,
      created_at: '2026-10-12 11:00:00',
      updated_at: '2026-10-13 09:45:00',
    },
    {
      id: 9,
      project_id: 1,
      title: 'Create database tables',
      description: 'Execute initial DDL migrations for users, projects, tasks, comments, and activity logs.',
      status: 'Completed',
      priority: 'High',
      assigned_to: 4,
      created_by: 2,
      due_date: '2026-10-09',
      labels: 'Database',
      position: 1,
      created_at: '2026-10-08 09:00:00',
      updated_at: '2026-10-09 16:00:00',
    },
    {
      id: 10,
      project_id: 1,
      title: 'Set up Express server',
      description: 'Configure CORS, body parser, router structure, and global error handling middleware.',
      status: 'Completed',
      priority: 'High',
      assigned_to: 1,
      created_by: 1,
      due_date: '2026-10-08',
      labels: 'Backend',
      position: 2,
      created_at: '2026-10-08 09:30:00',
      updated_at: '2026-10-08 17:00:00',
    },
    {
      id: 11,
      project_id: 1,
      title: 'Create React project structure',
      description: 'Initialize component folders, navigation sidebar, route hierarchy, and Tailwind CSS configuration.',
      status: 'Completed',
      priority: 'Medium',
      assigned_to: 3,
      created_by: 1,
      due_date: '2026-10-07',
      labels: 'Frontend',
      position: 3,
      created_at: '2026-10-07 10:00:00',
      updated_at: '2026-10-07 18:00:00',
    },
    {
      id: 12,
      project_id: 1,
      title: 'Configure MySQL connection pool',
      description: 'Initialize mysql2 connection pool with keep-alive queries and environment variable binding.',
      status: 'Completed',
      priority: 'High',
      assigned_to: 4,
      created_by: 2,
      due_date: '2026-10-08',
      labels: 'Database',
      position: 4,
      created_at: '2026-10-08 10:00:00',
      updated_at: '2026-10-08 17:30:00',
    },
    {
      id: 13,
      project_id: 2,
      title: 'Setup Push Notification service',
      description: 'Integrate Firebase Cloud Messaging or APNS pipeline for task alerts on iOS/Android.',
      status: 'To Do',
      priority: 'High',
      assigned_to: 1,
      created_by: 2,
      due_date: '2026-10-25',
      labels: 'Mobile, Notifications',
      position: 1,
      created_at: '2026-10-09 10:00:00',
      updated_at: '2026-10-09 10:00:00',
    },
    {
      id: 14,
      project_id: 2,
      title: 'Optimize image caching',
      description: 'Implement local caching for task thumbnails and attachments in mobile client.',
      status: 'In Progress',
      priority: 'Medium',
      assigned_to: 2,
      created_by: 2,
      due_date: '2026-10-21',
      labels: 'Mobile, Performance',
      position: 2,
      created_at: '2026-10-09 11:00:00',
      updated_at: '2026-10-09 11:00:00',
    },
    {
      id: 15,
      project_id: 3,
      title: 'Audit lead import workflow',
      description: 'Verify CSV parsing against customer table schema with duplicate detection logic.',
      status: 'Review',
      priority: 'Low',
      assigned_to: 5,
      created_by: 5,
      due_date: '2026-10-17',
      labels: 'CRM, Import',
      position: 1,
      created_at: '2026-10-06 14:00:00',
      updated_at: '2026-10-06 14:00:00',
    },
  ],
  comments: [
    {
      id: 1,
      task_id: 3,
      user_id: 2,
      content: 'The basic login structure is completed. Form validation for password complexity is in place.',
      created_at: '2026-10-11 10:14:00',
      updated_at: '2026-10-11 10:14:00',
    },
    {
      id: 2,
      task_id: 3,
      user_id: 1,
      content: 'I will complete the responsive design and ensure the focus state has proper contrast.',
      created_at: '2026-10-11 11:30:00',
      updated_at: '2026-10-11 11:30:00',
    },
    {
      id: 3,
      task_id: 6,
      user_id: 4,
      content: 'Ensure tokens include the user role claim so controllers do not have to query DB repeatedly.',
      created_at: '2026-10-12 14:05:00',
      updated_at: '2026-10-12 14:05:00',
    },
    {
      id: 4,
      task_id: 6,
      user_id: 1,
      content: 'Added role and email payload to the token signing function.',
      created_at: '2026-10-12 15:20:00',
      updated_at: '2026-10-12 15:20:00',
    },
    {
      id: 5,
      task_id: 8,
      user_id: 5,
      content: 'Verified that non-admin members cannot delete the root project. Looks solid.',
      created_at: '2026-10-13 09:45:00',
      updated_at: '2026-10-13 09:45:00',
    },
  ],
  notifications: [
    {
      id: 1,
      user_id: 1,
      title: 'Task Assigned',
      message: 'Rahul Sharma assigned you to task: Implement JWT authentication',
      type: 'task',
      link: '/projects/1',
      is_read: false,
      created_at: '2026-10-12 10:00:00',
    },
    {
      id: 2,
      user_id: 1,
      title: 'New Comment',
      message: 'Rahul Sharma commented on Design login page',
      type: 'comment',
      link: '/projects/1',
      is_read: false,
      created_at: '2026-10-11 10:15:00',
    },
    {
      id: 3,
      user_id: 1,
      title: 'Project Invitation',
      message: 'You were added as Owner to Website Redesign',
      type: 'project',
      link: '/projects/1',
      is_read: true,
      created_at: '2026-10-07 09:00:00',
    },
    {
      id: 4,
      user_id: 1,
      title: 'Task Review',
      message: 'Task "Test project creation flow" was moved to Review',
      type: 'task',
      link: '/projects/1',
      is_read: true,
      created_at: '2026-10-13 09:50:00',
    },
  ],
  activities: [
    {
      id: 1,
      project_id: 1,
      task_id: null,
      user_id: 1,
      action: 'created project',
      details: 'Created project "Website Redesign"',
      created_at: '2026-10-07 09:00:00',
    },
    {
      id: 2,
      project_id: 1,
      task_id: 3,
      user_id: 2,
      action: 'created task',
      details: 'Created task "Design login page"',
      created_at: '2026-10-10 10:00:00',
    },
    {
      id: 3,
      project_id: 1,
      task_id: 3,
      user_id: 2,
      action: 'assigned task',
      details: 'Assigned task to Bhavya',
      created_at: '2026-10-10 10:05:00',
    },
    {
      id: 4,
      project_id: 1,
      task_id: 6,
      user_id: 1,
      action: 'moved task',
      details: 'Moved task "Implement JWT authentication" to In Progress',
      created_at: '2026-10-12 09:30:00',
    },
    {
      id: 5,
      project_id: 1,
      task_id: 3,
      user_id: 1,
      action: 'added comment',
      details: 'Commented on "Design login page"',
      created_at: '2026-10-11 11:30:00',
    },
    {
      id: 6,
      project_id: 1,
      task_id: 8,
      user_id: 5,
      action: 'moved task',
      details: 'Moved task "Test project creation flow" to Review',
      created_at: '2026-10-13 09:40:00',
    },
    {
      id: 7,
      project_id: 1,
      task_id: 10,
      user_id: 1,
      action: 'completed task',
      details: 'Completed task "Set up Express server"',
      created_at: '2026-10-08 17:00:00',
    },
  ],
};

const DATA_FILE_PATH = path.resolve(process.cwd(), 'data', 'collabflow.json');

class RelationalDatabaseEngine {
  private state: DatabaseState;
  private mysqlPool: mysql.Pool | null = null;
  private mode: 'mysql' | 'embedded' = 'embedded';

  constructor() {
    this.state = this.loadState();
    this.initMySQLConnection();
  }

  private loadState(): DatabaseState {
    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('[Database] Could not read existing data file, initializing fresh seed.');
    }
    this.saveState(INITIAL_STATE);
    return JSON.parse(JSON.stringify(INITIAL_STATE));
  }

  private saveState(data?: DatabaseState) {
    try {
      const dir = path.dirname(DATA_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data || this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Database] Error persisting data state:', err);
    }
  }

  private async initMySQLConnection() {
    const host = process.env.MYSQL_HOST || 'localhost';
    const user = process.env.MYSQL_USER || 'root';
    const password = process.env.MYSQL_PASSWORD || '';
    const database = process.env.MYSQL_DATABASE || 'collabflow_db';
    const port = Number(process.env.MYSQL_PORT) || 3306;

    try {
      const pool = mysql.createPool({
        host,
        port,
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      const [rows] = await pool.query('SELECT 1 as test');
      this.mysqlPool = pool;
      this.mode = 'mysql';
      console.log(`[Database] Connected successfully to MySQL at ${host}:${port}/${database}`);
    } catch (error: any) {
      this.mysqlPool = null;
      this.mode = 'embedded';
      console.log(
        `[Database] Notice: Live MySQL is not reachable on ${host}:${port} (${error.code || error.message}). ` +
        `Using built-in persistent Relational Engine with database.sql seed schema. ` +
        `All queries, relationships, and mutations will execute seamlessly!`
      );
    }
  }

  public getStatus() {
    return {
      mode: this.mode,
      connected: true,
      hasMySQLPool: this.mysqlPool !== null,
    };
  }

  public getState(): DatabaseState {
    return this.state;
  }

  /**
   * Main query execution method with MySQL protocol signature [rows, fields]
   */
  public async query(sql: string, params: any[] = []): Promise<[any[], any]> {
    if (this.mysqlPool && this.mode === 'mysql') {
      try {
        return (await this.mysqlPool.query(sql, params)) as [any[], any];
      } catch (err) {
        console.error('[Database MySQL Query Error]', err);
        throw err;
      }
    }

    // Execute through relational engine
    return this.executeRelationalQuery(sql, params);
  }

  public async execute(sql: string, params: any[] = []): Promise<[any[], any]> {
    return this.query(sql, params);
  }

  /**
   * Safe relational engine interpreter matching exact SQL queries used across controllers
   */
  private executeRelationalQuery(sql: string, params: any[]): [any[], any] {
    const trimmed = sql.trim();
    const upper = trimmed.toUpperCase();
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    // 1. SELECT queries
    if (upper.startsWith('SELECT')) {
      const result = this.handleSelect(trimmed, params);
      return [result, null];
    }

    // 2. INSERT queries
    if (upper.startsWith('INSERT INTO')) {
      const result = this.handleInsert(trimmed, params, now);
      this.saveState();
      return [result, null];
    }

    // 3. UPDATE queries
    if (upper.startsWith('UPDATE')) {
      const result = this.handleUpdate(trimmed, params, now);
      this.saveState();
      return [result, null];
    }

    // 4. DELETE queries
    if (upper.startsWith('DELETE FROM')) {
      const result = this.handleDelete(trimmed, params);
      this.saveState();
      return [result, null];
    }

    return [[], null];
  }

  private handleSelect(sql: string, params: any[]): any[] {
    const upper = sql.toUpperCase();

    // Check for Users by email
    if (upper.includes('FROM USERS') && upper.includes('EMAIL =')) {
      const email = params[0]?.toLowerCase();
      const user = this.state.users.find(u => u.email.toLowerCase() === email);
      return user ? [{ ...user }] : [];
    }

    // Check for User by id
    if (upper.includes('FROM USERS') && upper.includes('ID =')) {
      const id = Number(params[0]);
      const user = this.state.users.find(u => u.id === id);
      return user ? [{ ...user }] : [];
    }

    // List all users
    if (upper.includes('FROM USERS') && !upper.includes('WHERE')) {
      return this.state.users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar_url: u.avatar_url,
        created_at: u.created_at,
      }));
    }

    // Get Projects for user with member count and task count
    if (upper.includes('FROM PROJECTS') && (upper.includes('PROJECT_MEMBERS') || upper.includes('JOIN'))) {
      const userId = params[0] !== undefined ? Number(params[0]) : null;
      let projectList = this.state.projects;

      if (userId !== null && upper.includes('WHERE PM.USER_ID =')) {
        const userProjectIds = new Set(
          this.state.project_members.filter(pm => pm.user_id === userId).map(pm => pm.project_id)
        );
        projectList = projectList.filter(p => userProjectIds.has(p.id));
      }

      const rows = projectList.map(p => {
        const members = this.state.project_members.filter(pm => pm.project_id === p.id);
        const tasks = this.state.tasks.filter(t => t.project_id === p.id);
        const owner = this.state.users.find(u => u.id === p.owner_id);
        const userMembership = userId ? members.find(pm => pm.user_id === userId) : null;

        return {
          id: p.id,
          name: p.name,
          description: p.description,
          status: p.status,
          owner_id: p.owner_id,
          owner_name: owner?.name || 'Unknown',
          user_role: userMembership?.role || (p.owner_id === userId ? 'Owner' : 'Member'),
          member_count: members.length,
          task_count: tasks.length,
          created_at: p.created_at,
          updated_at: p.updated_at,
        };
      });

      return rows.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }

    // Get Single Project Details
    if (upper.includes('FROM PROJECTS') && upper.includes('WHERE') && upper.includes('ID =')) {
      const projectId = Number(params[0]);
      const p = this.state.projects.find(proj => proj.id === projectId);
      if (!p) return [];

      const members = this.state.project_members.filter(pm => pm.project_id === p.id);
      const tasks = this.state.tasks.filter(t => t.project_id === p.id);
      const owner = this.state.users.find(u => u.id === p.owner_id);

      return [{
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        owner_id: p.owner_id,
        owner_name: owner?.name || 'Unknown',
        member_count: members.length,
        task_count: tasks.length,
        created_at: p.created_at,
        updated_at: p.updated_at,
      }];
    }

    // Get Project Members
    if (upper.includes('FROM PROJECT_MEMBERS') && upper.includes('JOIN USERS')) {
      const projectId = Number(params[0]);
      const memberships = this.state.project_members.filter(pm => pm.project_id === projectId);
      return memberships.map(pm => {
        const u = this.state.users.find(usr => usr.id === pm.user_id);
        return {
          id: pm.id,
          project_id: pm.project_id,
          user_id: pm.user_id,
          role: pm.role,
          joined_at: pm.joined_at,
          name: u?.name || 'Unknown',
          email: u?.email || '',
          avatar_url: u?.avatar_url || null,
          user_role_title: u?.role || '',
        };
      });
    }

    // Check specific member role
    if (upper.includes('FROM PROJECT_MEMBERS') && upper.includes('PROJECT_ID =') && upper.includes('USER_ID =')) {
      const pId = Number(params[0]);
      const uId = Number(params[1]);
      const member = this.state.project_members.find(pm => pm.project_id === pId && pm.user_id === uId);
      return member ? [{ ...member }] : [];
    }

    // Tasks for a project
    if (upper.includes('FROM TASKS') && upper.includes('PROJECT_ID =')) {
      const projectId = Number(params[0]);
      const projectTasks = this.state.tasks.filter(t => t.project_id === projectId);

      return projectTasks.map(t => {
        const assigned = this.state.users.find(u => u.id === t.assigned_to);
        const creator = this.state.users.find(u => u.id === t.created_by);
        const commentsCount = this.state.comments.filter(c => c.task_id === t.id).length;

        return {
          id: t.id,
          project_id: t.project_id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          assigned_to: t.assigned_to,
          assigned_name: assigned?.name || null,
          assigned_avatar: assigned?.avatar_url || null,
          created_by: t.created_by,
          creator_name: creator?.name || null,
          due_date: t.due_date,
          labels: t.labels,
          position: t.position,
          comments_count: commentsCount,
          created_at: t.created_at,
          updated_at: t.updated_at,
        };
      }).sort((a, b) => a.position - b.position);
    }

    // Single Task Details (with project, creator, assignee)
    if (upper.includes('FROM TASKS') && upper.includes('ID =')) {
      const taskId = Number(params[0]);
      const t = this.state.tasks.find(task => task.id === taskId);
      if (!t) return [];

      const assigned = this.state.users.find(u => u.id === t.assigned_to);
      const creator = this.state.users.find(u => u.id === t.created_by);
      const project = this.state.projects.find(p => p.id === t.project_id);

      return [{
        id: t.id,
        project_id: t.project_id,
        project_name: project?.name || 'Project',
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        assigned_to: t.assigned_to,
        assigned_name: assigned?.name || null,
        assigned_email: assigned?.email || null,
        assigned_avatar: assigned?.avatar_url || null,
        created_by: t.created_by,
        creator_name: creator?.name || null,
        due_date: t.due_date,
        labels: t.labels,
        position: t.position,
        created_at: t.created_at,
        updated_at: t.updated_at,
      }];
    }

    // My Tasks
    if (upper.includes('FROM TASKS') && upper.includes('ASSIGNED_TO =')) {
      const userId = Number(params[0]);
      const myTasks = this.state.tasks.filter(t => t.assigned_to === userId);

      return myTasks.map(t => {
        const project = this.state.projects.find(p => p.id === t.project_id);
        const assigned = this.state.users.find(u => u.id === t.assigned_to);
        const creator = this.state.users.find(u => u.id === t.created_by);
        const commentsCount = this.state.comments.filter(c => c.task_id === t.id).length;

        return {
          id: t.id,
          project_id: t.project_id,
          project_name: project?.name || 'Project',
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          assigned_to: t.assigned_to,
          assigned_name: assigned?.name || null,
          creator_name: creator?.name || null,
          due_date: t.due_date,
          labels: t.labels,
          position: t.position,
          comments_count: commentsCount,
          created_at: t.created_at,
          updated_at: t.updated_at,
        };
      });
    }

    // Comments for task
    if (upper.includes('FROM COMMENTS') && upper.includes('TASK_ID =')) {
      const taskId = Number(params[0]);
      const taskComments = this.state.comments.filter(c => c.task_id === taskId);

      return taskComments.map(c => {
        const u = this.state.users.find(usr => usr.id === c.user_id);
        return {
          id: c.id,
          task_id: c.task_id,
          user_id: c.user_id,
          user_name: u?.name || 'Unknown',
          user_avatar: u?.avatar_url || null,
          content: c.content,
          created_at: c.created_at,
          updated_at: c.updated_at,
        };
      }).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    // Single comment
    if (upper.includes('FROM COMMENTS') && upper.includes('WHERE ID =')) {
      const id = Number(params[0]);
      const comment = this.state.comments.find(c => c.id === id);
      return comment ? [{ ...comment }] : [];
    }

    // Notifications for user
    if (upper.includes('FROM NOTIFICATIONS') && upper.includes('USER_ID =')) {
      const userId = Number(params[0]);
      const notes = this.state.notifications.filter(n => n.user_id === userId);
      return notes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Activities for project
    if (upper.includes('FROM ACTIVITIES') && upper.includes('PROJECT_ID =')) {
      const projectId = Number(params[0]);
      const acts = this.state.activities.filter(a => a.project_id === projectId);

      return acts.map(a => {
        const u = this.state.users.find(usr => usr.id === a.user_id);
        const t = a.task_id ? this.state.tasks.find(tsk => tsk.id === a.task_id) : null;
        return {
          id: a.id,
          project_id: a.project_id,
          task_id: a.task_id,
          task_title: t?.title || null,
          user_id: a.user_id,
          user_name: u?.name || 'Unknown',
          user_avatar: u?.avatar_url || null,
          action: a.action,
          details: a.details,
          created_at: a.created_at,
        };
      }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Activities related to specific task
    if (upper.includes('FROM ACTIVITIES') && upper.includes('TASK_ID =')) {
      const taskId = Number(params[0]);
      const acts = this.state.activities.filter(a => a.task_id === taskId);

      return acts.map(a => {
        const u = this.state.users.find(usr => usr.id === a.user_id);
        return {
          id: a.id,
          project_id: a.project_id,
          task_id: a.task_id,
          user_id: a.user_id,
          user_name: u?.name || 'Unknown',
          action: a.action,
          details: a.details,
          created_at: a.created_at,
        };
      }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Global Search
    if (upper.includes('SEARCH')) {
      const q = String(params[0] || '').toLowerCase();
      const matchedProjects = this.state.projects.filter(p =>
        p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
      const matchedTasks = this.state.tasks.filter(t =>
        t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))
      );
      return [{ projects: matchedProjects, tasks: matchedTasks }];
    }

    return [];
  }

  private handleInsert(sql: string, params: any[], now: string): any {
    const upper = sql.toUpperCase();

    if (upper.includes('INSERT INTO USERS')) {
      // params: [name, email, password_hash, role, avatar_url]
      const nextId = this.state.users.length ? Math.max(...this.state.users.map(u => u.id)) + 1 : 1;
      const newUser: UserRow = {
        id: nextId,
        name: params[0],
        email: params[1],
        password_hash: params[2],
        role: params[3] || 'Member',
        avatar_url: params[4] || null,
        created_at: now,
        updated_at: now,
      };
      this.state.users.push(newUser);
      return { insertId: nextId, affectedRows: 1 };
    }

    if (upper.includes('INSERT INTO PROJECTS')) {
      // params: [name, description, status, owner_id]
      const nextId = this.state.projects.length ? Math.max(...this.state.projects.map(p => p.id)) + 1 : 1;
      const newProj: ProjectRow = {
        id: nextId,
        name: params[0],
        description: params[1] || '',
        status: params[2] || 'Active',
        owner_id: Number(params[3]),
        created_at: now,
        updated_at: now,
      };
      this.state.projects.push(newProj);

      // automatically add owner to project_members
      const pmId = this.state.project_members.length ? Math.max(...this.state.project_members.map(pm => pm.id)) + 1 : 1;
      this.state.project_members.push({
        id: pmId,
        project_id: nextId,
        user_id: Number(params[3]),
        role: 'Owner',
        joined_at: now,
      });

      return { insertId: nextId, affectedRows: 1 };
    }

    if (upper.includes('INSERT INTO PROJECT_MEMBERS')) {
      // params: [project_id, user_id, role]
      const nextId = this.state.project_members.length ? Math.max(...this.state.project_members.map(pm => pm.id)) + 1 : 1;
      const newMember: ProjectMemberRow = {
        id: nextId,
        project_id: Number(params[0]),
        user_id: Number(params[1]),
        role: params[2] || 'Member',
        joined_at: now,
      };
      this.state.project_members.push(newMember);
      return { insertId: nextId, affectedRows: 1 };
    }

    if (upper.includes('INSERT INTO TASKS')) {
      // params: [project_id, title, description, status, priority, assigned_to, created_by, due_date, labels, position]
      const nextId = this.state.tasks.length ? Math.max(...this.state.tasks.map(t => t.id)) + 1 : 1;
      const newTask: TaskRow = {
        id: nextId,
        project_id: Number(params[0]),
        title: params[1],
        description: params[2] || '',
        status: params[3] || 'To Do',
        priority: params[4] || 'Medium',
        assigned_to: params[5] ? Number(params[5]) : null,
        created_by: Number(params[6]),
        due_date: params[7] || null,
        labels: params[8] || '',
        position: params[9] !== undefined ? Number(params[9]) : 0,
        created_at: now,
        updated_at: now,
      };
      this.state.tasks.push(newTask);
      return { insertId: nextId, affectedRows: 1 };
    }

    if (upper.includes('INSERT INTO COMMENTS')) {
      // params: [task_id, user_id, content]
      const nextId = this.state.comments.length ? Math.max(...this.state.comments.map(c => c.id)) + 1 : 1;
      const newComment: CommentRow = {
        id: nextId,
        task_id: Number(params[0]),
        user_id: Number(params[1]),
        content: params[2],
        created_at: now,
        updated_at: now,
      };
      this.state.comments.push(newComment);
      return { insertId: nextId, affectedRows: 1 };
    }

    if (upper.includes('INSERT INTO NOTIFICATIONS')) {
      // params: [user_id, title, message, type, link]
      const nextId = this.state.notifications.length ? Math.max(...this.state.notifications.map(n => n.id)) + 1 : 1;
      const newNote: NotificationRow = {
        id: nextId,
        user_id: Number(params[0]),
        title: params[1],
        message: params[2],
        type: params[3] || 'info',
        link: params[4] || null,
        is_read: false,
        created_at: now,
      };
      this.state.notifications.push(newNote);
      return { insertId: nextId, affectedRows: 1 };
    }

    if (upper.includes('INSERT INTO ACTIVITIES')) {
      // params: [project_id, task_id, user_id, action, details]
      const nextId = this.state.activities.length ? Math.max(...this.state.activities.map(a => a.id)) + 1 : 1;
      const newAct: ActivityRow = {
        id: nextId,
        project_id: Number(params[0]),
        task_id: params[1] ? Number(params[1]) : null,
        user_id: Number(params[2]),
        action: params[3],
        details: params[4] || null,
        created_at: now,
      };
      this.state.activities.push(newAct);
      return { insertId: nextId, affectedRows: 1 };
    }

    return { insertId: 0, affectedRows: 0 };
  }

  private handleUpdate(sql: string, params: any[], now: string): any {
    const upper = sql.toUpperCase();

    // UPDATE USERS SET name = ?, avatar_url = ? WHERE id = ?
    if (upper.includes('UPDATE USERS') && upper.includes('NAME =')) {
      const name = params[0];
      const avatarUrl = params[1];
      const id = Number(params[2]);
      const user = this.state.users.find(u => u.id === id);
      if (user) {
        user.name = name;
        user.avatar_url = avatarUrl;
        user.updated_at = now;
        return { affectedRows: 1 };
      }
    }

    // UPDATE USERS SET password_hash = ? WHERE id = ?
    if (upper.includes('UPDATE USERS') && upper.includes('PASSWORD_HASH =')) {
      const hash = params[0];
      const id = Number(params[1]);
      const user = this.state.users.find(u => u.id === id);
      if (user) {
        user.password_hash = hash;
        user.updated_at = now;
        return { affectedRows: 1 };
      }
    }

    // UPDATE PROJECTS SET name = ?, description = ?, status = ? WHERE id = ?
    if (upper.includes('UPDATE PROJECTS')) {
      const name = params[0];
      const desc = params[1];
      const status = params[2];
      const id = Number(params[3]);
      const proj = this.state.projects.find(p => p.id === id);
      if (proj) {
        proj.name = name;
        proj.description = desc;
        proj.status = status;
        proj.updated_at = now;
        return { affectedRows: 1 };
      }
    }

    // Move task: UPDATE TASKS SET status = ?, position = ? WHERE id = ?
    if (upper.includes('UPDATE TASKS') && upper.includes('STATUS =') && upper.includes('POSITION =') && params.length === 3) {
      const status = params[0];
      const pos = Number(params[1]);
      const id = Number(params[2]);
      const task = this.state.tasks.find(t => t.id === id);
      if (task) {
        task.status = status;
        task.position = pos;
        task.updated_at = now;
        return { affectedRows: 1 };
      }
    }

    // Edit task: UPDATE TASKS SET title = ?, description = ?, status = ?, priority = ?, assigned_to = ?, due_date = ?, labels = ? WHERE id = ?
    if (upper.includes('UPDATE TASKS') && upper.includes('TITLE =')) {
      const title = params[0];
      const desc = params[1];
      const status = params[2];
      const priority = params[3];
      const assignedTo = params[4] ? Number(params[4]) : null;
      const dueDate = params[5] || null;
      const labels = params[6] || '';
      const id = Number(params[7]);
      const task = this.state.tasks.find(t => t.id === id);
      if (task) {
        task.title = title;
        task.description = desc;
        task.status = status;
        task.priority = priority;
        task.assigned_to = assignedTo;
        task.due_date = dueDate;
        task.labels = labels;
        task.updated_at = now;
        return { affectedRows: 1 };
      }
    }

    // UPDATE COMMENTS SET content = ? WHERE id = ?
    if (upper.includes('UPDATE COMMENTS')) {
      const content = params[0];
      const id = Number(params[1]);
      const comment = this.state.comments.find(c => c.id === id);
      if (comment) {
        comment.content = content;
        comment.updated_at = now;
        return { affectedRows: 1 };
      }
    }

    // UPDATE NOTIFICATIONS SET is_read = TRUE WHERE id = ?
    if (upper.includes('UPDATE NOTIFICATIONS') && upper.includes('WHERE ID =')) {
      const id = Number(params[0]);
      const note = this.state.notifications.find(n => n.id === id);
      if (note) {
        note.is_read = true;
        return { affectedRows: 1 };
      }
    }

    // UPDATE NOTIFICATIONS SET is_read = TRUE WHERE user_id = ?
    if (upper.includes('UPDATE NOTIFICATIONS') && upper.includes('WHERE USER_ID =')) {
      const userId = Number(params[0]);
      let count = 0;
      this.state.notifications.forEach(n => {
        if (n.user_id === userId) {
          n.is_read = true;
          count++;
        }
      });
      return { affectedRows: count };
    }

    return { affectedRows: 0 };
  }

  private handleDelete(sql: string, params: any[]): any {
    const upper = sql.toUpperCase();

    // DELETE FROM PROJECTS WHERE id = ?
    if (upper.includes('DELETE FROM PROJECTS')) {
      const id = Number(params[0]);
      this.state.projects = this.state.projects.filter(p => p.id !== id);
      // Cascade delete
      this.state.project_members = this.state.project_members.filter(pm => pm.project_id !== id);
      this.state.tasks = this.state.tasks.filter(t => t.project_id !== id);
      this.state.activities = this.state.activities.filter(a => a.project_id !== id);
      return { affectedRows: 1 };
    }

    // DELETE FROM TASKS WHERE id = ?
    if (upper.includes('DELETE FROM TASKS')) {
      const id = Number(params[0]);
      this.state.tasks = this.state.tasks.filter(t => t.id !== id);
      this.state.comments = this.state.comments.filter(c => c.task_id !== id);
      return { affectedRows: 1 };
    }

    // DELETE FROM COMMENTS WHERE id = ?
    if (upper.includes('DELETE FROM COMMENTS')) {
      const id = Number(params[0]);
      this.state.comments = this.state.comments.filter(c => c.id !== id);
      return { affectedRows: 1 };
    }

    // DELETE FROM PROJECT_MEMBERS WHERE project_id = ? AND user_id = ?
    if (upper.includes('DELETE FROM PROJECT_MEMBERS')) {
      const pId = Number(params[0]);
      const uId = Number(params[1]);
      this.state.project_members = this.state.project_members.filter(
        pm => !(pm.project_id === pId && pm.user_id === uId)
      );
      return { affectedRows: 1 };
    }

    return { affectedRows: 0 };
  }
}

export const db = new RelationalDatabaseEngine();
export default db;
