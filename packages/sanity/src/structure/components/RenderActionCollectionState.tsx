import {memo, type ReactNode, useMemo} from 'react'
import {
  type DocumentActionComponent,
  type DocumentActionDescription,
  type DocumentActionGroup,
  type DocumentActionProps,
  getDraftId,
  GetHookCollectionState,
  getPublishedId,
  useCanvasCompanionDoc,
  useTranslation,
} from 'sanity'

import {structureLocaleNamespace} from '../i18n'

/** @internal */
export interface Action<Args, Description> {
  (args: Args): Description | null
}
export interface ResolvedAction extends DocumentActionDescription {
  action?: DocumentActionComponent['action']
}

/** @internal */
export interface RenderActionCollectionProps {
  actions: Action<DocumentActionProps, DocumentActionDescription>[]
  actionProps: Omit<DocumentActionProps, 'onComplete'>
  children: (props: {states: ResolvedAction[]}) => ReactNode
  onActionComplete?: () => void
  group?: DocumentActionGroup
}

/** @internal */
export const RenderActionCollectionState = memo((props: RenderActionCollectionProps) => {
  const {actions, children, actionProps, onActionComplete, group} = props

  return (
    <GetHookCollectionState<Omit<DocumentActionProps, 'onComplete'>, ResolvedAction>
      onReset={onActionComplete}
      hooks={actions}
      args={actionProps}
      group={group}
    >
      {({states}) => (
        <ActionsGuardWrapper
          states={states}
          documentId={
            actionProps.liveEditSchemaType
              ? getPublishedId(actionProps.id)
              : getDraftId(actionProps.id)
          }
        >
          {children}
        </ActionsGuardWrapper>
      )}
    </GetHookCollectionState>
  )
})
RenderActionCollectionState.displayName = 'Memo(RenderActionCollectionState)'

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
]

interface ActionsGuardWrapperProps {
  states: ResolvedAction[]
  documentId: string
  children: (props: {states: ResolvedAction[]}) => ReactNode
}

const ActionsGuardWrapper = (props: ActionsGuardWrapperProps) => {
  const {states, children, documentId} = props
  const {t} = useTranslation(structureLocaleNamespace)
  const {isLinked} = useCanvasCompanionDoc(documentId)

  const result = useMemo(() => {
    if (isLinked) {
      return children({
        states: states.map((s) => {
          if (!s.action || !SUPPORTED_LINKED_TO_CANVAS_ACTIONS.includes(s.action)) {
            return {
              ...s,
              disabled: true,
              title: t('action.disabled-by-canvas.tooltip'),
            }
          }
          return s
        }),
      })
    }
    return children({states})
  }, [children, states, t, isLinked])

  return result
}
