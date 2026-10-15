import {Card} from '@sanity/ui'
import {type DocumentInspectorComponent, type DocumentInspectorProps, useTranslation} from 'sanity'
import {Flex} from 'ui5'

import {DocumentInspectorHeader} from '../../documentInspector/DocumentInspectorHeader'
import {IncomingReferencesList} from './IncomingReferencesList'

export const IncomingReferencesInspector: DocumentInspectorComponent = (
  props: DocumentInspectorProps,
) => {
  const {t} = useTranslation()

  return (
    <Flex flexDirection="column" height="100%" overflow="hidden">
      <DocumentInspectorHeader
        as="header"
        // oxlint-disable-next-line @repo/i18n/no-missing-translation-key -- TODO(SAPP-4649): this key only exists in the validation bundle ('Close validation'), it needs its own string
        closeButtonLabel={t('panel.close-button-aria-label')}
        flex="none"
        onClose={props.onClose}
        title={t('incoming-references.title')}
      />
      <Card flex={1} overflow="auto" padding={3}>
        <IncomingReferencesList />
      </Card>
    </Flex>
  )
}
