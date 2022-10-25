import React, {useMemo} from 'react'
import {Box} from '@sanity/ui'
import {FormNodeValidation} from '@sanity/types'
import {FieldPresence, FormNodePresence} from '../../../../presence'
import {FormFieldValidationStatus} from '../../../components'

export function useArrayItemPresence(childPresence: FormNodePresence[]) {
  return useMemo(() => {
    return childPresence.length === 0 ? null : (
      <FieldPresence presence={childPresence} maxAvatars={1} />
    )
  }, [childPresence])
}

export function useArrayItemValidation(childValidation: FormNodeValidation[]) {
  return useMemo(() => {
    return childValidation.length === 0 ? null : (
      <Box marginLeft={1} paddingX={1} paddingY={3}>
        <FormFieldValidationStatus validation={childValidation} __unstable_showSummary />
      </Box>
    )
  }, [childValidation])
}
