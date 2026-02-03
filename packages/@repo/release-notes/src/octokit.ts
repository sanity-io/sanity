import {type KnownEnvVar} from './types'
import {Octokit} from '@octokit/rest'
import {readEnv} from '@repo/utils'

export const octokit = new Octokit({auth: readEnv<KnownEnvVar>('GITHUB_TOKEN')})
