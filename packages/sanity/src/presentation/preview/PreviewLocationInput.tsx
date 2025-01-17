import {ResetIcon} from '@sanity/icons'
import {TextInput, type TextInputClearButtonProps} from '@sanity/ui'
import {
  type ChangeEvent,
  type FunctionComponent,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {useActiveWorkspace, useTranslation} from 'sanity'

import {presentationLocaleNamespace} from '../i18n'

export const PreviewLocationInput: FunctionComponent<{
  fontSize?: number
  onChange: (value: string) => void
  origin: string
  padding?: number
  prefix?: ReactNode
  suffix?: ReactNode
  value: string
}> = function (props) {
  const {fontSize = 1, onChange, origin, padding = 3, prefix, suffix, value} = props

  const {t} = useTranslation(presentationLocaleNamespace)
  const {basePath = '/'} = useActiveWorkspace()?.activeWorkspace || {}

  const inputRef = useRef<HTMLInputElement | null>(null)
  const [sessionValue, setSessionValue] = useState<string | undefined>(undefined)
  const [customValidity, setCustomValidity] = useState<string | undefined>(undefined)

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSessionValue(event.currentTarget.value)
  }, [])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        if (sessionValue === undefined) {
          return
        }

        const absoluteValue =
          sessionValue.startsWith('/') || sessionValue === ''
            ? `${origin}${sessionValue}`
            : sessionValue

        if (!absoluteValue.startsWith(`${origin}/`) && absoluteValue !== origin) {
          setCustomValidity(t('preview-location-input.error', {origin, context: 'missing-origin'}))
          return
        }
        // `origin` is an empty string '' if the Studio is embedded, and that's when we need to protect against recursion
        if (!origin && (absoluteValue.startsWith(`${basePath}/`) || absoluteValue === basePath)) {
          setCustomValidity(
            t('preview-location-input.error', {basePath, context: 'same-base-path'}),
          )
          return
        }

        const nextValue = absoluteValue === origin ? `${origin}/` : absoluteValue

        setCustomValidity(undefined)
        setSessionValue(undefined)

        onChange(nextValue.slice(origin.length))

        inputRef.current?.blur()
      }

      if (event.key === 'Escape') {
        setCustomValidity(undefined)
        setSessionValue(undefined)
      }
    },
    [basePath, onChange, origin, sessionValue, t],
  )

  const handleBlur = useCallback(() => {
    setCustomValidity(undefined)
    setSessionValue(undefined)
  }, [])

  useEffect(() => {
    setCustomValidity(undefined)
    setSessionValue(undefined)
  }, [origin, value])

  const resetButton: TextInputClearButtonProps = useMemo(() => ({icon: ResetIcon}), [])

  return (
    <>
      <TextInput
        clearButton={customValidity ? resetButton : undefined}
        customValidity={customValidity}
        fontSize={fontSize}
        onBlur={handleBlur}
        onClear={() => {
          setCustomValidity(undefined)
          setSessionValue(origin + value)
        }}
        onChange={handleChange}
        onKeyDownCapture={handleKeyDown}
        padding={padding}
        prefix={prefix}
        style={{zIndex: 1}}
        radius={2}
        ref={inputRef}
        space={padding}
        suffix={suffix}
        value={sessionValue === undefined ? `${origin}${value}` : sessionValue}
      />
    </>
  )
}
