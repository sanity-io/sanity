import {type Path, type SchemaType} from '@sanity/types'
import {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {type DocumentFieldAction, type DocumentFieldActionNode} from '../../../config'
import {useUnique} from '../../../util'
import {filterActions} from './helpers'

/** @internal */
export interface FieldActionsProps {
  actions: DocumentFieldAction[]
  documentId: string
  documentType: string
  onActions: (actions: DocumentFieldActionNode[]) => void
  path: Path
  schemaType: SchemaType
}

/**
 *
 * The `FieldActionsResolver` component is responsible for resolving the actions for a given field.
 *
 * Since each field action is a React hook, they need to be rendered in a component that returns
 * `null` to allow for the hook's return value to be resolved.
 *
 * The way this works:
 *
 * - The parent component (`FieldProvider`) renders the `FieldActionsResolver` component.
 * - The `FieldActionsResolver` component renders each field action as a child component.
 * - Each field action is a React hook that returns a node, and calls `setFieldAction` with its
 *   index and value.
 * - The `FieldActionsResolver` keeps a state with the array of hook values, making sure the array
 *   has the same length as the number of actions.
 * - The `FieldActionsResolver` calls `onActions` with the array of hook values.
 *
 * @internal
 */
export const FieldActionsResolver = memo(function FieldActionsResolver(props: FieldActionsProps) {
  const {actions, documentId, documentType, onActions, path, schemaType} = props

  const len = actions.length
  const lenRef = useRef(len)

  const [fieldActions, setFieldActions] = useState<DocumentFieldActionNode[]>(() =>
    Array.from(new Array(len)),
  )

  const fieldActionsRef = useRef(fieldActions)

  const setFieldAction = useCallback((index: number, node: DocumentFieldActionNode) => {
    setFieldActions((prev) => {
      const next = [...prev]
      next[index] = node
      return next
    })
  }, [])

  useEffect(() => {
    if (fieldActionsRef.current !== fieldActions) {
      fieldActionsRef.current = fieldActions
      onActions(filterActions(fieldActions))
    }
  }, [fieldActions, onActions])

  useEffect(() => {
    if (lenRef.current !== len) {
      const newFieldActions = Array.from(new Array(len))

      for (let i = 0; i < len; i++) {
        newFieldActions[i] = fieldActionsRef.current[i]
      }

      lenRef.current = len

      setFieldActions(newFieldActions)
      fieldActionsRef.current = newFieldActions
    }
  }, [len])

  const FieldActions = useMemo(() => {
    return actions.map((action, index) => {
      return defineFieldActionComponent({
        action,
        documentId,
        documentType,
        index,
        path,
        schemaType,
        setFieldAction,
      })
    })
  }, [actions, documentId, documentType, path, schemaType, setFieldAction])

  return (
    <>
      {FieldActions.map((FieldAction, key) => (
        <FieldAction
          // eslint-disable-next-line react/no-array-index-key
          key={key}
        />
      ))}
    </>
  )
})

function defineFieldActionComponent({
  action,
  documentId,
  documentType,
  index,
  path,
  schemaType,
  setFieldAction,
}: {
  action: DocumentFieldAction
  documentId: string
  documentType: string
  index: number
  path: Path
  schemaType: SchemaType
  setFieldAction: (index: number, node: DocumentFieldActionNode) => void
}) {
  const {useAction} = action
  return memo(function FieldAction() {
    const _action = useAction({
      documentId,
      documentType,
      path,
      schemaType,
    })
    const node = useUnique(_action)

    useEffect(() => {
      setFieldAction(index, node)
    }, [node])

    return null
  })
}
