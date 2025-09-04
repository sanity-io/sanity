import {ErrorOutlineIcon} from '@sanity/icons'
import {Box, Card, Flex, Text, Tooltip} from '@sanity/ui'
import {debounce} from 'lodash'
import {type RefObject, useCallback, useMemo} from 'react'
import {type TFunction, useTranslation} from 'sanity'

import {VisionCodeMirror, type VisionCodeMirrorHandle} from '../codemirror/VisionCodeMirror'
import {visionLocaleNamespace} from '../i18n'
import {tryParseParams} from '../util/tryParseParams'
import {type Params} from './VisionGui'
import {InputBackgroundContainerLeft, StyledLabel} from './VisionGui.styled'

const defaultValue = `{\n  \n}`

export interface ParamsEditorProps {
  value: string
  onChange: (changeEvt: string) => void
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

  const handleChangeRaw = useCallback(
    (newValue: string) => {
      onChange(newValue)
    },
    [onChange],
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
