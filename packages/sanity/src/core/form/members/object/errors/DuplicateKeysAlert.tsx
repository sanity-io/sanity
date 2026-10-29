import {type Path} from '@sanity/types'
import {Text} from '@sanity/ui'
import {useCallback} from 'react'
import {Flex, VStack} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {isDev} from '../../../../environment'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {Translate} from '../../../../i18n/Translate'
import {Alert} from '../../../components/Alert'
import {Details} from '../../../components/Details'
import {FormField} from '../../../components/formField/FormField'
import {set} from '../../../patch/patch'
import {PatchEvent} from '../../../patch/PatchEvent'
import {type DuplicateKeysError} from '../../../store/types/memberErrors'

interface Props {
  path: Path
  error: DuplicateKeysError
  onChange: (patchEvent: PatchEvent) => void
}

export function DuplicateKeysAlert(props: Props) {
  const {error, onChange, path} = props

  const handleFixDuplicateKeys = useCallback(() => {
    onChange(
      PatchEvent.from(
        (error.duplicates || []).map(([index, key]) =>
          set(`${key}_deduped_${index}`, [index, '_key']),
        ),
      ),
    )
  }, [error, onChange])

  const {t} = useTranslation()

  return (
    <FormField
      title={error.schemaType.title}
      description={error.schemaType.description}
      path={path}
    >
      <Alert
        status="warning"
        suffix={
          <Flex padding={2} flexDirection="column">
            <Button
              onClick={handleFixDuplicateKeys}
              text={t('form.error.duplicate-keys-alert.generate-button.text')}
              tone="caution"
            />
          </Flex>
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
          <VStack gap={3}>
            <Text as="p" muted size={1}>
              <Translate t={t} i18nKey="form.error.duplicate-keys-alert.details.description" />
            </Text>

            <Text as="p" muted size={1}>
              <Translate
                t={t}
                i18nKey="form.error.duplicate-keys-alert.details.additional-description"
              />
            </Text>
          </VStack>
          {/* TODO: render array items and highlight the items with duplicate keys (sc-26255) */}
        </Details>
      </Alert>
    </FormField>
  )
}
