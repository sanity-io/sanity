import {throttling} from '@octokit/plugin-throttling'
import {Octokit} from '@octokit/rest'
import {readEnv} from '@repo/utils'

import {type KnownEnvVar} from './types'

const ThrottledOctokit = Octokit.plugin(throttling)

let _octokit: Octokit | undefined

export function getOctokit(): Octokit {
  if (!_octokit) {
    _octokit = new ThrottledOctokit({
      auth: readEnv<KnownEnvVar>('GITHUB_TOKEN'),
      throttle: {
        onRateLimit: (retryAfter, options, octokit, retryCount) => {
          octokit.log.warn(
            `Request quota exhausted for ${options.method} ${options.url}; retry after ${retryAfter}s`,
          )
          return retryCount < 2
        },
        onSecondaryRateLimit: (retryAfter, options, octokit) => {
          octokit.log.warn(
            `Secondary rate limit hit for ${options.method} ${options.url}; retry after ${retryAfter}s`,
          )
          return true
        },
      },
    })
  }
  return _octokit
}
