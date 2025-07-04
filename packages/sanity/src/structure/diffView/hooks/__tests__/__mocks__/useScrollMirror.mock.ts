import {type Mock} from 'vitest'

import {type useScrollMirror as useScrollMirrorFn} from '../../useScrollMirror'

export const mockUseScrollMirror = useScrollMirrorFn as Mock<typeof useScrollMirrorFn>
