import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/svg/:id", async (req, res) => {
    const document = await storage.getDocument(parseInt(req.params.id));
    if (!document) {
      res.status(404).json({ message: "Document not found" });
      return;
    }
    res.json(document);
  });

  app.post("/api/svg", async (req, res) => {
    const document = await storage.createDocument(req.body);
    res.json(document);
  });

  const httpServer = createServer(app);
  return httpServer;
}
