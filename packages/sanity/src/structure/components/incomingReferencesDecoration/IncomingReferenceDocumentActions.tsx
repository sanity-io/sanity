import {Box, Menu} from '@sanity/ui'
import {type Dispatch, type SetStateAction, useCallback, useState} from 'react'
import {
  ContextMenuButton,
  GetHookCollectionState,
  LegacyLayerProvider,
  type SanityDocument,
  useSource,
} from 'sanity'

import {MenuButton} from '../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../ui-components/menuItem/MenuItem'
import {ActionStateDialog} from '../../panes/document/statusBar/ActionStateDialog'
import {
  type IncomingReferenceAction,
  type IncomingReferenceActionDescription,
  type IncomingReferenceActionsContext,
} from './types'

const IncomingReferenceDocumentActionsInner = ({
  states,
  document,
  setIsExecutingAction,
  isExecutingAction,
}: {
  states: IncomingReferenceActionDescription[]
  document: SanityDocument
  setIsExecutingAction: Dispatch<SetStateAction<boolean>>
  isExecutingAction: boolean
}) => {
  const [actionIndex, setActionIndex] = useState(-1)
  const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null)
  const currentAction = states[actionIndex]

  if (!states.length) return null
  return (
    <>
      <Box ref={setReferenceElement}>
        <MenuButton
          button={<ContextMenuButton loading={isExecutingAction} />}
          id={`${document._id}-menuButton`}
          menu={
            <Menu>
              {states.map((action, index) => (
                <MenuItem
                  key={action.label}
                  text={action.label}
                  icon={action.icon}
                  tone={action.tone}
                  disabled={Boolean(action.disabled)}
                  onClick={async () => {
                    setActionIndex(index)
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
      {currentAction && currentAction.dialog && (
        <LegacyLayerProvider zOffset="pane">
          <ActionStateDialog dialog={currentAction.dialog} referenceElement={referenceElement} />
        </LegacyLayerProvider>
      )}
    </>
  )
}

export const IncomingReferenceDocumentActions = (props: {
  document: SanityDocument
  actions: IncomingReferenceAction[]
  isExecutingAction: boolean
  setIsExecutingAction: Dispatch<SetStateAction<boolean>>
}) => {
  const {document, actions, setIsExecutingAction, isExecutingAction} = props
  const {getClient} = useSource()

  const renderActions = useCallback<
    (props: {states: IncomingReferenceActionDescription[]}) => React.ReactNode
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
    <GetHookCollectionState<IncomingReferenceActionsContext, IncomingReferenceActionDescription>
      hooks={actions}
      args={{document, getClient}}
    >
      {renderActions}
    </GetHookCollectionState>
  )
}
