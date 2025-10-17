import {ControlsIcon} from '@sanity/icons'
import {Stack} from '@sanity/ui'
import {useCallback, useEffect} from 'react'
import {styled} from 'styled-components'

import {defineDocumentFieldAction} from '../../config/document/fieldActions/define'
import {FormInput} from '../../form/components/FormInput'
import {useFormValue} from '../../form/contexts/FormValue'
import {set, unset} from '../../form/patch'
import {type ObjectFieldProps, type ObjectInputProps} from '../../form/types'
import {type DecideField} from './types'

const VARIANTS_PATH = 'variants'
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
  useAction() {
    const onAction = useCallback(() => {
      // Simplified action - could expand conditions or show help
      // Future: implement variant configuration UI
    }, [])

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
  const {path, onChange} = props
  const value = useFormValue(path) as DecideField

  useEffect(() => {
    if (value && !value?._type) {
      onChange(set('sanity.decideField', ['_type']))
    }
    // Check if only value._type is present, if it's the only key remove it to remove the object
    if (value && Object.keys(value).length === 1 && value._type) {
      onChange(unset(['_type']))
    }
  }, [onChange, value])

  return (
    <Stack space={2}>
      <FormInput {...props} relativePath={['default']} />
      <FormInput {...props} includeField relativePath={[VARIANTS_PATH]} />
    </Stack>
  )
}
