import {Box, Card, Flex, Menu, MenuButton, MenuItem, Text} from '@sanity/ui'
import {motion, type Variants} from 'framer-motion'
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
import {type LinkedDocumentActions} from './types'

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
  actions: LinkedDocumentActions | undefined
}) => {
  const {document, referenceToId, actions} = props
  const referencePaths = getReferencePaths(document, referenceToId)
  const [isExecutingAction, setIsExecutingAction] = useState(false)
  const id = document._id
  const schema = useSchema()
  const {navigate} = useRouter()
  const {routerPanesState, groupIndex} = usePaneRouter()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const type = document?._type

  const resolvedActions = useMemo(() => {
    return actions?.({
      linkedDocument: document,
      client,
    })
  }, [document, client, actions])

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
      {resolvedActions && resolvedActions.length > 0 && (
        <Box>
          <MenuButton
            button={<ContextMenuButton loading={isExecutingAction} />}
            id={`${document._id}-menuButton`}
            menu={
              <Menu>
                {resolvedActions.map((action) => (
                  <MenuItem
                    key={action.label}
                    text={action.label}
                    icon={action.icon}
                    tone={action.tone}
                    onClick={async () => {
                      setIsExecutingAction(true)
                      await action.onClick()
                      setIsExecutingAction(false)
                    }}
                  />
                ))}
              </Menu>
            }
            popover={{portal: true, tone: 'default'}}
          />
        </Box>
      )}
    </Root>
  )
}
