import {Badge, Text} from 'ui5'

import {Tooltip} from '../../../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {releasesLocaleNamespace} from '../../../i18n'

/**
 * A quiet hint next to a release's document count: some of its documents are also in other
 * active releases. The release page lists which, per document.
 *
 * @internal
 */
export function SharedDocumentsHint({count}: {count: number | undefined}) {
  const {t} = useTranslation(releasesLocaleNamespace)
  if (!count) return null

  const label = t(
    count === 1 ? 'shared-documents.overview-label_one' : 'shared-documents.overview-label_other',
    {count},
  )

  return (
    <Tooltip
      portal
      content={
        <Text size={1} as="div" trim={true}>
          {label}
        </Text>
      }
    >
      {/* A labelled badge, not an icon and a bare number: the count next to the document count
          read as a second count. The tooltip says what "shared" means. */}
      <Badge
        tone="neutral"
        text={t('shared-documents.overview-badge', {count})}
        data-testid="shared-documents-hint"
      />
    </Tooltip>
  )
}
