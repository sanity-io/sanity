import {ErrorOutlineIcon} from '@sanity/icons'
import {Box, Card, Flex, Text, Tooltip} from '@sanity/ui'
import {debounce} from 'lodash'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {type TFunction, useTranslation} from 'sanity'

import {VisionCodeMirror, type VisionCodeMirrorHandle} from '../codemirror/VisionCodeMirror'
import {visionLocaleNamespace} from '../i18n'
import {tryParseParams} from '../util/tryParseParams'
import {InputBackgroundContainerLeft, StyledLabel} from './VisionGui.styled'

const defaultValue = `{\n  \n}`

export interface ParamsEditorChangeEvent {
  parsed: Record<string, unknown>
  raw: string
  valid: boolean
  error: string | undefined
}

export interface ParamsEditorProps {
  value: string
  onChange: (changeEvt: ParamsEditorChangeEvent) => void
  editorRef: React.RefObject<VisionCodeMirrorHandle | null>
  paramsError: string | undefined
  hasValidParams: boolean
}

export interface ParamsEditorChange {
  valid: boolean
}

export function ParamsEditor(props: ParamsEditorProps) {
  const {onChange, paramsError, hasValidParams} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const {raw: value, error, parsed, valid} = eventFromValue(props.value, t)
  const [isValid, setValid] = useState(valid)
  const [init, setInit] = useState(false)

  // Emit onChange on very first render
  useEffect(() => {
    if (!init) {
      onChange({parsed, raw: value, valid: isValid, error})
      setInit(true)
    }
  }, [error, init, isValid, onChange, parsed, value])

  const handleChangeRaw = useCallback(
    (newValue: string) => {
      const event = eventFromValue(newValue, t)
      setValid(event.valid)
      onChange(event)
    },
    [onChange, t],
  )

  const handleChange = useMemo(() => debounce(handleChangeRaw, 333), [handleChangeRaw])
  return (
    <Card flex={1} tone={hasValidParams ? 'default' : 'critical'}>
      <InputBackgroundContainerLeft>
        <Flex>
          <StyledLabel muted>{t('params.label')}</StyledLabel>
          {paramsError && (
            <Tooltip animate placement="top" portal content={<Text size={1}>{paramsError}</Text>}>
              <Box padding={1} marginX={2}>
                <Text>
                  <ErrorOutlineIcon />
                </Text>
              </Box>
            </Tooltip>
          )}
        </Flex>
      </InputBackgroundContainerLeft>
      <VisionCodeMirror
        initialValue={props.value || defaultValue}
        onChange={handleChange}
        ref={props.editorRef}
      />
    </Card>
  )
}

function eventFromValue(
  value: string,
  t: TFunction<typeof visionLocaleNamespace, undefined>,
): ParamsEditorChangeEvent {
  const parsedParams = tryParseParams(value, t)
  const params = parsedParams instanceof Error ? {} : parsedParams
  const validationError = parsedParams instanceof Error ? parsedParams.message : undefined
  const isValid = !validationError

  return {
    parsed: params,
    raw: value,
    valid: isValid,
    error: validationError,
  }
}
