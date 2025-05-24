import {type Mock} from 'vitest'

import {type useDiffViewState as useDiffViewStateFn} from '../../useDiffViewState'

export const useDiffViewStateMockReturn = {isActive: false} as ReturnType<typeof useDiffViewStateFn>

export const mockUseDiffViewState = useDiffViewStateFn as Mock<typeof useDiffViewStateFn>
