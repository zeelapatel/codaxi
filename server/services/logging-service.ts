import * as fs from 'fs/promises';
import * as path from 'path';
import { format } from 'date-fns';

export class LoggingService {
  private logDir: string;
  private currentLogFile: string;

  constructor(logDir: string = 'logs') {
    this.logDir = logDir;
    this.currentLogFile = '';
  }

  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.access(this.logDir);
    } catch {
      await fs.mkdir(this.logDir, { recursive: true });
    }
  }

  async startNewAnalysisLog(repositoryUrl: string): Promise<void> {
    await this.ensureLogDirectory();
    
    // Create a safe filename from repository URL
    const repoName = repositoryUrl.split('/').pop()?.replace('.git', '') || 'unknown';
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    this.currentLogFile = path.join(this.logDir, `analysis_${repoName}_${timestamp}.log`);
    
    // Create the log file with initial entry
    await this.log('info', `Starting analysis for repository: ${repositoryUrl}`);
  }

  async log(level: 'info' | 'error' | 'warn' | 'debug', message: string, data?: any): Promise<void> {
    if (!this.currentLogFile) {
      throw new Error('No active log file. Call startNewAnalysisLog first.');
    }

    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS');
    let logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
      logEntry += '\nData: ' + JSON.stringify(data, null, 2);
    }
    
    logEntry += '\n';

    await fs.appendFile(this.currentLogFile, logEntry, 'utf8');
  }

  async getLogFilePath(): Promise<string> {
    return this.currentLogFile;
  }
}

// Create a singleton instance
export const logger = new LoggingService(); 