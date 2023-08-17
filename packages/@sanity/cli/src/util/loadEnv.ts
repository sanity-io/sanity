/**
 * This is an "inlined" version of Vite's `loadEnv` function,
 * simplified somewhat to only support our use case.
 *
 * Ideally we'd just use `loadEnv` from Vite, but importing it
 * causes bundling issues due to node APIs and downstream dependencies.
 *
 * Vite is MIT licensed, copyright (c) Yuxi (Evan) You and Vite contributors.
 */

/* eslint-disable no-process-env */
import fs from 'node:fs'
import path from 'node:path'
import {parse} from 'dotenv'
import {expand} from 'dotenv-expand'

export function loadEnv(
  mode: string,
  envDir: string,
  prefixes: string[] = ['VITE_'],
): Record<string, string> {
  if (mode === 'local') {
    throw new Error(
      `"local" cannot be used as a mode name because it conflicts with ` +
        `the .local postfix for .env files.`,
    )
  }

  const env: Record<string, string> = {}
  const envFiles = [
    /** default file */ `.env`,
    /** local file */ `.env.local`,
    /** mode file */ `.env.${mode}`,
    /** mode local file */ `.env.${mode}.local`,
  ]

  const parsed = Object.fromEntries(
    envFiles.flatMap((file) => {
      const envPath = lookupFile(envDir, [file], {
        rootDir: envDir,
      })
      if (!envPath) return []
      return Object.entries(parse(fs.readFileSync(envPath)))
    }),
  )

  // test NODE_ENV override before expand as otherwise process.env.NODE_ENV would override this
  if (parsed.NODE_ENV && process.env.VITE_USER_NODE_ENV === undefined) {
    process.env.VITE_USER_NODE_ENV = parsed.NODE_ENV
  }
  // support BROWSER and BROWSER_ARGS env variables
  if (parsed.BROWSER && process.env.BROWSER === undefined) {
    process.env.BROWSER = parsed.BROWSER
  }
  if (parsed.BROWSER_ARGS && process.env.BROWSER_ARGS === undefined) {
    process.env.BROWSER_ARGS = parsed.BROWSER_ARGS
  }

  try {
    // let environment variables use each other
    expand({parsed})
  } catch (e) {
    // custom error handling until https://github.com/motdotla/dotenv-expand/issues/65 is fixed upstream
    // check for message "TypeError: Cannot read properties of undefined (reading 'split')"
    if (e.message.includes('split')) {
      throw new Error('dotenv-expand failed to expand env vars. Maybe you need to escape `$`?')
    }
    throw e
  }

  // only keys that start with prefix are exposed to client
  for (const [key, value] of Object.entries(parsed)) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      env[key] = value
    }
  }

  // check if there are actual env variables starting with VITE_*
  // these are typically provided inline and should be prioritized
  for (const key in process.env) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      env[key] = process.env[key] as string
    }
  }

  return env
}

function lookupFile(
  dir: string,
  formats: string[],
  options?: {
    rootDir?: string
  },
): string | undefined {
  for (const format of formats) {
    const fullPath = path.join(dir, format)
    // eslint-disable-next-line no-sync
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return fullPath
    }
  }
  const parentDir = path.dirname(dir)
  if (parentDir !== dir && (!options?.rootDir || parentDir.startsWith(options?.rootDir))) {
    return lookupFile(parentDir, formats, options)
  }

  return undefined
}
