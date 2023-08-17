import {Button, Stack, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import {randomKey} from '@sanity/util/content'
import {MissingKeysError} from '../../../store/types/memberErrors'
import {Details} from '../../../components/Details'
import {Alert} from '../../../components/Alert'
import {PatchEvent, setIfMissing} from '../../../patch'
import {FormField} from '../../../components/formField'
import {isDev} from '../../../../environment'

interface Props {
  error: MissingKeysError
  onChange: (patchEvent: PatchEvent) => void
}

export function MissingKeysAlert(props: Props) {
  const {error, onChange} = props
  const handleFixMissingKeys = useCallback(() => {
    onChange(
      PatchEvent.from((error.value || []).map((val, i) => setIfMissing(randomKey(), [i, '_key']))),
    )
  }, [error.value, onChange])

  return (
    <FormField title={error.schemaType.title} description={error.schemaType.description}>
      <Alert
        status="warning"
        suffix={
          <Stack padding={2}>
            <Button onClick={handleFixMissingKeys} text="Add missing keys" tone="caution" />
          </Stack>
        }
        title={<>Missing keys</>}
      >
        <Text as="p" muted size={1}>
          Some items in the list are missing their keys. This must be fixed in order to edit the
          list.
        </Text>

        <Details marginTop={4} open={isDev} title={<>Developer info</>}>
          <Stack space={3}>
            <Text as="p" muted size={1}>
              This usually happens when items are created using an API client, and the{' '}
              <code>_key</code> property has not been included.
            </Text>

            <Text as="p" muted size={1}>
              The value of the <code>_key</code> property must be a unique string.
            </Text>
          </Stack>
        </Details>
        {/* TODO: render array items and highlight the items with missing key */}
      </Alert>
    </FormField>
  )
}
