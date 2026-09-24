import {benchRunTypes} from './benchRun'
import {bisectSession} from './bisectSession'
import {driftAck} from './driftAck'
import {gitCommit} from './gitCommit'
import {gitTag} from './gitTag'
import {releaseLine} from './releaseLine'

export const schemaTypes = [
  ...benchRunTypes,
  bisectSession,
  driftAck,
  gitCommit,
  gitTag,
  releaseLine,
]
