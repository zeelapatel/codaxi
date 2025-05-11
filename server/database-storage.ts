import { type User, type InsertUser, type Project, type InsertProject, type Document, type InsertDocument } from "@shared/schema";
import { pool, query } from "./db";
import { IStorage } from "./storage";

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // Temporary storage for ZIP uploads
  private tempProjects: Map<string, any>;
  private tempDocuments: Map<string, any>;

  constructor() {
    this.tempProjects = new Map();
    this.tempDocuments = new Map();
  }

  async getUser(id: number): Promise<User | undefined> {
    const users = await query('SELECT * FROM users WHERE id = $1', [id]);
    return users[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await query('SELECT * FROM users WHERE username = $1', [username]);
    return users[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
      [insertUser.username, insertUser.password]
    );
    return result[0];
  }

  async getAllProjects(): Promise<Project[]> {
    return await query('SELECT * FROM projects');
  }

  async getProject(id: number): Promise<Project | undefined> {
    const projects = await query('SELECT * FROM projects WHERE id = $1', [id]);
    return projects[0];
  }

  async getTempProject(id: string): Promise<any | undefined> {
    return this.tempProjects.get(id);
  }
  
  async createProject(insertProject: Omit<InsertProject, "createdAt">): Promise<Project> {
    // Log the incoming project data
    console.log('Creating project with data:', {
      ...insertProject,
      summary: insertProject.summary || {}
    });
    const summary = insertProject.summary || {
      overview: "No overview available",
      architecture: "Architecture information not available",
      testingApproach: "Testing information not available",
      codeQuality: "Code quality assessment not available"
    };
    const result = await query(
      'INSERT INTO projects (name, language, file_count, total_lines, stats, main_files, dependencies, summary, user_id, repository_url, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [
        insertProject.name, 
        insertProject.language,
        insertProject.file_count,
        insertProject.total_lines,
        JSON.stringify(insertProject.stats),
        JSON.stringify(insertProject.main_files || []),
        JSON.stringify(insertProject.dependencies || []),
        JSON.stringify(summary), // Ensure summary is properly formatted
        insertProject.user_id || null,
        insertProject.repository_url || null,
        new Date()
      ]
    );

    // Log the result
    console.log('Created project with result:', result[0]);
    return result[0];
  }
  
  async createTempProject(project: any): Promise<any> {
    this.tempProjects.set(project.id, project);
    return project;
  }
  
  async getDocumentation(projectId: number): Promise<Document | undefined> {
    const documents = await query('SELECT * FROM documents WHERE project_id = $1', [projectId]);
    return documents[0];
  }
  
  async getTempDocumentation(projectId: string): Promise<any | undefined> {
    return this.tempDocuments.get(projectId);
  }
  
  async createDocumentation(insertDocument: Omit<InsertDocument, "createdAt">): Promise<Document> {
    const result = await query(
      'INSERT INTO documents (project_id, title, content, sections, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [
        insertDocument.projectId,
        insertDocument.title,
        insertDocument.content,
        JSON.stringify(insertDocument.sections),
        new Date()
      ]
    );
    return result[0];
  }
  
  async createTempDocumentation(document: any): Promise<any> {
    const documentWithId = {
      ...document,
      createdAt: new Date().toISOString()
    };
    this.tempDocuments.set(document.projectId, documentWithId);
    return documentWithId;
  }
}