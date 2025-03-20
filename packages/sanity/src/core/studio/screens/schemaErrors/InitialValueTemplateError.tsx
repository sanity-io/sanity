/* eslint-disable i18next/no-literal-string,@sanity/i18n/no-attribute-string-literals */
import {Stack, Text} from '@sanity/ui'

import {Dialog} from '../../../../ui-components/dialog/Dialog'

export function InitialValueTemplateError({errors}: {errors: Error[]}) {
  return (
    <Dialog header="Initial value template error" id="initial-value-error-dialog" width={1}>
      <Stack space={4}>
        <Text>Failed to load initial value templates:</Text>
        {errors.map((error: Error) => (
          <Text key={error.message}>
            <code>{error.message}</code>
          </Text>
        ))}
      </Stack>
    </Dialog>
  )
}
