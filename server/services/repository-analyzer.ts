import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ProjectStats } from '@shared/schema';

const execAsync = promisify(exec);

interface ProjectAnalysis {
  fileCount: number;
  totalLines: number;
  stats: ProjectStats;
  analysisDate: Date;
  mainFiles: { path: string; description: string }[];
  dependencies: string[];
}

export class RepositoryAnalyzer {
  private tempDir: string;

  constructor(tempDir: string = path.join(process.cwd(), 'analysis_temp')) {
    this.tempDir = tempDir;
  }

  async analyze(repositoryUrl: string, branch: string = 'main'): Promise<ProjectAnalysis> {
    const repoName = repositoryUrl.split('/').pop()?.replace('.git', '') || 'repo';
    const repoPath = path.join(this.tempDir, Date.now().toString(), repoName);

    try {
      console.log('Starting repository analysis...');

      await fs.mkdir(path.dirname(repoPath), { recursive: true });

      const cloneResult = await execAsync(`git clone --depth 1 --branch ${branch} ${repositoryUrl} "${repoPath}"`);
      console.log('Clone completed:', cloneResult.stdout);

      const stats = await this.getRepositoryStats(repoPath);
      const mainFiles = await this.findMainFiles(repoPath);
      const dependencies = await this.getDependencies(repoPath);
      

      await fs.rm(repoPath, { recursive: true, force: true });

      return {
        ...stats,
        mainFiles,
        dependencies,
        analysisDate: new Date()
      };
    } catch (error) {
      console.error('Error during analysis:', error);
      await fs.rm(repoPath, { recursive: true, force: true }).catch(() => {});
      throw error;
    }
  }

  private async findMainFiles(repoPath: string): Promise<{ path: string; description: string }[]> {
    const mainFiles: { path: string; description: string }[] = [];
    
    try {
      const files = await fs.readdir(repoPath, { withFileTypes: true });
      
      // Check for common Node.js entry points and important files
      const keyFiles = [
        { name: 'index.js', description: 'Main entry point' },
        { name: 'app.js', description: 'Application entry point' },
        { name: 'server.js', description: 'Server entry point' },
        { name: 'package.json', description: 'Project configuration and dependencies' },
        { name: 'README.md', description: 'Project documentation' },
        { name: '.env.example', description: 'Environment variables template' },
      ];

      // Check src directory if it exists
      const srcPath = path.join(repoPath, 'src');
      if (await fs.stat(srcPath).catch(() => null)) {
        const srcFiles = await fs.readdir(srcPath);
        for (const file of srcFiles) {
          if (file === 'index.js' || file === 'app.js' || file === 'main.js') {
            mainFiles.push({ 
              path: `src/${file}`, 
              description: 'Source entry point' 
            });
          }
        }
      }

      // Check for key files in root
      for (const file of files) {
        const keyFile = keyFiles.find(k => k.name === file.name);
        if (keyFile) {
          mainFiles.push({ 
            path: file.name, 
            description: keyFile.description 
          });
        }
      }

      // Look for route files
      const routesPath = path.join(repoPath, 'routes');
      if (await fs.stat(routesPath).catch(() => null)) {
        mainFiles.push({ 
          path: 'routes/index.js', 
          description: 'API routes definition' 
        });
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

    async function processDirectory(dirPath: string) {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // Skip node_modules and .git directories
          if (entry.name !== 'node_modules' && entry.name !== '.git') {
            await processDirectory(fullPath);
          } else {
            console.log('Skipping directory:', entry.name);
          }
        } else if (entry.isFile()) {
          const extension = path.extname(entry.name).toLowerCase();
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
        }
      }
    }

    console.log('Starting directory processing...');
    await processDirectory(repoPath);
    console.log('Final statistics:', JSON.stringify(stats, null, 2));
    return stats;
  }
} 