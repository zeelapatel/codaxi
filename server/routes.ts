import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertProjectSchema, insertDocumentSchema } from "@shared/schema";
import { setupAuth } from "./auth";
import axios from 'axios';
import { RepositoryAnalyzer } from './services/repository-analyzer';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_REDIRECT_URI = 'http://localhost:5000/api/github/callback';

// GitHub repository URL validation schema
const githubRepoSchema = z.object({
  repositoryUrl: z.string().url().startsWith("https://github.com/"),
  branch: z.string().min(1),
  language: z.string().min(1)
});

// File upload validation schema
const fileUploadSchema = z.object({
  language: z.string().min(1)
});

declare module 'express-session' {
  interface SessionData {
    github_access_token?: string;
    githubToken?: string;
    user_id?: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // GitHub OAuth routes
  app.get('/api/github/authorize', (req, res) => {
    if (!GITHUB_CLIENT_ID) {
      return res.status(500).json({ message: 'GitHub client ID not configured' });
    }

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo&redirect_uri=${GITHUB_REDIRECT_URI}`;
    res.json({ authUrl });
  });

  // GitHub OAuth callback
  app.get('/api/github/callback', async (req, res) => {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ message: 'Invalid authorization code' });
    }

    try {
      // Exchange code for access token
      const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_REDIRECT_URI
      }, {
        headers: {
          Accept: 'application/json'
        }
      });

      const { access_token } = tokenResponse.data;

      if (!access_token) {
        return res.status(400).json({ message: 'Failed to get access token' });
      }

      // Store token in session
      if (req.session) {
        req.session.github_access_token = access_token;
      }

      // Redirect to project upload page
      res.redirect('/upload');
    } catch (error) {
      console.error('GitHub OAuth error:', error);
      res.status(500).json({ message: 'Failed to complete GitHub authentication' });
    }
  });

  // Get user's GitHub repositories
  app.get('/api/github/repositories', async (req, res) => {
    const githubToken = req.session?.github_access_token;

    if (!githubToken) {
      return res.status(401).json({ message: 'GitHub authentication required' });
    }

    try {
      const reposResponse = await axios.get('https://api.github.com/user/repos', {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github.v3+json'
        },
        params: {
          sort: 'updated',
          per_page: 100
        }
      });

      const repositories = reposResponse.data.map((repo: any) => ({
        id: repo.id,
        name: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        defaultBranch: repo.default_branch,
        private: repo.private,
        updatedAt: repo.updated_at
      }));

      res.json(repositories);
    } catch (error) {
      console.error('GitHub API error:', error);
      res.status(500).json({ message: 'Failed to fetch repositories' });
    }
  });

  // Other API routes

  // Get all projects (for a user, but we're not implementing auth for MVP)
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to retrieve projects"
      });
    }
  });

  // Get a specific project by ID
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);

      // Handle string IDs (for mock ZIP uploads)
      if (isNaN(projectId) && req.params.id.startsWith('zip-')) {
        // This is a temporary project from a ZIP upload
        const project = await storage.getTempProject(req.params.id);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        console.log(project);
        return res.json(project);
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to retrieve project"
      });
    }
  });

  // GitHub repository analysis
  app.post('/api/projects/analyze/github', async (req, res) => {
    try {
      const { repositoryUrl, branch = 'main', language } = req.body;
      
      // Get the GitHub access token from the session
      const accessToken = req.session?.github_access_token;
      if (!accessToken) {
        throw new Error('GitHub access token not found. Please reconnect your GitHub account.');
      }

      console.log('Starting GitHub repository analysis:', repositoryUrl);
      
      const analyzer = new RepositoryAnalyzer();
      const analysis = await analyzer.analyze(repositoryUrl, branch, accessToken);
      
      // Create project in database
      const project = await storage.createProject({
        name: repositoryUrl.split('/').pop()?.replace('.git', '') || 'Unknown Project',
        language,
        repository_url: repositoryUrl,
        file_count: analysis.fileCount,
        total_lines: analysis.totalLines,
        stats: analysis.stats,
        main_files: analysis.mainFiles,
        dependencies: analysis.dependencies,
        summary: analysis.summary,
        user_id: req.session?.user_id || null
      });

      res.status(201).json(project);
    } catch (error: any) {
      console.error('Error analyzing repository:', error);
      res.status(500).json({ message: error?.message || 'Failed to analyze repository' });
    }
  });

  // Analyze ZIP file (mock implementation for MVP)
  app.post("/api/projects/analyze/zip", async (req, res) => {
    try {
      // In a real implementation, we would use multer to handle file uploads
      // For the MVP, we'll simulate a successful upload
      const validation = fileUploadSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: validation.error.flatten()
        });
      }

      const { language } = validation.data;

      // Generate a unique ID for this temporary project
      const tempId = `zip-${Date.now()}`;

      // Store in temp storage
      const project = await storage.createTempProject({
        id: tempId,
        name: "ZIP Upload",
        language,
        fileCount: 64,
        totalLines: 9842,
        stats: {
          jsFiles: 48,
          jsonFiles: 10,
          mdFiles: 6
        },
        analysisDate: new Date().toISOString()
      });

      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to analyze ZIP file"
      });
    }
  });

  // Get project graph data
  app.get("/api/projects/:id/graph", async (req, res) => {
    try {
      const projectId = req.params.id;

      // In a real implementation, we would generate this from actual analysis
      // For the MVP, we'll return sample graph data
      const graphData = {
        nodes: [
          { id: "app.js", name: "app.js", group: 1, radius: 20 },
          { id: "routes/index.js", name: "routes/index.js", group: 2, radius: 15 },
          { id: "routes/api.js", name: "routes/api.js", group: 2, radius: 15 },
          { id: "routes/users.js", name: "routes/users.js", group: 2, radius: 15 },
          { id: "routes/auth.js", name: "routes/auth.js", group: 2, radius: 15 },
          { id: "config/db.js", name: "config/db.js", group: 3, radius: 12 },
          { id: "controllers/user.js", name: "controllers/user.js", group: 4, radius: 12 },
          { id: "controllers/auth.js", name: "controllers/auth.js", group: 4, radius: 12 },
          { id: "controllers/product.js", name: "controllers/product.js", group: 4, radius: 12 },
          { id: "controllers/order.js", name: "controllers/order.js", group: 4, radius: 12 },
          { id: "models/User.js", name: "models/User.js", group: 5, radius: 10 },
          { id: "models/Product.js", name: "models/Product.js", group: 5, radius: 10 },
          { id: "models/Order.js", name: "models/Order.js", group: 5, radius: 10 },
          { id: "middleware/auth.js", name: "middleware/auth.js", group: 5, radius: 10 },
          { id: "middleware/error.js", name: "middleware/error.js", group: 5, radius: 10 },
        ],
        links: [
          { source: "app.js", target: "routes/index.js", value: 1 },
          { source: "app.js", target: "routes/api.js", value: 1 },
          { source: "app.js", target: "routes/users.js", value: 1 },
          { source: "app.js", target: "routes/auth.js", value: 1 },
          { source: "app.js", target: "config/db.js", value: 1 },
          { source: "app.js", target: "middleware/auth.js", value: 1 },
          { source: "app.js", target: "middleware/error.js", value: 1 },
          { source: "routes/index.js", target: "controllers/user.js", value: 1 },
          { source: "routes/api.js", target: "controllers/user.js", value: 1 },
          { source: "routes/users.js", target: "controllers/product.js", value: 1 },
          { source: "routes/auth.js", target: "controllers/auth.js", value: 1 },
          { source: "controllers/user.js", target: "models/User.js", value: 1 },
          { source: "controllers/auth.js", target: "models/User.js", value: 1 },
          { source: "controllers/product.js", target: "models/Product.js", value: 1 },
          { source: "controllers/order.js", target: "models/Order.js", value: 1 },
          { source: "middleware/auth.js", target: "controllers/auth.js", value: 1 },
          { source: "middleware/auth.js", target: "controllers/user.js", value: 1 },
          { source: "middleware/error.js", target: "controllers/product.js", value: 1 },
          { source: "middleware/error.js", target: "controllers/order.js", value: 1 },
        ]
      };

      res.json(graphData);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to retrieve project graph"
      });
    }
  });

  // Get project documentation
  app.get("/api/projects/:id/documentation", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);

      // In a real implementation, we would generate this from actual analysis
      // For the MVP, we'll check if we have documentation for this project
      let document;

      if (isNaN(projectId) && req.params.id.startsWith('zip-')) {
        // Handle temporary projects
        document = await storage.getTempDocumentation(req.params.id);
      } else {
        document = await storage.getDocumentation(projectId);
      }

      if (!document) {
        // Create a default documentation
        const documentData = {
          projectId: isNaN(projectId) ? -1 : projectId, // Use -1 for temporary projects
          title: "Project Documentation",
          content: "Comprehensive documentation for your project",
          sections: [
            {
              id: "project-overview",
              title: "Project Overview",
              content: "This is an automatically generated documentation for your project."
            },
            {
              id: "installation",
              title: "Installation & Setup",
              content: "Instructions for setting up the project locally."
            },
            {
              id: "structure",
              title: "Project Structure",
              content: "Description of the project's file and directory structure."
            },
            {
              id: "api-reference",
              title: "API Reference",
              content: "Documentation for the API endpoints."
            }
          ]
        };

        if (isNaN(projectId) && req.params.id.startsWith('zip-')) {
          // Handle temporary projects
          document = await storage.createTempDocumentation(documentData);
        } else {
          document = await storage.createDocumentation(documentData);
        }
      }

      res.json(document);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to retrieve project documentation"
      });
    }
  });

  // Download documentation in different formats
  app.get("/api/projects/:id/download", async (req, res) => {
    try {
      const projectId = req.params.id;
      const format = req.query.format as string || 'html';

      // Validate format
      if (!['docx', 'pdf', 'html'].includes(format)) {
        return res.status(400).json({ message: "Invalid format specified" });
      }

      // In a real implementation, we would generate the file in the requested format
      // For the MVP, we'll just return a simple text file
      let contentType = 'text/html';
      let content = '<html><body><h1>Project Documentation</h1><p>This is a sample documentation file.</p></body></html>';

      switch (format) {
        case 'docx':
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          // This wouldn't be a valid docx, but it's just for demonstration
          content = 'This would be a DOCX file in a real implementation';
          break;
        case 'pdf':
          contentType = 'application/pdf';
          // This wouldn't be a valid PDF, but it's just for demonstration
          content = 'This would be a PDF file in a real implementation';
          break;
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename=documentation_${projectId}.${format}`);
      res.send(content);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to download documentation"
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
