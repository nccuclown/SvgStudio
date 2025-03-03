import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSvgDocumentSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // 取得文件列表
  app.get("/api/svg/list", async (_req, res) => {
    const documents = await storage.listDocuments();
    res.json(documents);
  });

  // 取得單一文件
  app.get("/api/svg/:id", async (req, res) => {
    const document = await storage.getDocument(parseInt(req.params.id));
    if (!document) {
      res.status(404).json({ message: "Document not found" });
      return;
    }
    res.json(document);
  });

  // 創建新文件
  app.post("/api/svg", async (req, res) => {
    try {
      const validatedData = insertSvgDocumentSchema.parse(req.body);
      const document = await storage.createDocument(validatedData);
      res.json(document);
    } catch (error) {
      res.status(400).json({ message: "Invalid document data" });
    }
  });

  // 更新文件
  app.put("/api/svg/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ message: "Content is required" });
      return;
    }

    const updatedDocument = await storage.updateDocument(id, content);
    if (!updatedDocument) {
      res.status(404).json({ message: "Document not found" });
      return;
    }

    res.json(updatedDocument);
  });

  const httpServer = createServer(app);
  return httpServer;
}