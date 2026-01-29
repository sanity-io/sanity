import {Octokit} from '@octokit/rest'
import {readEnv} from '@repo/utils'

import {type KnownEnvVar} from './types'

export const octokit = new Octokit({auth: readEnv<KnownEnvVar>('GITHUB_TOKEN')})
