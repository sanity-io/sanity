import {useCallback, useState} from 'react'
import {useTranslation} from 'sanity'
import {useVisionStore} from '../components/VisionStoreContext'
import type {ParamsEditorChangeEvent} from '../components/ParamsEditor'
import {tryParseParams} from '../util/tryParseParams'
import {visionLocaleNamespace} from '../i18n'

/**
 * @internal
 */
interface UseVisionParams {
  rawParams: string
  setParams: (event: ParamsEditorChangeEvent) => void
  parsedParams: Record<string, unknown> | Error | undefined
  setParsedParams: (value: Record<string, unknown>) => void
  hasValidParams: boolean
  paramsError: string | undefined
}

/**
 * @internal
 */
export function useVisionParams(): UseVisionParams {
  const {localStorage, rawParams, setRawParams: _setRawParams} = useVisionStore()
  const {t} = useTranslation(visionLocaleNamespace)
  const [parsedParams, _setParsedParams] = useState<Record<string, unknown> | Error | undefined>(
    () => (rawParams ? tryParseParams(rawParams, t) : undefined),
  )
  const [hasValidParams, setHasValidParams] = useState(true)
  const [paramsError, setParamsError] = useState<string>()

  const setParams = useCallback(
    ({raw, parsed, valid, error}: ParamsEditorChangeEvent) => {
      _setRawParams(raw)
      _setParsedParams(parsed)
      setHasValidParams(valid)
      setParamsError(error)
      localStorage.set('params', raw)
    },
    [_setRawParams, localStorage],
  )

  const setParsedParams = useCallback(
    (value: Record<string, unknown>) => {
      _setParsedParams(value)
      const raw = JSON.stringify(value, null, 2)
      _setRawParams(raw)
    },
    [_setRawParams],
  )

  return {
    rawParams,
    setParams,
    parsedParams,
    setParsedParams,
    hasValidParams,
    paramsError,
  }
}
