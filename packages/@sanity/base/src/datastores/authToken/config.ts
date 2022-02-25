import config from 'config:sanity'

export function readConfig(): {projectId: string} {
  return {projectId: config.api.projectId}
}
