import {appendFile, mkdir, readFile, writeFile} from 'node:fs/promises'
import {dirname} from 'node:path'

import {Anthropic} from '@anthropic-ai/sdk'
import {resolveGitHubToken} from '@repo/utils/github-token'

import {fetchHistory} from '../history'
import {type ModelClient} from '../model'
import {createRadarClient} from '../sources/radar'
import {type CliDeps} from './deps'

function findGitHubToken(): string | null {
  try {
    return resolveGitHubToken()
  } catch {
    return null
  }
}

export function createLiveDeps(): CliDeps {
  const env = process.env
  return {
    env,
    now: () => new Date(),
    files: {
      readText: (path) => readFile(path, 'utf8'),
      writeText: async (path, content) => {
        await mkdir(dirname(path), {recursive: true})
        await writeFile(path, content)
      },
      appendText: (path, content) => appendFile(path, content),
    },
    stdout: (line) => console.log(line),
    stderr: (line) => console.error(line),
    loadHistory: ({issuesFrom}) =>
      fetchHistory({
        fetchImpl: fetch,
        radarClient: env.RADAR_SANITY_READ_TOKEN
          ? createRadarClient(env.RADAR_SANITY_READ_TOKEN)
          : null,
        githubToken: findGitHubToken(),
        issuesFrom,
      }),
    createModelClient: () => new Anthropic() as ModelClient,
  }
}
