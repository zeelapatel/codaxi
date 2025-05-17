import { fdir } from "fdir";
import * as path from 'path';
import OpenAI from "openai";
import { env } from '../config/env';
import * as fs from 'fs/promises';
import { ProjectSummary } from '@shared/schema';
import { logger } from './logging-service';

interface FileAnalysis {
  mainFiles: { path: string; description: string; confidence: number }[];
  projectType: string;
  suggestedStructure: {
    entryPoints: string[];
    configFiles: string[];
    testFiles: string[];
    assetFiles: string[];
  };
  summary: ProjectSummary;
  dependencyGraph: {
    nodes: Array<{
      id: string;
      name: string;
      group: number;
      radius: number;
    }>;
    links: Array<{
      source: string;
      target: string;
      value: number;
    }>;
  };
}

interface DependencyInfo {
  imports: string[];
  exports: string[];
}

export class FileSystemAgent {
  private openai: OpenAI;
  private readonly MAX_FILE_SIZE = 1024 * 1000000; // 100KB limit for file reading
  private readonly KEY_FILES = [
    'package.json',
    'tsconfig.json',
    'README.md',
    '.eslintrc',
    'jest.config.js',
    'webpack.config.js',
    'vite.config.ts',
    'next.config.js',
    'app.ts',
    'app.js',
    'index.ts',
    'index.js',
    'main.ts',
    'main.js'
  ];

