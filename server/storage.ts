import { users, type User, type InsertUser } from "@shared/schema";
import { svgDocuments, type SvgDocument, type InsertSvgDocument } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getDocument(id: number): Promise<SvgDocument | undefined>;
  createDocument(document: InsertSvgDocument): Promise<SvgDocument>;
  listDocuments(): Promise<SvgDocument[]>;
  updateDocument(id: number, content: string): Promise<SvgDocument | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<number, SvgDocument>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getDocument(id: number): Promise<SvgDocument | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertSvgDocument): Promise<SvgDocument> {
    const id = this.currentId++;
    const now = new Date();
    const document: SvgDocument = {
      ...insertDocument,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.documents.set(id, document);
    return document;
  }

  async listDocuments(): Promise<SvgDocument[]> {
    return Array.from(this.documents.values());
  }

  async updateDocument(id: number, content: string): Promise<SvgDocument | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;

    const updatedDocument: SvgDocument = {
      ...document,
      content,
      updatedAt: new Date()
    };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }
}

export const storage = new MemStorage();