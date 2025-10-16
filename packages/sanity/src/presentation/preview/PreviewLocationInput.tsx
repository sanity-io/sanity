import {ResetIcon} from '@sanity/icons'
import {TextInput, type TextInputClearButtonProps} from '@sanity/ui'
import {type FontTextSize, type Space} from '@sanity/ui/theme'
import {
  type ChangeEvent,
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
import {type PreviewUrlRef} from '../machines/preview-url'
import {useAllowPatterns} from '../useAllowPatterns'
import {useTargetOrigin} from '../useTargetOrigin'

export function PreviewLocationInput(props: {
  fontSize?: FontTextSize
  onChange: (value: string) => void
  previewUrlRef: PreviewUrlRef
  padding?: Space
  prefix?: ReactNode
  suffix?: ReactNode
  value: string
}): React.JSX.Element {
  const {fontSize = 1, onChange, padding = 3, prefix, suffix, value, previewUrlRef} = props
  const allowOrigins = useAllowPatterns(previewUrlRef)
  const targetOrigin = useTargetOrigin(previewUrlRef)

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

        let absoluteValue = sessionValue
        try {
          absoluteValue = new URL(sessionValue, targetOrigin).toString()
        } catch {
          // ignore
        }

        if (Array.isArray(allowOrigins)) {
          if (!allowOrigins.some((pattern) => pattern.test(absoluteValue))) {
            setCustomValidity(
              t('preview-location-input.error', {
                origin: targetOrigin,
                context: 'origin-not-allowed',
              }),
            )
            event.currentTarget.reportValidity()
            return
          }
          // `origin` is an empty string '' if the Studio is embedded, and that's when we need to protect against recursion
        } else if (
          !targetOrigin &&
          (absoluteValue.startsWith(`${basePath}/`) || absoluteValue === basePath)
        ) {
          setCustomValidity(
            t('preview-location-input.error', {basePath, context: 'same-base-path'}),
          )
          return
        }

        const nextValue = absoluteValue === targetOrigin ? `${targetOrigin}/` : absoluteValue

        setCustomValidity(undefined)
        setSessionValue(undefined)

        onChange(nextValue)

        inputRef.current?.blur()
      }

      if (event.key === 'Escape') {
        setCustomValidity(undefined)
        setSessionValue(undefined)
      }
    },
    [allowOrigins, basePath, onChange, sessionValue, t, targetOrigin],
  )

  const handleBlur = useCallback(() => {
    setCustomValidity(undefined)
    setSessionValue(undefined)
  }, [])

  const handleClear = useCallback(() => {
    setCustomValidity(undefined)
    let nextValue = value
    try {
      nextValue = new URL(value, targetOrigin).toString()
    } catch {
      // ignore
    }
    setSessionValue(nextValue)
  }, [targetOrigin, value])

  useEffect(() => {
    setCustomValidity(undefined)
    setSessionValue(undefined)
  }, [targetOrigin, value])

  const resetButton: TextInputClearButtonProps = useMemo(() => ({icon: ResetIcon}), [])

  return (
    <>
      <TextInput
        clearButton={customValidity ? resetButton : undefined}
        customValidity={customValidity}
        fontSize={fontSize}
        onBlur={handleBlur}
        onClear={handleClear}
        onChange={handleChange}
        onKeyDownCapture={handleKeyDown}
        padding={padding}
        prefix={prefix}
        style={{zIndex: 1}}
        radius={2}
        ref={inputRef}
        gap={padding}
        suffix={suffix}
        value={sessionValue === undefined ? new URL(value, targetOrigin).toString() : sessionValue}
      />
    </>
  )
}