  constructor() {
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY
    });
  }

  private async analyzeDependencies(filePath: string, content: string): Promise<DependencyInfo> {
    const imports: string[] = [];
    const exports: string[] = [];

    // Match ES6 imports
    const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
    let importMatch;
    while ((importMatch = importRegex.exec(content)) !== null) {
      imports.push(this.resolveImportPath(filePath, importMatch[1]));
    }

    // Match require statements
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    let requireMatch;
    while ((requireMatch = requireRegex.exec(content)) !== null) {
      imports.push(this.resolveImportPath(filePath, requireMatch[1]));
    }

    // Match exports
    const exportMatches = content.match(/export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g);
    if (exportMatches) {
      exports.push(...exportMatches);
    }

    return { imports, exports };
  }

  private resolveImportPath(currentFile: string, importPath: string): string {
    if (importPath.startsWith('.')) {
      // Resolve relative path
      const dir = path.dirname(currentFile);
      return path.resolve(dir, importPath);
    }
    return importPath;
  }

  private async generateDependencyGraph(repoPath: string, files: string[]): Promise<FileAnalysis['dependencyGraph']> {
    const nodes: Set<string> = new Set();
    const links: Map<string, Set<string>> = new Map();
    const fileGroups: Map<string, number> = new Map();
    let groupCounter = 1;

    // Group files by directory
    for (const file of files) {
      const relativePath = path.relative(repoPath, file);
      const dir = path.dirname(relativePath);
      if (!fileGroups.has(dir)) {
        fileGroups.set(dir, groupCounter++);
      }
    }

    // Analyze dependencies for each file
    for (const file of files) {
      if (file.match(/\.(js|jsx|ts|tsx)$/)) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          const relativePath = path.relative(repoPath, file);
          const { imports } = await this.analyzeDependencies(relativePath, content);

          nodes.add(relativePath);
          
          if (!links.has(relativePath)) {
            links.set(relativePath, new Set());
          }

          for (const imp of imports) {
            if (imp.startsWith('.')) {
              const resolvedImport = this.resolveImportPath(relativePath, imp);
              links.get(relativePath)?.add(resolvedImport);
              nodes.add(resolvedImport);
            }
          }
        } catch (error) {
          console.error(`Error analyzing dependencies for ${file}:`, error);
        }
      }
    }

    // Convert to graph format
    const graphNodes = Array.from(nodes).map(file => ({
      id: file,
      name: file,
      group: fileGroups.get(path.dirname(file)) || 1,
      radius: 10 + (links.get(file)?.size || 0) * 2 // Size based on number of dependencies
    }));

    const graphLinks = Array.from(links.entries()).flatMap(([source, targets]) =>
      Array.from(targets).map(target => ({
        source,
        target,
        value: 1
      }))
    );

    return {
      nodes: graphNodes,
      links: graphLinks
    };
  }

  async analyzeFileStructure(repoPath: string): Promise<FileAnalysis> {
    try {
      // Get all files using fdir
      const crawler = new fdir()
        .exclude((dirName) => dirName === 'node_modules' || dirName === '.git')
        .withFullPaths()
        .withDirs()
        .crawl(repoPath);

      const files = await crawler.withPromise();
      
      // Convert absolute paths to relative paths and create a compressed file tree
      const fileTree = files.map(file => path.relative(repoPath, file))
        .sort()
        .join('\n');
      await logger.log('info', "file tree",fileTree);
      await logger.log('info', 'File tree generated', { fileCount: files.length });

      // Get key file contents for better analysis
      const keyFileContents = await this.getKeyFileContents(repoPath, files);

      // Prepare the prompt for AI analysis
      const prompt = `Analyze this codebase and provide a JSON response.
Focus on creating an accurate dependency graph that shows how files are related.

Files:
${fileTree}

Content of key files:
${keyFileContents}

Create a dependency graph that shows:
1. How files are connected (imports, requires, relationships)
2. Group files by their directory/module
3. Size nodes based on their importance/connectivity
4. Include both direct and indirect dependencies

Return this exact JSON structure:
{
  "mainFiles": [{"path": "string", "description": "string", "confidence": number}],
  "projectType": "string",
  "suggestedStructure": {
    "entryPoints": ["string"],
    "configFiles": ["string"],
    "testFiles": ["string"],
    "assetFiles": ["string"]
  },
  "summary": {
    "overview": "Clear description of what the project does",
    "architecture": "core design patterns used",
    "testingApproach": "testing methods",
    "codeQuality": "code quality overview"
  },
  "dependencyGraph": {
    "nodes": [
      {
        "id": "file path",
        "name": "file name",
        "group": "number (1-5) based on directory/module",
        "radius": "number (10-30) based on importance"
      }
    ],
    "links": [
      {
        "source": "file path that imports",
        "target": "file path that is imported",
        "value": "number (1-3) indicating relationship strength"
      }
    ]
  }
}`;

      // Get AI analysis
      const response = await this.openai.chat.completions.create({
        model: "gpt-4.1-nano",
        messages: [
          {
            role: "system",
            content: "You are a code analyzer specialized in understanding project structure and dependencies. Focus on creating accurate dependency graphs that show how different parts of the codebase are connected. Group related files together and identify key relationships between modules."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      // Parse and validate the AI response
      try {
        const content = response.choices[0].message?.content || "{}";
        await logger.log('debug', 'Raw AI response', { content });

        // Remove any non-JSON content
        const jsonStr = content.substring(
          content.indexOf('{'),
          content.lastIndexOf('}') + 1
        );
        await logger.log('debug', 'Extracted JSON string', { jsonStr });

        const analysis = JSON.parse(jsonStr);
        await logger.log('info', 'Parsed analysis', { analysis });
        
        // Check if graph data is missing or empty
        if (!analysis.dependencyGraph || !analysis.dependencyGraph.nodes || !analysis.dependencyGraph.links) {
          await logger.log('warn', 'Dependency graph is missing or empty in AI response. Retrying with focused prompt...');
          
          // Retry with a more focused prompt just for the graph
          const graphResponse = await this.openai.chat.completions.create({
            model: "gpt-4.1-nano",
            messages: [
              {
                role: "system",
                content: "You are a dependency graph generator. Analyze the file structure and contents to create an accurate representation of file relationships and module dependencies."
              },
              {
                role: "user",
                content: `Create a dependency graph for this codebase showing file relationships and module structure.

Files:
${fileTree}

Key file contents:
${keyFileContents}

Return a JSON object with this structure:
{
  "nodes": [
    {
      "id": "file path",
      "name": "file name",
      "group": "number (1-5) based on directory/module",
      "radius": "number (10-30) based on importance"
    }
  ],
  "links": [
    {
      "source": "file path that imports",
      "target": "file path that is imported",
      "value": "number (1-3) indicating relationship strength"
    }
  ]
}`
              }
            ],
            temperature: 0.2,
            response_format: { type: "json_object" }
          });

          // Update the analysis with the new graph data
          analysis.dependencyGraph = JSON.parse(graphResponse.choices[0].message?.content || "{}");
        }
        
        // Validate and clean the analysis
        const validatedAnalysis = this.validateAnalysis(analysis);
        await logger.log('info', 'Final validated analysis', { validatedAnalysis });
        return validatedAnalysis;
      } catch (error) {
        await logger.log('error', 'Error parsing AI response', { 
          error,
          rawResponse: response.choices[0].message?.content 
        });
        return this.validateAnalysis({});
      }
    } catch (error) {
      await logger.log('error', 'Error in FileSystemAgent analysis', { error });
      throw error;
    }
  }

  private async getKeyFileContents(repoPath: string, files: string[]): Promise<string> {
    const keyFileContents: string[] = [];

    for (const file of files) {
      const relativePath = path.relative(repoPath, file);
      const fileName = path.basename(relativePath);

      if (this.KEY_FILES.includes(fileName)) {
        try {
          const stats = await fs.stat(file);
          
          // Skip large files
          if (stats.size > this.MAX_FILE_SIZE) {
            await logger.log('warn', `File too large to analyze: ${relativePath}`, { size: stats.size });
            keyFileContents.push(`${relativePath}: [File too large to analyze]`);
            continue;
          }

          const content = await fs.readFile(file, 'utf-8');
          await logger.log('info', 'File content', { content });
          keyFileContents.push(`${relativePath}:\n${content}\n`);
        } catch (error) {
          await logger.log('error', `Error reading file ${file}`, { error });
        }
      }
    }

    return keyFileContents.join('\n---\n');
  }

  private validateAnalysis(analysis: any): FileAnalysis {
    // Ensure the analysis has the correct structure and types
    const defaultAnalysis: FileAnalysis = {
      mainFiles: [],
      projectType: "unknown",
      suggestedStructure: {
        entryPoints: [],
        configFiles: [],
        testFiles: [],
        assetFiles: []
      },
      summary: {
        overview: "No overview available",
        architecture: "Architecture information not available",
        testingApproach: "Testing information not available",
        codeQuality: "Code quality assessment not available"
      },
      dependencyGraph: {
        nodes: [],
        links: []
      }
    };

    // Validate and clean the dependency graph
    const validateGraph = (graph: any) => {
      if (!graph || typeof graph !== 'object') return defaultAnalysis.dependencyGraph;

      return {
        nodes: Array.isArray(graph.nodes) ? graph.nodes.map((node: any) => ({
          id: String(node.id || ""),
          name: String(node.name || ""),
          group: Number(node.group) || 1,
          radius: Number(node.radius) || 10
        })) : [],
        links: Array.isArray(graph.links) ? graph.links.map((link: any) => ({
          source: String(link.source || ""),
          target: String(link.target || ""),
          value: Number(link.value) || 1
        })) : []
      };
    };

    return {
      mainFiles: Array.isArray(analysis.mainFiles) ? analysis.mainFiles.map((file: any) => ({
        path: String(file.path || ""),
        description: String(file.description || ""),
        confidence: Number(file.confidence) || 0
      })) : defaultAnalysis.mainFiles,
      projectType: String(analysis.projectType || defaultAnalysis.projectType),
      suggestedStructure: {
        entryPoints: Array.isArray(analysis.suggestedStructure?.entryPoints) 
          ? analysis.suggestedStructure.entryPoints.map(String)
          : defaultAnalysis.suggestedStructure.entryPoints,
        configFiles: Array.isArray(analysis.suggestedStructure?.configFiles)
          ? analysis.suggestedStructure.configFiles.map(String)
          : defaultAnalysis.suggestedStructure.configFiles,
        testFiles: Array.isArray(analysis.suggestedStructure?.testFiles)
          ? analysis.suggestedStructure.testFiles.map(String)
          : defaultAnalysis.suggestedStructure.testFiles,
        assetFiles: Array.isArray(analysis.suggestedStructure?.assetFiles)
          ? analysis.suggestedStructure.assetFiles.map(String)
          : defaultAnalysis.suggestedStructure.assetFiles
      },
      summary: {
        overview: String(analysis.summary?.overview || defaultAnalysis.summary.overview),
        architecture: String(analysis.summary?.architecture || defaultAnalysis.summary.architecture),
        testingApproach: String(analysis.summary?.testingApproach || defaultAnalysis.summary.testingApproach),
        codeQuality: String(analysis.summary?.codeQuality || defaultAnalysis.summary.codeQuality)
      },
      dependencyGraph: validateGraph(analysis.dependencyGraph)
    };
  }
} 