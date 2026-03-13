import {TrashIcon} from '@sanity/icons'
import {
  type ReferenceSchemaType,
  isDocumentSchemaType,
  isReference,
  isReferenceSchemaType,
} from '@sanity/types'
import {Box, Card, Code, Stack, Text} from '@sanity/ui'
import {useCallback, useMemo} from 'react'

import {Button} from '../../../../ui-components'
import {isDev} from '../../../environment'
import {useSchema} from '../../../hooks'
import {Translate, useTranslation} from '../../../i18n'
import {Alert} from '../../components/Alert'
import {Details} from '../../components/Details'
import {type FormPatch, type PatchEvent, unset} from '../../patch'
import {type RenderPreviewCallback} from '../../types'

type Props = {
  fieldNames: string[]
  value?: Record<string, unknown>
  onChange(patch: FormPatch): void
  onChange(patch: FormPatch[]): void
  onChange(patch: PatchEvent): void
  renderPreview: RenderPreviewCallback
  readOnly?: boolean
}

export function UnknownFields(props: Props) {
  const {fieldNames, onChange, readOnly, renderPreview, value} = props
  const fieldsLen = fieldNames.length
  const schema = useSchema()

  const referenceSchemaType = useMemo(() => {
    const schemaReferenceType = schema.get('reference')
    if (!schemaReferenceType || !isReferenceSchemaType(schemaReferenceType)) {
      return null
    }

    const documentTypes = schema
      .getTypeNames()
      .map((typeName) => schema.get(typeName))
      .filter(isDocumentSchemaType)

    if (documentTypes.length === 0) {
      return null
    }

    return {...schemaReferenceType, to: documentTypes}
  }, [schema])

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
                referenceSchemaType={referenceSchemaType}
                renderPreview={renderPreview}
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
  referenceSchemaType,
  renderPreview,
  value,
}: {
  fieldName: string
  onUnsetClick: (fieldName: string) => void
  readOnly?: boolean
  referenceSchemaType: ReferenceSchemaType | null
  renderPreview: RenderPreviewCallback
  value: unknown
}) {
  const handleUnsetClick = useCallback(() => {
    onUnsetClick(fieldName)
  }, [fieldName, onUnsetClick])

  const {t} = useTranslation()
  const isReferenceValue = isReference(value)
  const referenceId = isReferenceValue ? value._ref : null

  return (
    <Card as="li" overflow="hidden" radius={2} shadow={1} tone="caution">
      <Card padding={3} shadow={1} tone="inherit">
        <Code size={1}>{fieldName}</Code>
      </Card>

      {isReferenceValue && (
        <Card border padding={1} radius={2} tone="default" margin={2}>
          {referenceSchemaType
            ? renderPreview({
                layout: 'default',
                schemaType: referenceSchemaType,
                value,
              })
            : t('inputs.object.unknown-fields.reference.preview.unavailable', {
                documentId: referenceId,
              })}
        </Card>
      )}

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
