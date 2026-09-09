import {Stack} from '@sanity/ui'

import {isObjectInputProps} from '../../types/asserters'
import {type InputProps} from '../../types/inputProps'
import {FormFieldSkeleton} from './FormFieldSkeleton'
import {FormInputSkeleton} from './FormInputSkeleton'

/**
 * Fallback for an input while a lazy input component loads. An object input renders one row per
 * field member with the object input's row gap, so its fallback is that many field placeholders;
 * every other input gets the single input box.
 *
 * @internal
 */
export function FormInputFallback({inputProps}: {inputProps: Omit<InputProps, 'renderDefault'>}) {
  if (isObjectInputProps(inputProps)) {
    const rows = inputProps.members.filter(
      (member) => member.kind === 'field' || member.kind === 'fieldSet',
    )
    if (rows.length > 0) {
      return (
        <Stack data-testid="form-object-input-skeleton" gap={6}>
          {rows.map((member) => (
            <FormFieldSkeleton key={member.key} />
          ))}
        </Stack>
      )
    }
  }

  return <FormInputSkeleton />
}
