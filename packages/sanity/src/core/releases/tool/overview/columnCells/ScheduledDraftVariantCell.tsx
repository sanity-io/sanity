import {Skeleton} from '@sanity/ui'
import {Box, Flex} from 'ui5'

import {useScheduledDraftDocument} from '../../../../singleDocRelease/hooks/useScheduledDraftDocument'
import {getDocumentVersionVariantId} from '../../../../util/getDocumentVersionVariant'
import {type SystemVariant} from '../../../../variants/types'
import {type InjectedTableProps} from '../../components/Table/types'
import {MemoVariantCell} from '../../components/VariantCell'
import {type TableRelease} from '../ReleasesOverview'

/**
 * The variant the document of a scheduled draft belongs to. Empty for base (non-variant) documents.
 */
export function ScheduledDraftVariantCell({
  release,
  cellProps,
  variantsById,
  variantsLoading,
}: {
  release: TableRelease
  cellProps: InjectedTableProps
  variantsById: Map<string, SystemVariant>
  variantsLoading: boolean
}): React.JSX.Element {
  const {firstDocument, loading: documentsLoading} = useScheduledDraftDocument(
    release._id && !release.isLoading ? release._id : undefined,
  )

  const isLoading = release.isLoading || documentsLoading || variantsLoading
  const variantId = getDocumentVersionVariantId({_system: firstDocument?._system})
  const variant = variantId ? variantsById.get(variantId) : undefined

  return (
    <Flex alignItems="center" {...cellProps}>
      <Box paddingX={2}>
        {isLoading ? (
          <Skeleton animated radius={1} style={{width: 60, height: 11}} />
        ) : (
          variant && <MemoVariantCell variant={variant} />
        )}
      </Box>
    </Flex>
  )
}
