import {benchRunTypes} from './benchRun'
import {bisectSession} from './bisectSession'
import {driftAck} from './driftAck'
import {engineConfidenceRunTypes} from './engineConfidenceRun'
import {gitCommit} from './gitCommit'
import {gitTag} from './gitTag'
import {releaseLine} from './releaseLine'
import {sqrlScore} from './sqrlScore'

export const schemaTypes = [
  ...benchRunTypes,
  bisectSession,
  driftAck,
  ...engineConfidenceRunTypes,
  gitCommit,
  gitTag,
  releaseLine,
  sqrlScore,
]
