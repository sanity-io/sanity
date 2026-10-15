import {benchRunTypes} from './benchRun'
import {bisectSession} from './bisectSession'
import {driftAck} from './driftAck'
import {gitCommit} from './gitCommit'
import {gitTag} from './gitTag'
import {releaseLine} from './releaseLine'
import {sqrlScore} from './sqrlScore'

export const schemaTypes = [
  ...benchRunTypes,
  bisectSession,
  driftAck,
  gitCommit,
  gitTag,
  releaseLine,
  sqrlScore,
]
