import {Stack, TextSkeleton} from '@sanity/ui'
import {Flex} from 'ui5'

import {FormRow} from '../layout/FormRow'
import {FormInputSkeleton} from './FormInputSkeleton'

/**
 * Placeholder for a form field while a lazy field component loads. Mirrors `FormField`: a row in
 * the form grid, then a label line with the header's vertical padding (`paddingY={2}` on the
 * header content box plus `paddingY={1}` on the label row), then the input box.
 *
 * @internal
 */
export function FormFieldSkeleton() {
  return (
    <FormRow>
      <Stack data-testid="form-field-skeleton" gap={2}>
        <Flex alignItems="center" paddingY={3}>
          <TextSkeleton animated radius={1} size={1} style={{width: '25%'}} />
        </Flex>
        <FormInputSkeleton />
      </Stack>
    </FormRow>
  )
}
