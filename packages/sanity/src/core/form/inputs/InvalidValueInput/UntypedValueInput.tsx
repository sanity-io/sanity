import React, {useCallback, useMemo} from 'react'
import {Card, Code, Grid, Stack, Text} from '@sanity/ui'
import {PatchEvent, setIfMissing, unset} from '../../patch'
import {Button} from '../../../ui-components'
import {Alert} from '../../components/Alert'
import {Details} from '../../components/Details'
import {useSchema} from '../../../hooks'
import {isDev} from '../../../environment'
import {useTranslation, Translate} from '../../../i18n'

interface UntypedValueInputProps {
  validTypes: string[]
  value: Record<string, unknown>
  onChange: (event: PatchEvent, value?: Record<string, unknown>) => void
}

function SetMissingTypeButton({
  value,
  targetType,
  onChange,
}: {
  value: Record<string, unknown>
  targetType: string
  onChange: UntypedValueInputProps['onChange']
}) {
  const itemValue = useMemo(() => ({...value, _type: targetType}), [targetType, value])

  const handleClick = useCallback(
    () => onChange(PatchEvent.from(setIfMissing(targetType, ['_type'])), itemValue),
    [itemValue, onChange, targetType],
  )

  const {t} = useTranslation()

  return (
    <Button
      onClick={handleClick}
      text={t('inputs.untyped-value.convert-button.text', {
        targetType: targetType,
      })}
    />
  )
}

function UnsetItemButton({
  value,
  onChange,
  validTypes,
}: {
  value: Record<string, unknown>
  validTypes: string[]
  onChange: UntypedValueInputProps['onChange']
}) {
  // Doesn't matter which `_type` we use as long as it's allowed by the array
  const itemValue = useMemo(() => ({...value, _type: validTypes[0]}), [validTypes, value])

  const handleClick = useCallback(
    () => onChange(PatchEvent.from(unset()), itemValue),
    [itemValue, onChange],
  )

  const {t} = useTranslation()

  return (
    <Button
      onClick={handleClick}
      tone="critical"
      text={t('inputs.untyped-value.unset-item-button.text')}
    />
  )
}

/**
 * When the value does not have an `_type` property,
 * but the schema has a named type
 */
export function UntypedValueInput({validTypes, value, onChange}: UntypedValueInputProps) {
  const schema = useSchema()
  const isSingleValidType = validTypes.length === 1
  const isHoistedType = schema.has(validTypes[0])

  const {t} = useTranslation()

  return (
    <Alert
      status="warning"
      title={
        <>
          <Translate t={t} i18nKey="inputs.untyped-value.title" />
        </>
      }
    >
      <Details open={isDev} title={t('inputs.untyped-value.details.title')}>
        <Stack space={3}>
          <Text as="p" muted size={1}>
            <Translate t={t} i18nKey="inputs.untyped-value.description" />
          </Text>

          {isSingleValidType && !isHoistedType && (
            <Text as="p" muted size={1}>
              <Translate t={t} i18nKey="inputs.untyped-value.details.description" />
            </Text>
          )}

          {!isSingleValidType && (
            <Text as="p" muted size={1}>
              {t('inputs.untyped-value.details.multi-type-description')}
            </Text>
          )}

          {!isSingleValidType && (
            <Stack as="ul" space={2}>
              {validTypes.map((validType) => (
                <Text as="li" key={validType} muted size={1}>
                  <code>{validType}</code>
                </Text>
              ))}
            </Stack>
          )}

          <Stack space={2}>
            <Text as="h4" weight="medium" size={1}>
              {t('inputs.untyped-value.details.json-dump-prefix')}
            </Text>

            <Card border overflow="auto" padding={2} radius={2} tone="inherit">
              <Code language="json">{JSON.stringify(value, null, 2)}</Code>
            </Card>
          </Stack>

          <Grid columns={[1, 2, 2]} gap={1}>
            {isSingleValidType && (
              <SetMissingTypeButton onChange={onChange} targetType={validTypes[0]} value={value} />
            )}

            <UnsetItemButton onChange={onChange} validTypes={validTypes} value={value} />
          </Grid>
        </Stack>
      </Details>
    </Alert>
  )
}
