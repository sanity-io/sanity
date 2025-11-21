import {useMemo, useRef} from 'react'
import {
  type DocumentActionComponent,
  type DocumentActionDescription,
  type DocumentActionProps,
  EMPTY_ARRAY,
  getDocumentIdForCanvasLink,
  GetHookCollectionState,
  useCanvasCompanionDoc,
  useTranslation,
} from 'sanity'
import {DocumentActionsStateContext} from 'sanity/_singletons'

import {structureLocaleNamespace} from './i18n'
import {useDocumentPane} from './panes/document/useDocumentPane'

interface ResolvedAction extends DocumentActionDescription {
  action?: DocumentActionComponent['action']
}

/** @internal */
export function DocumentActionsProvider(props: {children: React.ReactNode}) {
  const {children} = props

  const {actions, editState, isInitialValueLoading, revisionId} = useDocumentPane()

  const onCompleteRef = useRef<() => void>(null)

  const actionProps: Omit<DocumentActionProps, 'onComplete'> | null = useMemo(
    () =>
      editState
        ? {
            ...editState,
            revision: revisionId || undefined,
            initialValueResolved: !isInitialValueLoading,
          }
        : null,
    [editState, isInitialValueLoading, revisionId],
  )

  if (!actionProps) {
    return null
  }

  return (
    <GetHookCollectionState<DocumentActionProps, ResolvedAction>
      args={{
        ...actionProps,
        onComplete: () => onCompleteRef.current?.(),
      }}
      hooks={actions || EMPTY_ARRAY}
      resetRef={onCompleteRef}
    >
      {({states}) => (
        <ActionsGuardWrapper states={states} actionProps={actionProps}>
          {children}
        </ActionsGuardWrapper>
      )}
    </GetHookCollectionState>
  )
}

/**
 * This is a list of the actions that are supported when a document is linked to Canvas.
 * Custom actions and actions that are not supported by Canvas will be disabled and will include a tooltip explaining that the action is not supported.
 */
const SUPPORTED_LINKED_TO_CANVAS_ACTIONS: DocumentActionComponent['action'][] = [
  'delete',
  'duplicate',
  'publish',
  'unpublish',
  'unlinkFromCanvas',
  'editInCanvas',
  'linkToCanvas',
  'schedule',
  'discardVersion',
  'unpublishVersion',
]

interface ActionsGuardWrapperProps {
  states: ResolvedAction[]
  actionProps: Omit<DocumentActionProps, 'onComplete'>
  children: React.ReactNode
}

// merge this into the DocumentActionsProvider itself
function ActionsGuardWrapper(props: ActionsGuardWrapperProps) {
  const {states, children, actionProps} = props
  const {t} = useTranslation(structureLocaleNamespace)

  const {isLinked} = useCanvasCompanionDoc(getDocumentIdForCanvasLink(actionProps))

  return (
    <DocumentActionsStateContext.Provider
      value={
        isLinked
          ? states.map((s) => {
              if (!s.action || !SUPPORTED_LINKED_TO_CANVAS_ACTIONS.includes(s.action)) {
                return {
                  ...s,
                  disabled: true,
                  title: t('action.disabled-by-canvas.tooltip'),
                }
              }
              return s
            })
          : states
      }
    >
      {children}
    </DocumentActionsStateContext.Provider>
  )
}
