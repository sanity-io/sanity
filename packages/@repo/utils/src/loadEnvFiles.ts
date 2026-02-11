import fs from 'node:fs'
import path from 'node:path'

import dotenv from 'dotenv'

import {MONOREPO_ROOT} from './constants'

/**
 * Load environment variables from .env files, mirroring the behavior of Vite.
 *
 * @returns Array of environment file paths loaded.
 */
export function loadEnvFiles(
  cwd = MONOREPO_ROOT,
  mode = process.env.NODE_ENV || 'development',
): string[] {
  const envFiles = ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`]
  const loaded = []

  for (const file of envFiles) {
    const envFilePath = path.join(cwd, file)
    if (!fs.existsSync(envFilePath)) {
      continue
    }
    const {error} = dotenv.config({path: envFilePath})
    if (error) {
      console.warn(
        `Failed to load environment variables from current working directory ${envFilePath}: ${error.message}`,
      )
    }

    loaded.push(envFilePath)
  }

  return loaded
}
