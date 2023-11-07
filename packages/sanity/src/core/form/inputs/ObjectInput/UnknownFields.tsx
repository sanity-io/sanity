import React, {useCallback} from 'react'
import {Box, Button, Card, Code, Stack, Text} from '@sanity/ui'
import {TrashIcon} from '@sanity/icons'
import {FormPatch, PatchEvent, unset} from '../../patch'
import {Details} from '../../components/Details'
import {Alert} from '../../components/Alert'
import {isDev} from '../../../environment'
import {useTranslation, Translate} from '../../../i18n'

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
    <Card as="li" padding={3} radius={2} shadow={1} tone="caution">
      <Stack space={2}>
        <Card border radius={1}>
          <Card borderBottom padding={3}>
            <Code weight="medium">{fieldName}</Code>
          </Card>
          <Box overflow="auto" padding={3}>
            <Code language="json">{JSON.stringify(value, null, 2)}</Code>
          </Box>
        </Card>

        {readOnly && (
          <Text as="p" muted size={1}>
            <Translate t={t} i18nKey="inputs.object.unknown-fields.read-only.description" />
          </Text>
        )}

        {!readOnly && (
          <Button
            icon={TrashIcon}
            onClick={handleUnsetClick}
            tone="critical"
            text={t('inputs.object.unknown-fields.remove-field-button.text')}
          />
        )}
      </Stack>
    </Card>
  )
}
