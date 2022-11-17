import {Button, Stack, Text} from '@sanity/ui'
import React from 'react'
import {isPlainObject} from 'lodash'
import {Alert} from '../../../components/Alert'
import {Details} from '../../../components/Details'
import {isDev} from '../../../../environment'
import {PatchEvent, unset} from '../../../patch'
import {FormField} from '../../../components/formField'
import {MixedArrayError} from '../../../store'

interface Props {
  error: MixedArrayError
  onChange: (patchEvent: PatchEvent) => void
}
export function MixedArrayAlert(props: Props) {
  const {error, onChange} = props

  const handleRemoveNonObjectValues = () => {
    const nonObjectIndices = (error.value || [])
      .flatMap((item, index) => (isPlainObject(item) ? [] : [index]))
      .reverse()

    const patches = nonObjectIndices.map((index) => unset([index]))

    onChange(PatchEvent.from(patches))
  }

  return (
    <FormField title={error.schemaType.title} description={error.schemaType.description}>
      <Alert
        status="error"
        suffix={
          <Stack padding={2}>
            <Button
              onClick={handleRemoveNonObjectValues}
              text="Remove non-object values"
              tone="critical"
            />
          </Stack>
        }
        title={<>Invalid list values</>}
      >
        <Text as="p" muted size={1}>
          Some items in this list are not objects. This must be fixed in order to edit the list.
        </Text>

        <Details marginTop={4} open={isDev} title={<>Developer info</>}>
          <Stack space={3}>
            <Text as="p" muted size={1}>
              This usually happens when items are created using an API client, or when a custom
              input component has added invalid data to the list.
            </Text>
          </Stack>
          {/* TODO: render array items and highlight the wrong items (sc-26255) */}
        </Details>
      </Alert>
    </FormField>
  )
}
