import { users, type User, type InsertUser, projects, type Project, type InsertProject, documents, type Document, type InsertDocument, ProjectStats, ProjectSummary, GraphData, GraphDataRecord } from "@shared/schema";
import { DatabaseStorage as BaseStorage } from "./database-storage";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project methods
  getAllProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: Omit<InsertProject, "createdAt">): Promise<Project>;
  
  // Document methods
  getDocumentation(projectId: number): Promise<Document | undefined>;
  createDocumentation(document: Omit<InsertDocument, "createdAt">): Promise<Document>;

  // Graph methods
  getProjectGraph(projectId: number): Promise<GraphData | null>;
  saveProjectGraph(projectId: number, graphData: GraphData): Promise<GraphDataRecord>;
  
  // Optional temporary storage methods for ZIP uploads
  getTempProject?(id: string): Promise<any | undefined>;
  createTempProject?(project: any): Promise<any>;
  getTempDocumentation?(projectId: string): Promise<any | undefined>;
  createTempDocumentation?(document: any): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private tempProjects: Map<string, any>; // For ZIP uploads
  private documents: Map<number, Document>;
  private tempDocuments: Map<string, any>; // For ZIP uploads
  private currentUserId: number;
  private currentProjectId: number;
  private currentDocumentId: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.tempProjects = new Map();
    this.documents = new Map();
    this.tempDocuments = new Map();
    this.currentUserId = 1;
    this.currentProjectId = 1;
    this.currentDocumentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Project methods
  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async getTempProject(id: string): Promise<any | undefined> {
    return this.tempProjects.get(id);
  }
  
  async createProject(insertProject: Omit<InsertProject, "createdAt">): Promise<Project> {
    const id = this.currentProjectId++;
    const project: Project = { 
      ...insertProject, 
      id,
      repository_url: insertProject.repository_url || null,
      user_id: insertProject.user_id || null,
      created_at: new Date() 
    };
    this.projects.set(id, project);
    return project;
  }
  
  async createTempProject(project: any): Promise<any> {
    this.tempProjects.set(project.id, project);
    return project;
  }
  
  // Document methods
  async getDocumentation(projectId: number): Promise<Document | undefined> {
    return Array.from(this.documents.values()).find(
      (doc) => doc.projectId === projectId
    );
  }
  
  async getTempDocumentation(projectId: string): Promise<any | undefined> {
    return this.tempDocuments.get(projectId);
  }
  
  async createDocumentation(insertDocument: Omit<InsertDocument, "createdAt">): Promise<Document> {
    const id = this.currentDocumentId++;
    const document: Document = {
      ...insertDocument,
      id,
      createdAt: new Date()
    };
    this.documents.set(id, document);
    return document;
  }
  
  async createTempDocumentation(document: any): Promise<any> {
    const id = this.currentDocumentId++;
    const documentWithId = {
      ...document,
      id,
      createdAt: new Date().toISOString()
    };
    this.tempDocuments.set(document.projectId, documentWithId);
    return documentWithId;
  }

  // Graph methods
  async getProjectGraph(projectId: number): Promise<GraphData | null> {
    return null;
  }

  async saveProjectGraph(projectId: number, graphData: GraphData): Promise<GraphDataRecord> {
    throw new Error("Not implemented in memory storage");
  }
}

// Use database storage implementation
export const storage = new BaseStorage();