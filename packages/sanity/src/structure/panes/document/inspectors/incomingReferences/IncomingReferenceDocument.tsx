// TODO: Remove this eslint-disable
/* eslint-disable @sanity/i18n/no-attribute-string-literals */
/* eslint-disable @sanity/i18n/no-attribute-template-literals */
import {TrashIcon} from '@sanity/icons'
import {Box, Card, Flex, Menu, Text} from '@sanity/ui'
import {motion} from 'framer-motion'
import {useCallback} from 'react'
import {
  ContextMenuButton,
  getPublishedId,
  pathToString,
  type SanityDocument,
  useDocumentOperation,
  useSchema,
} from 'sanity'
import {useRouter} from 'sanity/router'

import {MenuButton} from '../../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {usePaneRouter} from '../../../../components/paneRouter/usePaneRouter'
import {getReferencePaths} from './getReferencePaths'
import {IncomingReferencePreview} from './IncomingReferencePreview'

const FadeInFlex = motion(Flex)

const ErrorCard = ({message}: {message: string}) => (
  <Card border radius={2} padding={1} tone="critical">
    <Box paddingY={4} paddingX={3}>
      <Text size={1}>{message}</Text>
    </Box>
  </Card>
)

const RemoveMenuItem = ({document}: {document: SanityDocument}) => {
  const documentOperation = useDocumentOperation(getPublishedId(document._id), document._type)

  const handleRemoveReference = useCallback(() => {
    // Removes the reference to the document in the pane from the document referring it.
    // TODO: Get the reference field from the document
    documentOperation.patch.execute([{unset: ['author']}])
  }, [documentOperation])

  return <MenuItem text="Remove" tone="critical" icon={TrashIcon} onClick={handleRemoveReference} />
}

export const IncomingReferenceDocument = (props: {
  document: SanityDocument
  referenceToId: string
}) => {
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
  if (!schemaType) return <ErrorCard message={`Schema type ${document._type} not found`} />

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
        {/* <Box>
          <MenuButton
            button={<ContextMenuButton />}
            id={`${document._id}-menuButton`}
            menu={
              <Menu>
                <RemoveMenuItem document={document} />
              </Menu>
            }
            popover={{portal: true, tone: 'default'}}
          />
        </Box> */}
      </FadeInFlex>
    </Card>
  )
}
