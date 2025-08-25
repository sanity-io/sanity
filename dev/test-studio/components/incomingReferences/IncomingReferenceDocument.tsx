import {EllipsisHorizontalIcon, TrashIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Menu, MenuButton, MenuItem, Text} from '@sanity/ui'
import {motion} from 'framer-motion'
import {useCallback, useMemo, useState} from 'react'
import {
  ContextMenuButton,
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  getPublishedId,
  pathToString,
  SanityDefaultPreview,
  type SanityDocument,
  useClient,
  useSchema,
} from 'sanity'
import {useRouter} from 'sanity/router'
import {usePaneRouter} from 'sanity/structure'

import {getReferencePaths} from './getReferencePaths'
import {IncomingReferencePreview} from './IncomingReferencePreview'
import {type OnUnlinkDocumentCallback} from './types'

const FadeInFlex = motion.create(Flex)

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
  onUnlinkDocument: OnUnlinkDocumentCallback | undefined
}) => {
  const {document, referenceToId, onUnlinkDocument} = props
  const referencePaths = getReferencePaths(document, referenceToId)
  const [isUnlinking, setIsUnlinking] = useState(false)
  const id = document._id
  const schema = useSchema()
  const {navigate} = useRouter()
  const {routerPanesState, groupIndex} = usePaneRouter()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
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
  const canUnlink = useMemo(
    () => onUnlinkDocument?.(document, referenceToId),
    [onUnlinkDocument, document, referenceToId],
  )
  const handleUnlink = useCallback(async () => {
    if (!canUnlink) return
    const unlinkedDocument = onUnlinkDocument?.(document, referenceToId)
    if (!unlinkedDocument) return
    await client.createOrReplace(unlinkedDocument)
  }, [canUnlink, onUnlinkDocument, document, referenceToId, client])

  if (!schemaType) return <ErrorCard message={`Schema type ${document._type} not found`} />
  return (
    <Card radius={2} tone="default">
      <FadeInFlex initial={{opacity: 0}} animate={{opacity: 1}} gap={1} align="center">
        <Box flex={1}>
          {/* In some cases when the document has been recently linked the value we get 
          in the listener is not the latest, but a previous value with the document not yet linked, this handles that */}
          {referencePaths.length > 0 ? (
            <IncomingReferencePreview
              type={schemaType}
              value={document}
              onClick={handleClick}
              path={referencePaths[0]}
            />
          ) : (
            <SanityDefaultPreview icon={schemaType.icon} layout={'default'} isPlaceholder />
          )}
        </Box>
        {onUnlinkDocument && (
          <Box>
            <MenuButton
              button={<ContextMenuButton loading={isUnlinking} />}
              id={`${document._id}-menuButton`}
              menu={
                <Menu>
                  <MenuItem
                    text="Remove"
                    tone="critical"
                    icon={TrashIcon}
                    disabled={!canUnlink}
                    onClick={handleUnlink}
                  />
                </Menu>
              }
              popover={{portal: true, tone: 'default'}}
            />
          </Box>
        )}
      </FadeInFlex>
    </Card>
  )
}
