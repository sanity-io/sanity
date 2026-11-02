import {type ReleaseDocument} from '@sanity/client'
import {Card, Skeleton} from '@sanity/ui'
import {type ReactNode, useState} from 'react'
import {Text} from 'ui5'

import {ErrorBoundary} from '../../../../ui-components/errorBoundary/ErrorBoundary'
import {type ReleaseDetailProps} from '../../../config/releases/detail'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useWorkspace} from '../../../studio/workspace'
import {releasesLocaleNamespace} from '../../i18n'
import {type DocumentInRelease} from './types'

const DETAIL_SKELETON_HEIGHT = 72

function ReleaseDetailErrorCard(): React.JSX.Element {
  const {t} = useTranslation(releasesLocaleNamespace)

  return (
    <Card data-testid="release-detail-error" padding={3} radius={2} tone="critical">
      <Text size={1}>{t('dashboard.details.detail-error')}</Text>
    </Card>
  )
}

function ReleaseDetailBoundary({children}: {children: ReactNode}): React.JSX.Element {
  const [hasError, setHasError] = useState(false)

  if (hasError) return <ReleaseDetailErrorCard />

  return <ErrorBoundary onCatch={() => setHasError(true)}>{children}</ErrorBoundary>
}

/**
 * Renders the `releases.detail` component under the release description, once the release
 * documents have resolved.
 */
export function ReleaseDetailSlot({
  release,
  documents,
  loading,
}: {
  release: ReleaseDocument
  documents: DocumentInRelease[]
  loading: boolean
}): React.JSX.Element | null {
  const Detail = useWorkspace().releases?.detail

  if (typeof Detail === 'undefined') return null

  const detailRelease: ReleaseDetailProps['release'] = release

  return (
    <ReleaseDetailBoundary key={release._id}>
      {loading ? (
        <div data-testid="release-detail-skeleton">
          <Skeleton animated radius={2} style={{height: DETAIL_SKELETON_HEIGHT}} />
        </div>
      ) : (
        <Detail release={detailRelease} documents={documents} />
      )}
    </ReleaseDetailBoundary>
  )
}
