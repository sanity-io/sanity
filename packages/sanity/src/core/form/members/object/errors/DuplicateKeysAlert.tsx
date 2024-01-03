import {Stack, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import {FormField} from '../../../components/formField'
import {Button} from '../../../../../ui-components'
import {Alert} from '../../../components/Alert'
import {DuplicateKeysError} from '../../../store/types/memberErrors'
import {PatchEvent, set} from '../../../patch'
import {Details} from '../../../components/Details'
import {isDev} from '../../../../environment'
import {Translate, useTranslation} from '../../../../i18n'

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

  const {t} = useTranslation()

  return (
    <FormField title={error.schemaType.title} description={error.schemaType.description}>
      <Alert
        status="warning"
        suffix={
          <Stack padding={2}>
            <Button
              onClick={handleFixDuplicateKeys}
              text={t('form.error.duplicate-keys-alert.generate-button.text')}
              tone="caution"
            />
          </Stack>
        }
        title={t('form.error.duplicate-keys-alert.title')}
      >
        <Text as="p" muted size={1}>
          {t('form.error.duplicate-keys-alert.summary')}
        </Text>

        <Details
          marginTop={4}
          open={isDev}
          title={t('form.error.duplicate-keys-alert.details.title')}
        >
          <Stack space={3}>
            <Text as="p" muted size={1}>
              <Translate t={t} i18nKey="form.error.duplicate-keys-alert.details.description" />
            </Text>

            <Text as="p" muted size={1}>
              <Translate
                t={t}
                i18nKey="form.error.duplicate-keys-alert.details.additional-description"
              />
            </Text>
          </Stack>
          {/* TODO: render array items and highlight the items with duplicate keys (sc-26255) */}
        </Details>
      </Alert>
    </FormField>
  )
}
