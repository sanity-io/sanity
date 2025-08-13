// TODO: Remove this eslint-disable
/* eslint-disable @sanity/i18n/no-attribute-template-literals */
import {Box, Card, Flex, Text} from '@sanity/ui'
import {motion} from 'framer-motion'
import {useCallback} from 'react'
import {getPublishedId, type SanityDocument, useSchema} from 'sanity'
import {useRouter} from 'sanity/router'

import {ReferencePreviewLink} from '../../../../components/confirmDeleteDialog/ReferencePreviewLink'
import {usePaneRouter} from '../../../../components/paneRouter/usePaneRouter'

const FadeInFlex = motion(Flex)

const ErrorCard = ({message}: {message: string}) => (
  <Card border radius={2} padding={1} tone="critical">
    <Box paddingY={4} paddingX={3}>
      <Text size={1}>{message}</Text>
    </Box>
  </Card>
)

export const IncomingReferenceDocument = (props: {document: SanityDocument}) => {
  const {document} = props
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
        // TODO: Why is path not passed to the pane?
        [{id: getPublishedId(id), params: {type, path: 'author', extra: 'extra'}}],
      ],
    })
  }, [routerPanesState, groupIndex, type, navigate, id])

  const schemaType = schema.get(document._type)
  if (!schemaType) return <ErrorCard message={`Schema type ${document._type} not found`} />

  return (
    <Card border radius={2} padding={1} tone="default">
      <FadeInFlex initial={{opacity: 0}} animate={{opacity: 1}} gap={1} align="center">
        <Box flex={1}>
          <ReferencePreviewLink
            type={schemaType}
            value={document}
            onClick={handleClick}
            layout="default"
          />
        </Box>
      </FadeInFlex>
    </Card>
  )
}
