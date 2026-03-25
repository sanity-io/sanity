import {Octokit} from '@octokit/rest'
import {readEnv} from '@repo/utils'

import {type KnownEnvVar} from './types'

let _octokit: Octokit | undefined

export function getOctokit(): Octokit {
  if (!_octokit) {
    _octokit = new Octokit({auth: readEnv<KnownEnvVar>('GITHUB_TOKEN')})
  }
  return _octokit
}
