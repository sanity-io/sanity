import {benchRunTypes} from './benchRun'
import {bisectSession} from './bisectSession'
import {driftAck} from './driftAck'
import {gitCommit} from './gitCommit'
import {gitTag} from './gitTag'

export const schemaTypes = [...benchRunTypes, bisectSession, driftAck, gitCommit, gitTag]
