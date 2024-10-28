import {DotIcon} from '@sanity/icons'
import {type PreviewValue, type SanityDocument} from '@sanity/types'
import {Flex, Text} from '@sanity/ui'
import {type ComponentType} from 'react'
import {styled} from 'styled-components'

import {type VersionsRecord} from '../../preview/utils/getPreviewStateObservable'

interface DocumentStatusProps {
  draft?: PreviewValue | Partial<SanityDocument> | null
  published?: PreviewValue | Partial<SanityDocument> | null
  version?: PreviewValue | Partial<SanityDocument> | null
  versions: VersionsRecord
}

const Root = styled(Text)`
  &[data-status='edited'] {
    --card-icon-color: var(--card-badge-caution-dot-color);
  }
  &[data-status='unpublished'] {
    --card-icon-color: var(--card-badge-default-dot-color);
    opacity: 0.5 !important;
  }
`

type Status = 'draft' | 'immediate' | 'future' | 'never'

/**
 * Renders a dot indicating the current document status.
 *
 * @internal
 */
export function DocumentStatusIndicator({
  draft,
  published,
  version,
  versions,
}: DocumentStatusProps) {
  const indicators: {
    status: Status
    document: PreviewValue | Partial<SanityDocument> | null | undefined
  }[] = [
    {
      status: 'draft',
      document: draft,
    },
    {
      status: 'immediate',
      document: undefined,
    },
    {
      status: 'future',
      document: undefined,
    },
    {
      status: 'never',
      document: undefined,
    },
  ]

  return (
    <Flex>
      {indicators
        .filter(({document}) => Boolean(document))
        .map(({status}) => (
          <Dot key={status} status={status} />
        ))}
    </Flex>
  )
}

const Dot: ComponentType<{status: Status}> = ({status}) => (
  <Root data-status={status} size={1}>
    <DotIcon />
  </Root>
)
