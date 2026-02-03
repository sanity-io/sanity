import {type Mock, type Mocked} from 'vitest'

import {useDocumentPairPermissions} from '../../src/core/store/_legacy/grants/documentPairPermissions'

export const useDocumentPairPermissionsMockReturn: Mocked<
  ReturnType<typeof useDocumentPairPermissions>
> = [{granted: true, reason: ''}, false]

export const mockUseDocumentPairPermissions = useDocumentPairPermissions as Mock<
  typeof useDocumentPairPermissions
>
