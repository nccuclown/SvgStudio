import { users, type User, type InsertUser } from "@shared/schema";
import { svgDocuments, type SvgDocument, type InsertSvgDocument } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getDocument(id: number): Promise<SvgDocument | undefined>;
  createDocument(document: InsertSvgDocument): Promise<SvgDocument>;
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
    const document: SvgDocument = { ...insertDocument, id };
    this.documents.set(id, document);
    return document;
  }
}

export const storage = new MemStorage();