import { fdir } from "fdir";
import * as path from 'path';
import OpenAI from "openai";
import { env } from '../config/env';
import * as fs from 'fs/promises';
import { ProjectSummary } from '@shared/schema';

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
}

export class FileSystemAgent {
  private openai: OpenAI;
  private readonly MAX_FILE_SIZE = 1024 * 100; // 100KB limit for file reading
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

      // Get key file contents for better analysis
      const keyFileContents = await this.getKeyFileContents(repoPath, files);

      // Prepare the prompt for AI analysis
      const prompt = `Analyze this codebase and provide a JSON response.

For the overview, focus on answering these questions:
1. What is the main purpose of this project? (e.g., "This is a library management system for schools" or "This is a traffic light analysis tool for urban planning")
2. What problem does it solve?
3. Who are the intended users?
4. What are its key features?

Files:
${fileTree}

Content:
${keyFileContents}

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
    "overview": "Clear description of what the project does, its purpose, target users, and key features",
    "architecture": "core design patterns used",
    "testingApproach": "testing methods",
    "codeQuality": "code quality overview"
  }
}`;

      // Get AI analysis
      const response = await this.openai.chat.completions.create({
        model: "gpt-4.1-nano",
        messages: [
          {
            role: "system",
            content: "You are a code analyzer. Focus on explaining WHAT the project does in simple terms, as if explaining to a non-technical person. For the overview, start with 'This is a [type of project] that [main purpose]'. Be specific about the project's actual purpose."
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
        console.log('Raw AI response:', content); // Log the raw response

        // Remove any non-JSON content (anything before { or after })
        const jsonStr = content.substring(
          content.indexOf('{'),
          content.lastIndexOf('}') + 1
        );
        console.log('Extracted JSON string:', jsonStr); // Log the extracted JSON

        const analysis = JSON.parse(jsonStr);
        console.log('Parsed analysis:', analysis); // Log the parsed object
        
        // Check if summary is empty or missing
        if (!analysis.summary || !analysis.summary.overview) {
          console.warn('Summary is missing or empty in AI response. Retrying with modified prompt...');
          
          // Retry with a more direct prompt for just the summary
          const summaryResponse = await this.openai.chat.completions.create({
            model: "gpt-4.1-nano",
            messages: [
              {
                role: "system",
                content: "You are a code analyzer. Write a 200-word summary of this project based on its files and content."
              },
              {
                role: "user",
                content: `Write a 200-word summary of this project:

Files:
${fileTree}

Content:
${keyFileContents}

Focus on: purpose, main features, technologies used, and architecture.`
              }
            ],
            temperature: 0.2
          });

          // Update the analysis with the new summary
          analysis.summary = {
            overview: summaryResponse.choices[0].message?.content || "No overview available",
            architecture: analysis.summary?.architecture || "Architecture information not available",
            testingApproach: analysis.summary?.testingApproach || "Testing information not available",
            codeQuality: analysis.summary?.codeQuality || "Code quality assessment not available"
          };
        }
        
        // Validate and clean the analysis
        const validatedAnalysis = this.validateAnalysis(analysis);
        console.log('Final validated analysis:', validatedAnalysis); // Log the final result
        return validatedAnalysis;
      } catch (error) {
        console.error('Error parsing AI response:', error);
        console.error('Raw AI response:', response.choices[0].message?.content);
        // Return default analysis if parsing fails
        return this.validateAnalysis({});
      }
    } catch (error) {
      console.error('Error in FileSystemAgent analysis:', error);
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
            keyFileContents.push(`${relativePath}: [File too large to analyze]`);
            continue;
          }

          const content = await fs.readFile(file, 'utf-8');
          keyFileContents.push(`${relativePath}:\n${content}\n`);
        } catch (error) {
          console.error(`Error reading file ${file}:`, error);
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
      }
    };

    return {
      mainFiles: Array.isArray(analysis.mainFiles) ? analysis.mainFiles.map((file: { path?: any; description?: any; confidence?: any }) => ({
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
      }
    };
  }
} 