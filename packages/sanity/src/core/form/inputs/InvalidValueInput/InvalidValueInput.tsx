import {Card, Text} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import isPlainObject from 'lodash-es/isPlainObject.js'
import {useCallback, useImperativeHandle, useMemo, type RefAttributes} from 'react'
import {Flex, VStack} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {isDev} from '../../../environment'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {Translate} from '../../../i18n/Translate'
import {Alert} from '../../components/Alert'
import {Details} from '../../components/Details'
import {set, unset} from '../../patch/patch'
import {PatchEvent} from '../../patch/PatchEvent'
import {converters as CONVERTERS, type ValueConverter} from './converters'
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

export function InvalidValueInput(props: InvalidValueProps & RefAttributes<{focus: () => void}>) {
  const {ref, value, actualType, validTypes, onChange} = props

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
    <Flex padding={2} flexDirection="column">
      <Button
        onClick={handleClearClick}
        tone="critical"
        text={t('inputs.invalid-value.reset-button.text')}
      />
    </Flex>
  )

  return (
    <Alert status="error" suffix={suffix} title={t('inputs.invalid-value.title')}>
      <Text as="p" muted size={1}>
        {t('inputs.invalid-value.description')}
      </Text>

      <Details marginTop={4} open={isDev} title={t('inputs.invalid-value.details.title')}>
        <VStack gap={3}>
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
            <VStack as="ul" gap={2}>
              {validTypes.map((validType) => (
                <Text key={validType} as="li">
                  <code>{validType}</code>
                </Text>
              ))}
            </VStack>
          )}

          <Flex marginTop={2} gap={2} flexDirection="column">
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
          </Flex>

          {converters.length > 0 && (
            <VStack gap={1}>
              {converters.map((converter) => (
                <ConvertButton
                  key={`${converter.from}-${converter.to}`}
                  converter={converter}
                  onConvert={handleConvertTo}
                  value={value}
                />
              ))}
            </VStack>
          )}
        </VStack>
      </Details>
    </Alert>
  )
}

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
