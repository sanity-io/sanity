import {Subject} from 'rxjs'
import {type Mock} from 'vitest'

import {useCreatePathSyncChannel} from '../../useCreatePathSyncChannel'

export const mockUseCreatePathSyncChannelReturn = new Subject()

export const mockUseCreatePathSyncChannel = useCreatePathSyncChannel as Mock<typeof useCreatePathSyncChannel>
