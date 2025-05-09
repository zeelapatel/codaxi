import { users, type User, type InsertUser, projects, type Project, type InsertProject, documents, type Document, type InsertDocument } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
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
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getTempProject(id: string): Promise<any | undefined> {
    return this.tempProjects.get(id);
  }
  
  async createProject(insertProject: Omit<InsertProject, "createdAt">): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values({
        ...insertProject,
        repositoryUrl: insertProject.repositoryUrl || null,
        userId: insertProject.userId || null
      })
      .returning();
    return project;
  }
  
  async createTempProject(project: any): Promise<any> {
    this.tempProjects.set(project.id, project);
    return project;
  }
  
  // Document methods
  async getDocumentation(projectId: number): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.projectId, projectId));
    return document;
  }
  
  async getTempDocumentation(projectId: string): Promise<any | undefined> {
    return this.tempDocuments.get(projectId);
  }
  
  async createDocumentation(insertDocument: Omit<InsertDocument, "createdAt">): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return document;
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