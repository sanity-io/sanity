import {Stack, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import {FormField} from '../../../components/formField'
import {Button} from '../../../../../ui'
import {Alert} from '../../../components/Alert'
import {DuplicateKeysError} from '../../../store/types/memberErrors'
import {PatchEvent, set} from '../../../patch'
import {Details} from '../../../components/Details'
import {isDev} from '../../../../environment'

interface Props {
  error: DuplicateKeysError
  onChange: (patchEvent: PatchEvent) => void
}

export function DuplicateKeysAlert(props: Props) {
  const {error, onChange} = props

  const handleFixDuplicateKeys = useCallback(() => {
    onChange(
      PatchEvent.from(
        (error.duplicates || []).map(([index, key]) =>
          set(`${key}_deduped_${index}`, [index, '_key']),
        ),
      ),
    )
  }, [error.duplicates, onChange])

  return (
    <FormField title={error.schemaType.title} description={error.schemaType.description}>
      <Alert
        status="warning"
        suffix={
          <Stack padding={2}>
            <Button onClick={handleFixDuplicateKeys} text="Generate unique keys" tone="caution" />
          </Stack>
        }
        title={<>Non-unique keys</>}
      >
        <Text as="p" muted size={1}>
          Several items in this list share the same identifier (key). Every item must have an unique
          identifier.
        </Text>

        <Details marginTop={4} open={isDev} title={<>Developer info</>}>
          <Stack space={3}>
            <Text as="p" muted size={1}>
              This usually happens when items are created using an API client, and the{' '}
              <code>_key</code> property of each elements has been generated non-uniquely.
            </Text>

            <Text as="p" muted size={1}>
              The value of the <code>_key</code> property must be a unique string.
            </Text>
          </Stack>
          {/* TODO: render array items and highlight the items with duplicate keys (sc-26255) */}
        </Details>
      </Alert>
    </FormField>
  )
}
