import {type ReferenceSchemaType} from '@sanity/types'
import {useRef, useState} from 'react'

import type {DocumentFieldActionNode} from '../../../config/document/fieldActions/types'
import {FormField} from '../../components/formField/FormField'
import {usePublishedId} from '../../contexts/DocumentIdProvider'
import {FieldActionsProvider} from '../../field/actions/FieldActionsProvider'
import {FieldActionsResolver} from '../../field/actions/FieldActionsResolver'
import {useDidUpdate} from '../../hooks/useDidUpdate'
import {useScrollIntoViewOnFocusWithin} from '../../hooks/useScrollIntoViewOnFocusWithin'
import type {ObjectFieldProps} from '../../types/fieldProps'

interface ReferenceFieldProps extends Omit<ObjectFieldProps, 'renderDefault'> {
  schemaType: ReferenceSchemaType
}

export function ReferenceField(props: ReferenceFieldProps) {
  const elementRef = useRef<HTMLDivElement | null>(null)
  const {schemaType, path, open, inputId, children, inputProps} = props

  const [fieldActionsNodes, setFieldActionNodes] = useState<DocumentFieldActionNode[]>([])
  const documentId = usePublishedId()

  // this is here to make sure the item is visible if it's being edited behind a modal
  useScrollIntoViewOnFocusWithin(elementRef, open)

  useDidUpdate(inputProps.focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus && elementRef.current) {
      // Note: if editing an inline item, focus is handled by the item input itself and no ref is being set
      elementRef.current.focus()
    }
  })

  return (
    <>
      {documentId && props.actions && props.actions.length > 0 && (
        <FieldActionsResolver
          actions={props.actions}
          documentId={documentId}
          documentType={schemaType.name}
          onActions={setFieldActionNodes}
          path={path}
          schemaType={schemaType}
        />
      )}

      <FieldActionsProvider
        actions={fieldActionsNodes}
        focused={Boolean(props.inputProps.focused)}
        path={path}
      >
        <FormField
          __internal_comments={props.__internal_comments}
          __internal_slot={props.__internal_slot}
          __unstable_headerActions={fieldActionsNodes}
          __unstable_presence={props.presence}
          description={props.description}
          inputId={inputId}
          level={props.level}
          title={props.title}
          validation={props.validation}
          deprecated={props.schemaType.deprecated}
        >
          {children}
        </FormField>
      </FieldActionsProvider>
    </>
  )
}
