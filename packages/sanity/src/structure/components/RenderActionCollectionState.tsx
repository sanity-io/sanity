import {memo, type ReactNode, useMemo} from 'react'
import {
  type DocumentActionComponent,
  type DocumentActionDescription,
  type DocumentActionGroup,
  type DocumentActionProps,
  GetHookCollectionState,
  useTranslation,
} from 'sanity'

import {structureLocaleNamespace} from '../i18n'

/** @internal */
export interface Action<Args, Description> {
  (args: Args): Description | null
}

/** @internal */
export interface RenderActionCollectionProps {
  actions: Action<DocumentActionProps, DocumentActionDescription>[]
  actionProps: Omit<DocumentActionProps, 'onComplete'>
  children: (props: {states: DocumentActionDescription[]}) => ReactNode
  onActionComplete?: () => void
  group?: DocumentActionGroup
}

/** @internal */
export const RenderActionCollectionState = memo((props: RenderActionCollectionProps) => {
  const {actions, children, actionProps, onActionComplete, group} = props

  return (
    <GetHookCollectionState<
      Omit<DocumentActionProps, 'onComplete'>,
      DocumentActionDescription & {action?: DocumentActionComponent['action']}
    >
      onReset={onActionComplete}
      hooks={actions}
      args={actionProps}
      group={group}
    >
      {({states}) => (
        <ActionsGuardWrapper states={states} documentId={actionProps.id}>
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
]

/**
 * TODO: See PR https://github.com/sanity-io/sanity/pull/9289 for the removal of this
 * This will be `const {isLinked} = useCanvasCompanionDoc(documentId)`
 * Do not change this constant to true or all custom actions will be disabled.
 */
const TEMP_DISABLED_BY_CANVAS = false
interface ActionsGuardWrapperProps {
  states: Array<DocumentActionDescription & {action?: DocumentActionComponent['action']}>
  documentId: string
  children: (props: {states: DocumentActionDescription[]}) => ReactNode
}

const ActionsGuardWrapper = (props: ActionsGuardWrapperProps) => {
  const {states, children, documentId} = props
  const {t} = useTranslation(structureLocaleNamespace)
  const result = useMemo(() => {
    if (TEMP_DISABLED_BY_CANVAS) {
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
  }, [children, states, t])

  return result
}
