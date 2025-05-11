import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface EnvConfig {
  OPENAI_API_KEY: string;
  // Add other environment variables here as needed
}

function validateEnv(): EnvConfig {
  const requiredEnvVars = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  };

  // Check for missing environment variables
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file or environment configuration.'
    );
  }

  return requiredEnvVars as EnvConfig;
}

export const env = validateEnv(); 