import {Box, Card, Flex, Text} from '@sanity/ui'
import {motion} from 'motion/react'
import {getReferencePaths, type SanityDocument, useSchema, useTranslation} from 'sanity'

import {IncomingReferencePreview} from '../../../../components/incomingReferencesDecoration/IncomingReferencePreview'
import {structureLocaleNamespace} from '../../../../i18n'

const FadeInFlex = motion.create(Flex)

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
      <FadeInFlex initial={{opacity: 0}} animate={{opacity: 1}} gap={1} align="center">
        <Box flex={1}>
          {/* The document may not hold a reference to this document yet – eg. when the listener
              is behind after a reference was just created – in which case there is no path to
              deep link to, and the preview links to the document itself */}
          <IncomingReferencePreview type={schemaType} value={document} path={referencePaths[0]} />
        </Box>
      </FadeInFlex>
    </Card>
  )
}
