import {TrashIcon} from '@sanity/icons'
import {Box, Card, Code, Stack, Text} from '@sanity/ui'
import React, {useCallback} from 'react'

import {Button} from '../../../../ui-components'
import {isDev} from '../../../environment'
import {Translate, useTranslation} from '../../../i18n'
import {Alert} from '../../components/Alert'
import {Details} from '../../components/Details'
import {type FormPatch, type PatchEvent, unset} from '../../patch'

type Props = {
  fieldNames: string[]
  value?: Record<string, unknown>
  onChange(patch: FormPatch): void
  onChange(patch: FormPatch[]): void
  onChange(patch: PatchEvent): void
  readOnly?: boolean
}

export function UnknownFields(props: Props) {
  const {fieldNames, onChange, readOnly, value} = props
  const fieldsLen = fieldNames.length

  const handleUnsetClick = useCallback(
    (fieldName: any) => {
      onChange(unset([fieldName]))
    },
    [onChange],
  )

  const {t} = useTranslation()

  return (
    <Alert
      status="warning"
      title={<>{t('inputs.object.unknown-fields.warning.title', {count: fieldsLen})}</>}
    >
      <Text as="p" muted size={1}>
        <>{t('inputs.object.unknown-fields.warning.description', {count: fieldsLen})}</>
      </Text>

      <Details
        marginTop={4}
        open={isDev}
        title={t('inputs.object.unknown-fields.warning.details.title')}
      >
        <Box marginBottom={3}>
          <Text as="p" muted size={1}>
            <>{t('inputs.object.unknown-fields.warning.details.description', {count: fieldsLen})}</>
          </Text>
        </Box>

        <Stack as="ul" space={3}>
          {fieldNames.map((fieldName) => {
            return (
              <UnknownField
                key={fieldName}
                fieldName={fieldName}
                onUnsetClick={handleUnsetClick}
                readOnly={readOnly}
                value={value?.[fieldName]}
              />
            )
          })}
        </Stack>
      </Details>
    </Alert>
  )
}

function UnknownField({
  fieldName,
  onUnsetClick,
  readOnly,
  value,
}: {
  fieldName: string
  onUnsetClick: (fieldName: string) => void
  readOnly?: boolean
  value: unknown
}) {
  const handleUnsetClick = useCallback(() => {
    onUnsetClick(fieldName)
  }, [fieldName, onUnsetClick])

  const {t} = useTranslation()

  return (
    <Card as="li" overflow="hidden" radius={2} shadow={1} tone="caution">
      <Card padding={3} shadow={1} tone="inherit">
        <Code size={1}>{fieldName}</Code>
      </Card>

      <Box overflow="auto" padding={3}>
        <Code language="json" size={1}>
          {JSON.stringify(value, null, 2)}
        </Code>
      </Box>

      {readOnly && (
        <Box padding={3}>
          <Text as="p" muted size={1}>
            <Translate t={t} i18nKey="inputs.object.unknown-fields.read-only.description" />
          </Text>
        </Box>
      )}

      {!readOnly && (
        <Card padding={3} shadow={1} tone="inherit">
          <Button
            icon={TrashIcon}
            mode="ghost"
            onClick={handleUnsetClick}
            size="large"
            tone="critical"
            text={t('inputs.object.unknown-fields.remove-field-button.text')}
          />
        </Card>
      )}
    </Card>
  )
}
