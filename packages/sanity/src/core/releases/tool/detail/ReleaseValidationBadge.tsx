import {Badge, Text} from '@sanity/ui'

import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {getDocumentValidationLoading} from '../../util/getDocumentValidationLoading'
import {type DocumentInRelease} from './types'

/**
 * A persistent validation-status badge for the release properties panel: green "Valid" when every
 * document validates, red "Errors" when any fail, "Validating" while in progress, and a muted "No
 * documents" when the release is empty. Unlike the shared ValidationProgressIndicator (whose green
 * fades to a bare checkmark after a beat), this holds its state, so the panel can clearly signal
 * "good to go" — the cue that the release is ready to run.
 *
 * @internal
 */
export function ReleaseValidationBadge({
  documents,
}: {
  documents: DocumentInRelease[]
}): React.JSX.Element {
  const {t} = useTranslation(releasesLocaleNamespace)
  const totalCount = documents.length

  if (totalCount === 0) {
    return (
      <Text muted size={1}>
        {t('dashboard.details.metadata.status-empty')}
      </Text>
    )
  }

  const {hasError, validatedCount} = getDocumentValidationLoading(documents)

  if (hasError) {
    return (
      <Badge tone="critical" fontSize={1} radius={2}>
        {t('dashboard.details.metadata.status-errors')}
      </Badge>
    )
  }

  if (validatedCount !== totalCount) {
    return (
      <Badge tone="default" fontSize={1} radius={2}>
        {t('dashboard.details.metadata.status-validating')}
      </Badge>
    )
  }

  return (
    <Badge tone="positive" fontSize={1} radius={2}>
      {t('dashboard.details.metadata.status-valid')}
    </Badge>
  )
}
