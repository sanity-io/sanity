import {Button, Card, Code, Stack, Text} from '@sanity/ui'
import React, {forwardRef, useCallback, useImperativeHandle, useMemo} from 'react'
import {PatchEvent, set, unset} from '../../patch'
import {Alert} from '../../components/Alert'
import {Details} from '../../components/Details'
import {isDev} from '../../../environment'
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
      [onChange]
    )

    const converters = useMemo(
      () => getConverters(value, actualType, validTypes),
      [value, actualType, validTypes]
    )

    if (typeof value === 'object' && value !== null && !('_type' in value)) {
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
        <Button onClick={handleClearClick} tone="critical" text="Reset value" />
      </Stack>
    )

    return (
      <Alert status="error" suffix={suffix} title={<>Invalid property value</>}>
        <Text as="p" muted size={1}>
          The property value is stored as a value type that does not match the expected type.
        </Text>

        <Details marginTop={4} open={isDev} title={<>Developer info</>}>
          <Stack space={3}>
            {validTypes.length === 1 && (
              <Text as="p" muted size={1}>
                The value of this property must be of type <code>{validTypes[0]}</code> according to
                the schema.
              </Text>
            )}

            {validTypes.length === 1 && (
              <Text as="p" muted size={1}>
                Mismatching value types typically occur when the schema has recently been changed.
              </Text>
            )}

            {validTypes.length !== 1 && (
              <Text as="p" muted size={1}>
                Only the following types are valid here according to schema:
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
              <Text size={1} weight="semibold">
                The current value (<code>{actualType}</code>)
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
  }
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
    [converter, onConvert, value]
  )

  return (
    <Button
      onClick={handleClick}
      text={
        <>
          Convert to <code>{converter.to}</code>
        </>
      }
    />
  )
}
