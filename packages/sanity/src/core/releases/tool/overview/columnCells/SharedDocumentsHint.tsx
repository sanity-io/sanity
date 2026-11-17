import {DocumentsIcon} from '@sanity/icons/Documents'
import {Flex, Text} from 'ui5'

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
      <Flex
        alignItems="center"
        gap={1}
        role="img"
        aria-label={label}
        data-testid="shared-documents-hint"
      >
        <Text muted size={1} as="div" trim={true}>
          <DocumentsIcon aria-hidden />
        </Text>
        <Text muted size={1} as="div" trim={true} aria-hidden>
          {count}
        </Text>
      </Flex>
    </Tooltip>
  )
}
