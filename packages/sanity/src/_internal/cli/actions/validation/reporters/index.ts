import {json} from './jsonReporter'
import {ndjson} from './ndjsonReporter'
import {pretty} from './prettyReporter'

export const reporters = {pretty, ndjson, json}
