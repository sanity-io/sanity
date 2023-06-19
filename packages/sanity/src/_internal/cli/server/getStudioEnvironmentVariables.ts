/* eslint-disable no-process-env */
import {loadEnv} from '@sanity/cli'

const envPrefix = 'SANITY_STUDIO_'

/**
 * Get environment variables prefixed with SANITY_STUDIO_, as an object.
 *
 * Specify `options.prefix` to add a prefix to the environment variable keys,
 * eg: `getStudioEnvironmentVariables({prefix: 'process.env.'})`
 *
 * Specify `options.envFile` to include environment variables from dotenv files (`.env`),
 * in the same way the studio does. A `mode` must be specified, usually `development`
 * or `production`, which will load the corresponding `.env.development` or `.env.production`.
 * To specify where to look for the dotenv files, specify `options.envFile.envDir`.
 *
 * Specify `options.jsonEncode` to JSON-encode the values, which is handy if you want to pass
 * this to a bundlers hardcoded defines, such as Vite's `define` or Webpack's `DefinePlugin`.
 *
 * @param options - Options for the environment variable loading
 * @returns Object of studio environment variables
 * @public
 */
export function getStudioEnvironmentVariables(
  options: {
    prefix?: string
    envFile?: {mode: string; envDir?: string} | false
    jsonEncode?: boolean
  } = {}
): Record<string, string> {
  const {prefix = '', envFile = false, jsonEncode = false} = options
  const fullEnv = envFile
    ? {...process.env, ...loadEnv(envFile.mode, envFile.envDir || process.cwd(), [envPrefix])}
    : process.env

  const studioEnv: Record<string, string> = {}
  for (const key in fullEnv) {
    if (key.startsWith(envPrefix)) {
      studioEnv[`${prefix}${key}`] = jsonEncode
        ? JSON.stringify(fullEnv[key] || '')
        : fullEnv[key] || ''
    }
  }
  return studioEnv
}
