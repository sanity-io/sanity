import {Box, Card, Flex, Text} from '@sanity/ui'
import {motion} from 'framer-motion'
import {
  getReferencePaths,
  IncomingReferencePreview,
  type SanityDocument,
  useSchema,
  useTranslation,
} from 'sanity'

import {structureLocaleNamespace} from '../../../../i18n'

const FadeInFlex = motion(Flex)

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
      <Card border radius={2} padding={1} tone="critical">
        <Box paddingY={4} paddingX={3}>
          <Text size={1}>
            {t('incoming-references-pane.schema-type-not-found', {type: document._type})}
          </Text>
        </Box>
      </Card>
    )

  return (
    <Card border radius={2} padding={1} tone="default">
      <FadeInFlex initial={{opacity: 0}} animate={{opacity: 1}} gap={1} align="center">
        <Box flex={1}>
          <IncomingReferencePreview type={schemaType} value={document} path={referencePaths[0]} />
        </Box>
      </FadeInFlex>
    </Card>
  )
}
