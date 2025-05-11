import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ProjectStats, ProjectSummary } from '@shared/schema';
import { fdir } from "fdir";
import { FileSystemAgent } from './file-system-agent';

const execAsync = promisify(exec);

interface ProjectAnalysis {
  fileCount: number;
  totalLines: number;
  stats: ProjectStats;
  analysisDate: Date;
  mainFiles: { path: string; description: string; confidence?: number }[];
  dependencies: string[];
  projectType?: string;
  suggestedStructure?: {
    entryPoints: string[];
    configFiles: string[];
    testFiles: string[];
    assetFiles: string[];
  };
  summary: ProjectSummary;
}

export class RepositoryAnalyzer {
  private tempDir: string;
  private fileSystemAgent: FileSystemAgent;

  constructor(
    tempDir: string = path.join(process.cwd(), 'analysis_temp')
  ) {
    this.tempDir = tempDir;
    this.fileSystemAgent = new FileSystemAgent();
  }

  async analyze(repositoryUrl: string, branch: string = 'main'): Promise<ProjectAnalysis> {
    const repoName = repositoryUrl.split('/').pop()?.replace('.git', '') || 'repo';
    const repoPath = path.join(this.tempDir, Date.now().toString(), repoName);

    try {
      console.log('Starting repository analysis...');

      await fs.mkdir(path.dirname(repoPath), { recursive: true });

      const cloneResult = await execAsync(`git clone --depth 1 --branch ${branch} ${repositoryUrl} "${repoPath}"`);
      console.log('Clone completed:', cloneResult.stdout);

      // Use FileSystemAgent for intelligent file analysis
      const aiAnalysis = await this.fileSystemAgent.analyzeFileStructure(repoPath);
      
      const stats = await this.getRepositoryStats(repoPath);
      const dependencies = await this.getDependencies(repoPath);

      await fs.rm(repoPath, { recursive: true, force: true });

      // Log the AI analysis before returning
      console.log('AI Analysis result:', JSON.stringify(aiAnalysis, null, 2));

      // Ensure summary has all required fields
      const summary: ProjectSummary = {
        overview: aiAnalysis.summary?.overview || 'No overview available',
        architecture: aiAnalysis.summary?.architecture || 'Architecture information not available',
        testingApproach: aiAnalysis.summary?.testingApproach || 'Testing information not available',
        codeQuality: aiAnalysis.summary?.codeQuality || 'Code quality assessment not available'
      };

      console.log('Formatted summary:', JSON.stringify(summary, null, 2));

      return {
        ...stats,
        mainFiles: aiAnalysis.mainFiles,
        dependencies,
        analysisDate: new Date(),
        projectType: aiAnalysis.projectType,
        suggestedStructure: aiAnalysis.suggestedStructure,
        summary
      };
    } catch (error) {
      console.error('Error during analysis:', error);
      await fs.rm(repoPath, { recursive: true, force: true }).catch(() => {});
      throw error;
    }
  }

  // Rest of your methods (findMainFiles, getDependencies, getRepositoryStats)

  private async findMainFiles(repoPath: string): Promise<{ path: string; description: string }[]> {
    const mainFiles: { path: string; description: string }[] = [];
    
    try {
      // Use fdir to scan for potential entry points
      const crawler = new fdir()
        .exclude((dirName) => dirName === 'node_modules' || dirName === '.git' || dirName === 'test' || dirName === 'tests')
        .withFullPaths()
        .filter((path) => {
          const filename = path.split('/').pop()?.toLowerCase() || '';
          return [
            'index.ts', 'index.js', 'index.tsx', 'index.jsx',
            'main.ts', 'main.js', 'main.tsx', 'main.jsx',
            'app.ts', 'app.js', 'app.tsx', 'app.jsx',
            'server.ts', 'server.js'
          ].includes(filename);
        })
        .crawl(repoPath);

      const files = await crawler.withPromise();

      // Read package.json to identify the main entry point
      const packageJsonPath = path.join(repoPath, 'package.json');
      let mainFromPackageJson: string | undefined;
      
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        mainFromPackageJson = packageJson.main || packageJson.module;
      } catch (error) {
        // Package.json might not exist or be invalid, continue without it
      }

      // Process found files
      for (const fullPath of files) {
        const relativePath = path.relative(repoPath, fullPath);
        const dirName = path.dirname(relativePath);
        const fileName = path.basename(relativePath);
        
        // Determine if this is a main entry point
        let description = '';
        
        if (mainFromPackageJson && relativePath === mainFromPackageJson) {
          description = 'Main package entry point';
        } else if (dirName === 'src' || dirName.includes('src/')) {
          if (fileName.startsWith('index.')) {
            description = 'Source directory entry point';
          } else if (fileName.startsWith('main.')) {
            description = 'Main application entry point';
          } else if (fileName.startsWith('app.')) {
            description = 'Application component';
          }
        } else if (dirName === '.' || dirName === '') {
          if (fileName.startsWith('index.')) {
            description = 'Root entry point';
          } else if (fileName.startsWith('server.')) {
            description = 'Server entry point';
          }
        } else if (dirName.includes('server/') || dirName.includes('backend/')) {
          description = 'Backend entry point';
        } else if (dirName.includes('client/') || dirName.includes('frontend/')) {
          description = 'Frontend entry point';
        }

        // Only add files where we could determine a clear purpose
        if (description) {
          mainFiles.push({ 
            path: relativePath,
            description 
          });
        }
      }

      return mainFiles;
    } catch (error) {
      console.error('Error finding main files:', error);
      return [];
    }
  }

  private async getDependencies(repoPath: string): Promise<string[]> {
    try {
      const packageJsonPath = path.join(repoPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      
      // Combine dependencies and devDependencies
      const allDependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      // Get the names of all dependencies
      return Object.keys(allDependencies).sort();
    } catch (error) {
      console.error('Error reading dependencies:', error);
      return [];
    }
  }

  private async getRepositoryStats(repoPath: string) {
    const stats = {
      fileCount: 0,
      totalLines: 0,
      stats: {
        jsFiles: 0,
        jsonFiles: 0,
        mdFiles: 0
      }
    };

    async function countLines(filePath: string): Promise<number> {
      const content = await fs.readFile(filePath, 'utf-8');
      return content.split('\n').length;
    }

    console.log('Starting directory processing...');
    
    // Create a new fdir instance with exclusion patterns
    const crawler = new fdir()
      .exclude((dirName) => dirName === 'node_modules' || dirName === '.git')
      .withFullPaths()
      .crawl(repoPath);

    const files = await crawler.withPromise();
    
    // Process each file
    await Promise.all(files.map(async (fullPath: string) => {
      const extension = path.extname(fullPath).toLowerCase();
      const lines = await countLines(fullPath);
      stats.totalLines += lines;

      // Count file based on type
      switch (extension) {
        case '.js':
        case '.jsx':
        case '.ts':
        case '.tsx':
          stats.stats.jsFiles++;
          stats.fileCount++;
          break;
        case '.json':
          stats.stats.jsonFiles++;
          stats.fileCount++;
          break;
        case '.md':
        case '.markdown':
          stats.stats.mdFiles++;
          stats.fileCount++;
          break;
        default:
          // Count other files too
          stats.fileCount++;
      }
    }));

    console.log('Final statistics:', JSON.stringify(stats, null, 2));
    return stats;
  }
}