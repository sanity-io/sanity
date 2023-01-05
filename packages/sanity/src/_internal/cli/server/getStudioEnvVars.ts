/* eslint-disable no-process-env */

/**
 * Get environment variables prefixed with SANITY_STUDIO_, as an object.
 * Specify a `prefix` to add a prefix to the environment variable keys,
 * eg: `getStudioEnvVars('process.env.')`
 *
 * @param prefix - Prefix to add to the environment variable keys
 * @returns Object of studio environment variables
 * @internal
 */
export function getStudioEnvVars(prefix = ''): Record<string, string> {
  const studioEnv: Record<string, string> = {}
  for (const key in process.env) {
    if (key.startsWith('SANITY_STUDIO_')) {
      studioEnv[`${prefix}${key}`] = JSON.stringify(process.env[key] || '')
    }
  }
  return studioEnv
}
