import {ControlsIcon} from '@sanity/icons'
import {Button, Flex, Stack} from '@sanity/ui'
import * as Path from '@sanity/util/paths'
import {uuid} from '@sanity/uuid'
import {useCallback, useEffect} from 'react'
import {
  defineDocumentFieldAction,
  EditPortal,
  FormInput,
  insert,
  type ObjectFieldProps,
  type ObjectInputProps,
  set,
  unset,
  useFormValue,
} from 'sanity'
import {useDocumentPane} from 'sanity/structure'
import {styled} from 'styled-components'

import {type DecideObject} from './types'

const CONDITIONS_PATH = 'conditions'
const DecideFieldWrapper = styled.div`
  /* the second div inside the fieldset of the decide field should not have padding */
  & > fieldset > div:nth-child(2) {
    padding: 0;
    border-left: none;
    box-shadow: none;
  }
`

export const copyAction = defineDocumentFieldAction({
  name: 'addVariant',
  useAction(context) {
    const {path} = context
    const {onPathOpen} = useDocumentPane()
    const onAction = useCallback(() => {
      //  Set the context to open the decide field
      onPathOpen(path.concat([CONDITIONS_PATH]))
    }, [onPathOpen, path])

    return {
      type: 'action',
      icon: ControlsIcon,
      onAction,
      title: 'Configure variants',
    }
  },
})

export function DecideObjectField(props: ObjectFieldProps) {
  return (
    <DecideFieldWrapper data-ui="decide-field-wrapper">
      {props.renderDefault({...props, actions: [...(props.actions || []), copyAction]})}
    </DecideFieldWrapper>
  )
}

export const DecideObjectInput = (props: ObjectInputProps) => {
  const {openPath, onPathOpen} = useDocumentPane()
  const {path, onChange} = props
  const value = useFormValue(path) as DecideObject | undefined
  const isConditionsOpen = Path.toString(openPath).startsWith(
    Path.toString(path.concat([CONDITIONS_PATH])),
  )

  useEffect(() => {
    if (value && !value?._type) {
      onChange(set('sanity.decideField', ['_type']))
    }
    // Check if only value._type is present, if it's the only key remove it to remove the object
    if (value && Object.keys(value).length === 1 && value._type) {
      onChange(unset(['_type']))
    }
  }, [onChange, value?._type, value])

  return (
    <Stack space={2}>
      <FormInput {...props} relativePath={['default']} />
      {isConditionsOpen && (
        <EditPortal
          type="dialog"
          header="Conditions"
          id="conditions-edit-portal"
          onClose={() => onPathOpen(path)}
          width={props.schemaType.options?.modal?.width ?? 1}
        >
          <FormInput {...props} includeField relativePath={[CONDITIONS_PATH]} />
        </EditPortal>
      )}
      {value?.conditions && value.conditions.length > 0 && (
        <Flex justify="space-between" align="center">
          <Button
            size={1}
            mode="bleed"
            tone="default"
            padding={2}
            space={2}
            muted
            text={`${value.conditions.length} variants available`}
            onClick={() => onPathOpen(path.concat([CONDITIONS_PATH]))}
          />

          <Button
            mode="bleed"
            tone="default"
            padding={2}
            space={2}
            text="Add variant"
            onClick={() => {
              // Do a mutation to create a new condition
              const key = uuid()
              const newCondition = {
                _key: key,
                _type: 'condition',
              }
              onChange(insert([newCondition], 'after', [CONDITIONS_PATH, -1]))
              onPathOpen(path.concat([CONDITIONS_PATH, {_key: key}]))
            }}
          />
        </Flex>
      )}
    </Stack>
  )
}
