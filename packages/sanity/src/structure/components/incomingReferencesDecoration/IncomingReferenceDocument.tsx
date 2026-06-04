import {Box, Card, Flex, Text} from '@sanity/ui'
import {motion, type Variants} from 'motion/react'
import {useState} from 'react'
import {
  getReferencePaths,
  SanityDefaultPreview,
  type SanityDocument,
  useSchema,
  useTranslation,
} from 'sanity'

import {structureLocaleNamespace} from '../../i18n'
import {IncomingReferenceDocumentActions} from './IncomingReferenceDocumentActions'
import {IncomingReferencePreview} from './IncomingReferencePreview'
import {type IncomingReferencesOptions} from './types'

const Root = motion.create(Flex)

const variants: Variants = {
  initial: {opacity: 0},
  animate: {opacity: 1},
  actionInProgress: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.8,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}
const ErrorCard = ({message}: {message: string}) => (
  <Card border radius={2} padding={1} tone="critical">
    <Box paddingY={4} paddingX={3}>
      <Text size={1}>{message}</Text>
    </Box>
  </Card>
)

export const IncomingReferenceDocument = (props: {
  document: SanityDocument
  referenceToId: string
  actions: IncomingReferencesOptions['actions']
}) => {
  const {document, referenceToId, actions} = props
  const referencePaths = getReferencePaths(document, referenceToId)
  const [isExecutingAction, setIsExecutingAction] = useState(false)
  const schema = useSchema()
  const type = document?._type
  const {t} = useTranslation(structureLocaleNamespace)

  const schemaType = schema.get(type)

  if (!schemaType)
    return <ErrorCard message={t('incoming-references-input.schema-type-not-found', {type})} />

  return (
    <Root
      initial="initial"
      animate={isExecutingAction ? 'actionInProgress' : 'animate'}
      gap={1}
      align="center"
      variants={variants}
    >
      <Box flex={1}>
        {/* In some cases when the document has been recently linked the value we get
          in the listener is not the latest, but a previous value with the document not yet linked, this handles that */}
        {referencePaths.length > 0 ? (
          <IncomingReferencePreview type={schemaType} value={document} path={referencePaths[0]} />
        ) : (
          <SanityDefaultPreview icon={schemaType.icon} layout={'default'} isPlaceholder />
        )}
      </Box>

      {actions && actions?.length > 0 && (
        <IncomingReferenceDocumentActions
          document={document}
          actions={actions}
          isExecutingAction={isExecutingAction}
          setIsExecutingAction={setIsExecutingAction}
        />
      )}
    </Root>
  )
}
