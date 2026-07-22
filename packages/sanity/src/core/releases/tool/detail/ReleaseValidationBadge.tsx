import {Card, Text} from '@sanity/ui'

import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {getDocumentValidationLoading} from '../../util/getDocumentValidationLoading'
import {type DocumentInRelease} from './types'

// Transparent background so the tone only colours the text (green/red), not a filled chip — the
// properties block uses one value idiom (semantic-coloured text), not a mix of pills and badges.
const TRANSPARENT_BG = {background: 'transparent'} as const

/**
 * The persistent validation status shown in the release properties panel, as semantic-coloured
 * text: green "Valid" when every document validates, red "Errors" when any fail, plain "Validating"
 * while in progress, and muted "No documents" when the release is empty. Unlike the shared
 * ValidationProgressIndicator (whose green fades to a bare checkmark after a beat), this holds its
 * state so the panel can clearly signal whether the release is good to go — and it reads as text,
 * matching the other property values rather than sitting in a box.
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
  const isValidating = validatedCount !== totalCount

  const tone = hasError ? 'critical' : isValidating ? 'default' : 'positive'
  const label = hasError
    ? t('dashboard.details.metadata.status-errors')
    : isValidating
      ? t('dashboard.details.metadata.status-validating')
      : t('dashboard.details.metadata.status-valid')

  // A tone-scoped Card sets the foreground colour var; with a transparent background the Text simply
  // renders in the tone colour (green/red), no filled chip.
  return (
    <Card tone={tone} style={TRANSPARENT_BG}>
      <Text size={1} weight="medium">
        {label}
      </Text>
    </Card>
  )
}
