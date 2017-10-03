// @flow

import type {Patch} from '../../../utils/patches'

type EventType = 'process' | 'complete'

export type ImportEvent = {
  type: EventType,
  percent: number,
  patches: ?Array<Patch>
}
