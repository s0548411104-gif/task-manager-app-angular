export interface User {
  id?: number; 
  name: string; 
  email: string;
  password?: string; 
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Team {
  id: string;
  name: string;
  members_count?: number;
  ownerId?: number;
  members?: User[]; // שינוי מ-any ל-User[]
}

export interface Project {
  id: string; // שינוי ל-string כדי להתאים ל-Service
  name: string;
  description?: string;
  team_id: string; // שינוי ל-string
  status?: string;
}

export interface Task {
  id: string; // שינוי ל-string - זה יפתור את השגיאה ב-TaskBoard
  title: string;
  description: string;
  projectId: string; // שינוי ל-string
  status: 'todo' | 'in_progress' | 'done'; 
  
  priority?: 'low' | 'normal' | 'high'; 
  dueDate?: string;
  assigneeId?: number;
  orderIndex?: number;
}

export interface TaskComment {
  id: number;
  taskId: string; // שונה מ-task_id ל-taskId
  user_id: number;
  body: string;       
  created_at: string; 
  author_name: string; 
}