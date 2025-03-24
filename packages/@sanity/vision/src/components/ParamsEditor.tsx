import {ErrorOutlineIcon} from '@sanity/icons'
import {Box, Card, Flex, Text, Tooltip} from '@sanity/ui'
import {debounce} from 'lodash'
import {type RefObject, useCallback, useEffect, useMemo, useState} from 'react'
import {type TFunction, useTranslation} from 'sanity'

import {VisionCodeMirror, type VisionCodeMirrorHandle} from '../codemirror/VisionCodeMirror'
import {visionLocaleNamespace} from '../i18n'
import {tryParseParams} from '../util/tryParseParams'
import {type Params} from './VisionGui'
import {InputBackgroundContainerLeft, StyledLabel} from './VisionGui.styled'

const defaultValue = `{\n  \n}`

export interface ParamsEditorProps {
  value: string
  onChange: (changeEvt: Params) => void
  paramsError: string | undefined
  hasValidParams: boolean
  editorRef: RefObject<VisionCodeMirrorHandle | null>
}

export interface ParamsEditorChange {
  valid: boolean
}

export function ParamsEditor(props: ParamsEditorProps) {
  const {onChange, paramsError, hasValidParams, editorRef} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const {raw: value, error, parsed, valid} = parseParams(props.value, t)
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
      const event = parseParams(newValue, t)
      setValid(event.valid)
      onChange(event)
    },
    [onChange, t],
  )

  const handleChange = useMemo(() => debounce(handleChangeRaw, 333), [handleChangeRaw])
  return (
    <Card flex={1} tone={hasValidParams ? 'default' : 'critical'} data-testid="params-editor">
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
        ref={editorRef}
        initialValue={props.value || defaultValue}
        onChange={handleChange}
      />
    </Card>
  )
}

export function parseParams(
  value: string,
  t: TFunction<typeof visionLocaleNamespace, undefined>,
): Params {
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
