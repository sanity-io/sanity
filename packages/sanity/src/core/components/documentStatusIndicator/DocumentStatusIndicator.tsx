import {DotIcon} from '@sanity/icons'
import {type PreviewValue, type SanityDocument} from '@sanity/types'
import {Flex, Text} from '@sanity/ui'
import {type ComponentType, useMemo} from 'react'
import {styled} from 'styled-components'

import {type VersionsRecord} from '../../preview/utils/getPreviewStateObservable'
import {useReleases} from '../../store/release/useReleases'

interface DocumentStatusProps {
  draft?: PreviewValue | Partial<SanityDocument> | null
  published?: PreviewValue | Partial<SanityDocument> | null
  versions: VersionsRecord | undefined
}

const Root = styled(Text)`
  &[data-status='not-published'] {
    --card-icon-color: var(--card-badge-default-dot-color);
    opacity: 0.5 !important;
  }
  &[data-status='draft'] {
    --card-icon-color: var(--card-badge-caution-dot-color);
  }
  &[data-status='asap'] {
    --card-icon-color: var(--card-badge-critical-dot-color);
  }
  &[data-status='undecided'] {
    --card-icon-color: var(--card-badge-explore-dot-color);
  }
  &[data-status='scheduled'] {
    --card-icon-color: var(--card-badge-primary-dot-color);
  }
`

type Status = 'not-published' | 'draft' | 'asap' | 'scheduled' | 'undecided'

/**
 * Renders a dot indicating the current document status.
 *
 * @internal
 */
export function DocumentStatusIndicator({draft, published, versions}: DocumentStatusProps) {
  const {data: releases} = useReleases()
  const versionsList = useMemo(
    () =>
      versions
        ? Object.keys(versions).map((versionName) => {
            const release = releases?.find((r) => r.name === versionName)
            return release?.metadata.releaseType
          })
        : [],
    [releases, versions],
  )

  const indicators: {
    status: Status
    show: boolean
  }[] = [
    {
      status: draft && !published ? 'not-published' : 'draft',
      show: Boolean(draft),
    },
    {
      status: 'asap',
      show: versionsList.includes('asap'),
    },
    {
      status: 'scheduled',
      show: versionsList.includes('scheduled'),
    },
    {
      status: 'undecided',
      show: versionsList.includes('undecided'),
    },
  ]

  return (
    <Flex>
      {indicators
        .filter(({show}) => show)
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
