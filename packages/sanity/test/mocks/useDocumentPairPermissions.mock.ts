import {useDocumentPairPermissions} from '../../src/core/store/_legacy/grants/documentPairPermissions'
import {type Mock, type Mocked} from 'vitest'

export const useDocumentPairPermissionsMockReturn: Mocked<
  ReturnType<typeof useDocumentPairPermissions>
> = [{granted: true, reason: ''}, false]

export const mockUseDocumentPairPermissions = useDocumentPairPermissions as Mock<
  typeof useDocumentPairPermissions
>
