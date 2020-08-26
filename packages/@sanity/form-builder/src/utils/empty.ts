import {Marker, Presence} from '../typedefs'
import {Path} from '../typedefs/path'
import {emptyArray, emptyObject, noop} from '@sanity/util/lib/empty'

export {emptyArray, emptyObject, noop}
export const EMPTY_MARKERS: Marker[] = emptyArray()
export const EMPTY_PATH: Path = emptyArray()
export const EMPTY_PRESENCE: Presence[] = emptyArray()
