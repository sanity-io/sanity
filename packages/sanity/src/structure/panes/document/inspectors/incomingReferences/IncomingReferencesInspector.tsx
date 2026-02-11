import {Card, Flex} from '@sanity/ui'
import {type DocumentInspectorComponent, type DocumentInspectorProps, useTranslation} from 'sanity'

import {DocumentInspectorHeader} from '../../documentInspector/DocumentInspectorHeader'
import {IncomingReferencesList} from './IncomingReferencesList'

export const IncomingReferencesInspector: DocumentInspectorComponent = (
  props: DocumentInspectorProps,
) => {
  const {t} = useTranslation()

  return (
    <Flex direction="column" height="fill" overflow="hidden">
      <DocumentInspectorHeader
        as="header"
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
