/* eslint-disable no-process-env, no-sync */
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

/**
 * Load environment variables from .env files, mirroring the behavior of Vite.
 *
 * @returns Array of environment file paths loaded.
 */
export function loadEnvFiles() {
  const mode = process.env.NODE_ENV || 'development'
  const envFiles = ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`]
  const loaded = []

  for (const file of envFiles) {
    const envFilePath = path.join(__dirname, '..', '..', file)
    if (!fs.existsSync(envFilePath)) {
      continue
    }
    const {error} = dotenv.config({path: envFilePath})
    if (error) {
      console.warn(`Failed to load environment variables from ${envFilePath}: ${error.message}`)
    }

    loaded.push(envFilePath)
  }

  return loaded
}
