import {benchRunTypes} from './benchRun'
import {driftAck} from './driftAck'
import {gitCommit} from './gitCommit'
import {gitTag} from './gitTag'

export const schemaTypes = [...benchRunTypes, driftAck, gitCommit, gitTag]
