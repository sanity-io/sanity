import {Card, Code, Stack, Text} from '@sanity/ui'
import React, {forwardRef, useCallback, useImperativeHandle, useMemo} from 'react'
import {isPlainObject} from 'lodash'
import {useTranslation, Translate} from '../../../i18n'
import {PatchEvent, set, unset} from '../../patch'
import {Alert} from '../../components/Alert'
import {Details} from '../../components/Details'
import {isDev} from '../../../environment'
import {Button} from '../../../../ui'
import {converters as CONVERTERS, ValueConverter} from './converters'
import {UntypedValueInput} from './UntypedValueInput'

interface Converter extends ValueConverter {
  from: string
  to: string
}

function getConverters(value: unknown, actualType: string, validTypes: string[]): Converter[] {
  if (!(actualType in CONVERTERS)) {
    return []
  }

  return Object.keys(CONVERTERS[actualType])
    .filter((targetType) => validTypes.includes(targetType))
    .map((targetType) => ({
      from: actualType,
      to: targetType,
      ...CONVERTERS[actualType][targetType],
    }))
    .filter((converter) => converter.test(value))
}

interface InvalidValueProps {
  actualType: string
  validTypes: string[]
  value?: unknown
  onChange: (event: PatchEvent) => void
}

export const InvalidValueInput = forwardRef(
  (props: InvalidValueProps, ref: React.Ref<{focus: () => void}>) => {
    const {value, actualType, validTypes, onChange} = props

    useImperativeHandle(ref, () => ({
      // @todo
      focus: () => undefined,
    }))

    const handleClearClick = useCallback(() => {
      onChange(PatchEvent.from(unset()))
    }, [onChange])

    const handleConvertTo = useCallback(
      (converted: any) => {
        onChange(PatchEvent.from(set(converted)))
      },
      [onChange],
    )

    const converters = useMemo(
      () => getConverters(value, actualType, validTypes),
      [value, actualType, validTypes],
    )

    const {t} = useTranslation()

    if (isPlainObject(value) && !('_type' in (value as object))) {
      return (
        <UntypedValueInput
          value={value as Record<string, unknown>}
          validTypes={validTypes}
          onChange={onChange}
        />
      )
    }

    const suffix = (
      <Stack padding={2}>
        <Button
          onClick={handleClearClick}
          tone="critical"
          text={t('inputs.invalid-value.reset-button.text')}
        />
      </Stack>
    )

    return (
      <Alert status="error" suffix={suffix} title={t('inputs.invalid-value.title')}>
        <Text as="p" muted size={1}>
          {t('inputs.invalid-value.description')}
        </Text>

        <Details marginTop={4} open={isDev} title={t('inputs.invalid-value.details.title')}>
          <Stack space={3}>
            {validTypes.length === 1 && (
              <Text as="p" muted size={1}>
                <Translate
                  t={t}
                  i18nKey="inputs.invalid-value.details.description"
                  values={{
                    validType: validTypes[0],
                  }}
                />
              </Text>
            )}

            {validTypes.length === 1 && (
              <Text as="p" muted size={1}>
                {t('inputs.invalid-value.details.possible-reason')}
              </Text>
            )}

            {validTypes.length !== 1 && (
              <Text as="p" muted size={1}>
                {t('inputs.invalid-value.details.multi-type-description')}
              </Text>
            )}

            {validTypes.length !== 1 && (
              <Stack as="ul" space={2}>
                {validTypes.map((validType) => (
                  <Text as="li" key={validType}>
                    <code>{validType}</code>
                  </Text>
                ))}
              </Stack>
            )}

            <Stack marginTop={2} space={2}>
              <Text size={1} weight="medium">
                <Translate
                  t={t}
                  i18nKey="inputs.invalid-value.current-type"
                  values={{
                    actualType: actualType,
                  }}
                />
              </Text>

              <Card border padding={2} radius={2} tone="inherit">
                <Code language="json" size={1}>
                  {JSON.stringify(value, null, 2)}
                </Code>
              </Card>
            </Stack>

            {converters.length > 0 && (
              <Stack space={1}>
                {converters.map((converter) => (
                  <ConvertButton
                    converter={converter}
                    key={`${converter.from}-${converter.to}`}
                    onConvert={handleConvertTo}
                    value={value}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        </Details>
      </Alert>
    )
  },
)

InvalidValueInput.displayName = 'InvalidValueInput'

function ConvertButton({
  converter,
  onConvert,
  value,
}: {
  converter: Converter
  onConvert: (v: string | number | boolean | Record<string, unknown>) => void
  value: unknown
}) {
  const handleClick = useCallback(
    () => onConvert(converter.convert(value)),
    [converter, onConvert, value],
  )

  const {t} = useTranslation()

  return (
    <Button
      onClick={handleClick}
      text={t('inputs.invalid-value.convert-button.text', {targetType: converter.to})}
    />
  )
}
