import {PathSegment} from '../../../typedefs/path'

export const getKey = (segment: PathSegment) => (typeof segment === 'object' ? segment._key : null)
