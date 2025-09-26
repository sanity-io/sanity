import {Box, Card, Flex, Text} from '@sanity/ui'
import {motion} from 'framer-motion'
import {useCallback} from 'react'
import {getPublishedId, pathToString, type SanityDocument, useSchema, useTranslation} from 'sanity'
import {useRouter} from 'sanity/router'

import {usePaneRouter} from '../../../../components/paneRouter/usePaneRouter'
import {structureLocaleNamespace} from '../../../../i18n'
import {getReferencePaths} from './getReferencePaths'
import {IncomingReferencePreview} from './IncomingReferencePreview'

const FadeInFlex = motion(Flex)

export const IncomingReferenceDocument = (props: {
  document: SanityDocument
  referenceToId: string
}) => {
  const {t} = useTranslation(structureLocaleNamespace)
  const {document, referenceToId} = props
  const referencePaths = getReferencePaths(document, referenceToId)
  const id = document._id
  const schema = useSchema()
  const {navigate} = useRouter()
  const {routerPanesState, groupIndex} = usePaneRouter()

  const type = document?._type

  const handleClick = useCallback(() => {
    if (!type) return // This should not happen
    navigate({
      panes: [
        ...routerPanesState.slice(0, groupIndex + 1),
        [{id: getPublishedId(id), params: {type, path: pathToString(referencePaths[0])}}],
      ],
    })
  }, [routerPanesState, groupIndex, type, navigate, id, referencePaths])

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
          <IncomingReferencePreview
            type={schemaType}
            value={document}
            onClick={handleClick}
            path={referencePaths[0]}
          />
        </Box>
      </FadeInFlex>
    </Card>
  )
}
