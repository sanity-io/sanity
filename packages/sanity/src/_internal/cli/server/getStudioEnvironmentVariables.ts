/* eslint-disable no-process-env */
import {loadEnv} from '@sanity/cli'

const envPrefix = 'SANITY_STUDIO_'

/**
 * The params for the `getStudioEnvironmentVariables` function that gets Studio focused environment variables.
 *
 * @public
 */
export interface StudioEnvVariablesOptions {
  /**
   * When specified adds a prefix to the environment variable keys,
   * eg: `getStudioEnvironmentVariables({prefix: 'process.env.'})`
   */
  prefix?: string
  /**
   * When specified includes environment variables from dotenv files (`.env`), in the same way the studio does.
   * A `mode` must be specified, usually `development`
   * or `production`, which will load the corresponding `.env.development` or `.env.production`.
   * To specify where to look for the dotenv files, specify `options.envFile.envDir`.
   */
  envFile?: {mode: string; envDir?: string} | false
  /**
   * When specified, JSON-encodes the values, which is handy if you want to pass
   * this to a bundlers hardcoded defines, such as Vite's `define` or Webpack's `DefinePlugin`.
   */
  jsonEncode?: boolean
}

/**
 * Get environment variables prefixed with SANITY_STUDIO_, as an object.
 *
 * @param options - Options for the environment variable loading
 *  {@link StudioEnvVariablesOptions}
 * @returns Object of studio environment variables
 *
 * @example
 * ```tsx
 * getStudioEnvironmentVariables({prefix: 'process.env.', jsonEncode: true})
 * ```
 *
 * @public
 */
export function getStudioEnvironmentVariables(
  options: StudioEnvVariablesOptions = {},
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
