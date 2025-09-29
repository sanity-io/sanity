import {Box, Menu} from '@sanity/ui'
import {type Dispatch, type SetStateAction, useCallback} from 'react'
import {
  ContextMenuButton,
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  type DocumentActionDescription,
  GetHookCollectionState,
  type SanityDocument,
  useClient,
} from 'sanity'

import {MenuButton} from '../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../ui-components/menuItem/MenuItem'
import {
  type IncomingReferenceAction,
  type LinkedDocumentAction,
  type LinkedDocumentActionsContext,
} from './types'

const IncomingReferenceDocumentActionsInner = ({
  states,
  document,
  setIsExecutingAction,
  isExecutingAction,
}: {
  states: DocumentActionDescription[]
  document: SanityDocument
  setIsExecutingAction: Dispatch<SetStateAction<boolean>>
  isExecutingAction: boolean
}) => {
  if (!states.length) return null
  return (
    <Box>
      <MenuButton
        button={<ContextMenuButton loading={isExecutingAction} />}
        id={`${document._id}-menuButton`}
        menu={
          <Menu>
            {states.map((action) => (
              <MenuItem
                key={action.label}
                text={action.label}
                icon={action.icon}
                tone={action.tone}
                disabled={Boolean(action.disabled) || !action.onHandle}
                onClick={async () => {
                  setIsExecutingAction(true)
                  await action.onHandle?.()
                  setIsExecutingAction(false)
                }}
              />
            ))}
          </Menu>
        }
        popover={{portal: true, tone: 'default'}}
      />
    </Box>
  )
}

export const IncomingReferenceDocumentActions = (props: {
  document: SanityDocument
  actions: IncomingReferenceAction[]
  isExecutingAction: boolean
  setIsExecutingAction: Dispatch<SetStateAction<boolean>>
}) => {
  const {document, actions, setIsExecutingAction, isExecutingAction} = props
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const renderActions = useCallback<
    (props: {states: DocumentActionDescription[]}) => React.ReactNode
  >(
    ({states}) => (
      <IncomingReferenceDocumentActionsInner
        key={document._id}
        states={states}
        document={document}
        setIsExecutingAction={setIsExecutingAction}
        isExecutingAction={isExecutingAction}
      />
    ),
    [document, setIsExecutingAction, isExecutingAction],
  )

  return (
    <GetHookCollectionState<LinkedDocumentActionsContext, LinkedDocumentAction>
      hooks={actions}
      args={{linkedDocument: document, client}}
    >
      {renderActions}
    </GetHookCollectionState>
  )
}
