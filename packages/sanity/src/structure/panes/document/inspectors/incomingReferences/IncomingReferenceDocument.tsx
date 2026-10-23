import {Card, Text} from '@sanity/ui'
import {getReferencePaths, type SanityDocument, useSchema, useTranslation} from 'sanity'
import {Flex, Box} from 'ui5'

import {IncomingReferencePreview} from '../../../../components/incomingReferencesDecoration/IncomingReferencePreview'
import {structureLocaleNamespace} from '../../../../i18n'
import {fadeInFlex} from './IncomingReferenceDocument.css'

export const IncomingReferenceDocument = (props: {
  document: SanityDocument
  referenceToId: string
}) => {
  const {t} = useTranslation(structureLocaleNamespace)
  const {document, referenceToId} = props
  const referencePaths = getReferencePaths(document, referenceToId)
  const schema = useSchema()

  const schemaType = schema.get(document._type)
  if (!schemaType)
    return (
      <Card radius={2} tone="critical">
        <Box paddingY={4} paddingX={3}>
          <Text size={1}>
            {t('incoming-references-pane.schema-type-not-found', {type: document._type})}
          </Text>
        </Box>
      </Card>
    )

  return (
    <Card radius={2} tone="default">
      <Flex className={fadeInFlex} gap={1} alignItems="center">
        <Box flexBasis="0%" flexGrow={1}>
          <IncomingReferencePreview type={schemaType} value={document} path={referencePaths[0]} />
        </Box>
      </Flex>
    </Card>
  )
}
