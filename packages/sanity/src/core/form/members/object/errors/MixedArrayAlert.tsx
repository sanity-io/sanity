import {Stack, Text} from '@sanity/ui'
import React from 'react'
import {isPlainObject} from 'lodash'
import {Button} from '../../../../../ui-components'
import {Alert} from '../../../components/Alert'
import {Details} from '../../../components/Details'
import {isDev} from '../../../../environment'
import {PatchEvent, unset} from '../../../patch'
import {FormField} from '../../../components/formField'
import {MixedArrayError} from '../../../store'
import {useTranslation} from '../../../../i18n'

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

  const {t} = useTranslation()

  return (
    <FormField title={error.schemaType.title} description={error.schemaType.description}>
      <Alert
        status="error"
        suffix={
          <Stack padding={2}>
            <Button
              onClick={handleRemoveNonObjectValues}
              text={t('form.error.mixed-array-alert.remove-button.text')}
              tone="critical"
            />
          </Stack>
        }
        title={t('form.error.mixed-array-alert.title')}
      >
        <Text as="p" muted size={1}>
          {t('form.error.mixed-array-alert.summary')}
        </Text>

        <Details marginTop={4} open={isDev} title={t('form.error.mixed-array-alert.details.title')}>
          <Stack space={3}>
            <Text as="p" muted size={1}>
              {t('form.error.mixed-array-alert.details.description')}
            </Text>
          </Stack>
          {/* TODO: render array items and highlight the wrong items (sc-26255) */}
        </Details>
      </Alert>
    </FormField>
  )
}
