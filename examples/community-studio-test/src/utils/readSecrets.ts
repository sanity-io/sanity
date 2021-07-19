import {Secrets} from '../types'
import {readEnv} from './readEnv'

export const readSecrets = (env: any): Secrets => ({
  SANITY_WRITE_TOKEN: readEnv(env, 'SANITY_WRITE_TOKEN'),
  SANITY_DATASET: readEnv(env, 'SANITY_DATASET'),
  EMAIL_DOMAIN: readEnv(env, 'EMAIL_DOMAIN'),
  SANITY_PROJECT_ID: readEnv(env, 'SANITY_PROJECT_ID'),
  SLACK_BOT_USER_TOKEN: readEnv(env, 'SLACK_BOT_USER_TOKEN'),
})
