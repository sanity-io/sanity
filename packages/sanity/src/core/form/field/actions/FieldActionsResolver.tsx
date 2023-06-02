import {Path, SchemaType} from '@sanity/types'
import React, {memo, useCallback, useEffect, useRef, useState} from 'react'
import {DocumentFieldAction, DocumentFieldActionNode} from '../../../config'
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
export const FieldActionsResolver = memo(function FieldActions(props: FieldActionsProps) {
  const {actions, documentId, documentType, onActions, path, schemaType} = props

  const len = actions.length
  const lenRef = useRef(len)

  const [fieldActions, setFieldActions] = useState<DocumentFieldActionNode[]>(() =>
    Array.from(new Array(len))
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

  return (
    <>
      {actions.map((a, aIdx) => (
        <FieldAction
          action={a}
          index={aIdx}
          // eslint-disable-next-line react/no-array-index-key
          key={aIdx}
          documentId={documentId}
          documentType={documentType}
          path={path}
          schemaType={schemaType}
          setFieldAction={setFieldAction}
        />
      ))}
    </>
  )
})

interface FieldActionProps {
  action: DocumentFieldAction
  documentId: string
  documentType: string
  index: number
  path: Path
  schemaType: SchemaType
  setFieldAction: (index: number, node: DocumentFieldActionNode) => void
}

const FieldAction = memo(function FieldAction(props: FieldActionProps) {
  const {action, documentId, documentType, index, path, schemaType, setFieldAction} = props

  const node = useUnique(
    action.useAction({
      documentId,
      documentType,
      path,
      schemaType,
    })
  )

  useEffect(() => {
    setFieldAction(index, node)
  }, [index, node, setFieldAction])

  return null
})
