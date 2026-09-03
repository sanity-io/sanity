import {CloseIcon} from '@sanity/icons/Close'
import {Card, Flex, isHTMLElement, rem, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {
  type ChangeEvent,
  type FocusEvent,
  type HTMLProps,
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type RefAttributes,
} from 'react'
import {Box} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../../i18n/localeNamespaces'
import {focusRingBorderStyle, focusRingStyle} from './styles'
import {
  content,
  contentItem,
  disabledBgVar,
  disabledBoxShadowVar,
  disabledFgVar,
  enabledBoxShadowVar,
  enabledFgVar,
  focusedBoxShadowVar,
  input,
  inputDisabledFgVar,
  inputEnabledFgVar,
  inputFontFamilyVar,
  inputFontSizeVar,
  inputFontWeightVar,
  inputLineHeightVar,
  inputPaddingBottomVar,
  inputPaddingTopVar,
  inputPaddingXVar,
  placeholder,
  placeholderFgVar,
  radius1Var,
  root,
  space1Var,
  tagBox,
} from './tagInput.css'

export function TagInput(
  props: {
    readOnly?: boolean
    onChange?: (newValue: {value: string}[]) => void
    onFocus?: (event: FocusEvent) => void
    placeholder?: string
    value?: {value: string}[]
  } & Omit<HTMLProps<HTMLInputElement>, 'as' | 'onChange' | 'onFocus' | 'ref' | 'value'> &
    RefAttributes<HTMLInputElement>,
) {
  const {
    ref: forwardedRef,
    className,
    disabled,
    onChange,
    onFocus,
    placeholder: placeholderProp,
    readOnly,
    style,
    value = [],
    ...restProps
  } = props

  const {t} = useTranslation(studioLocaleNamespace)
  const [inputValue, setInputValue] = useState('')
  const enabled = !disabled && !readOnly
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLInputElement | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const {color, font, input: inputTheme, radius, space} = useThemeV2()
  const inputColor = color.input.default
  const inputBorderWidth = inputTheme.border.width
  const textSize = font.text.sizes[2]

  useImperativeHandle<HTMLInputElement | null, HTMLInputElement | null>(
    forwardedRef,
    () => ref.current,
  )

  const handleRootPointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const isTagElement = isHTMLElement(event.target) && event.target.closest('[data-ui="Tag"]')

    if (isTagElement) return

    const inputElement = ref.current

    if (inputElement) {
      setTimeout(() => inputElement.focus(), 0)
    }
  }, [])

  const handleInputBlur = useCallback(() => {
    setFocused(false)
  }, [])

  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.currentTarget.value)
  }, [])

  const handleInputFocus = useCallback(
    (event: FocusEvent) => {
      setFocused(true)
      if (onFocus) onFocus(event)
    },
    [onFocus],
  )

  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        event.stopPropagation()

        if (onChange && inputValue) {
          const newValue = value.concat([{value: inputValue}])

          setInputValue('')

          if (onChange) onChange(newValue)
        }
      }
    },
    [inputValue, onChange, value],
  )

  const handleTagRemove = useCallback(
    (index: number) => {
      if (!onChange) return

      const newValue = value.slice(0)

      newValue.splice(index, 1)

      onChange(newValue)
    },
    [onChange, value],
  )

  useEffect(() => {
    const inputElement = ref.current

    if (inputElement) {
      inputElement.style.width = '0'
      inputElement.style.width = `calc(${inputElement.scrollWidth}px + 1rem)`
    }
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- pre-existing violation, to be fixed in a follow-up
  }, [inputValue])

  return (
    <Card
      className={root}
      data-disabled={disabled ? '' : undefined}
      data-focused={focused ? '' : undefined}
      data-read-only={readOnly ? '' : undefined}
      data-ui="TagInput"
      onPointerDown={handleRootPointerDown}
      overflow="auto"
      padding={1}
      ref={rootRef}
      style={assignInlineVars({
        [radius1Var]: `${radius[1]}px`,
        [space1Var]: `${rem(space[1])}`,
        [enabledFgVar]: inputColor.enabled.fg,
        [enabledBoxShadowVar]: focusRingBorderStyle({
          color: inputColor.enabled.border,
          width: inputBorderWidth,
        }),
        [focusedBoxShadowVar]: focusRingStyle({
          border: {
            color: inputColor.enabled.border,
            width: inputBorderWidth,
          },
          focusRing: inputTheme.text.focusRing,
        }),
        [disabledFgVar]: inputColor.disabled.fg,
        [disabledBgVar]: inputColor.disabled.bg,
        [disabledBoxShadowVar]: focusRingBorderStyle({
          color: inputColor.disabled.border,
          width: inputBorderWidth,
        }),
      })}
    >
      {enabled && (
        <Box
          className={placeholder}
          hidden={Boolean(inputValue || value.length)}
          padding={3}
          style={assignInlineVars({[placeholderFgVar]: inputColor.enabled.placeholder})}
        >
          <Text textOverflow="ellipsis">
            {placeholderProp
              ? placeholderProp
              : t('inputs.tags.placeholder', {
                  context:
                    typeof window !== 'undefined' && 'ontouchstart' in window ? 'touch' : undefined,
                })}
          </Text>
        </Box>
      )}

      <div className={clsx('content', content)}>
        {value.map((tag, tagIndex) => (
          <Box key={`tag-${tagIndex}`} className={clsx(contentItem, tagBox)}>
            <Tag
              enabled={enabled}
              index={tagIndex}
              muted={!enabled}
              onRemove={handleTagRemove}
              tag={tag}
            />
          </Box>
        ))}

        <div key="tag-input" className={contentItem}>
          <input
            {...restProps}
            className={clsx(input, className)}
            disabled={!enabled}
            onBlur={handleInputBlur}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            ref={ref}
            style={{
              ...assignInlineVars({
                [inputFontSizeVar]: `${rem(textSize.fontSize)}`,
                [inputLineHeightVar]: `${textSize.lineHeight / textSize.fontSize}`,
                [inputFontFamilyVar]: font.text.family,
                [inputFontWeightVar]: `${font.text.weights.regular}`,
                [inputPaddingTopVar]: `${rem(space[2] - textSize.ascenderHeight)}`,
                [inputPaddingXVar]: `${rem(space[2])}`,
                [inputPaddingBottomVar]: `${rem(space[2] - textSize.descenderHeight)}`,
                [inputEnabledFgVar]: inputColor.enabled.fg,
                [inputDisabledFgVar]: inputColor.disabled.fg,
              }),
              ...style,
            }}
            type="text"
            value={inputValue}
          />
        </div>
      </div>
    </Card>
  )
}

function Tag(props: {
  enabled: boolean
  index: number
  muted?: boolean
  onRemove: (index: number) => void
  tag: {value: string}
}) {
  const {enabled, index, muted, onRemove, tag} = props

  const handleRemoveClick = useCallback(() => {
    onRemove(index)
  }, [index, onRemove])

  return (
    <Card data-ui="Tag" radius={2} tone="transparent">
      <Flex align="center" gap={1}>
        <Box
          flexBasis="0%"
          flexGrow={1}
          paddingY={2}
          paddingLeft={2}
          paddingRight={enabled ? undefined : 2}
        >
          <Text muted={muted} textOverflow="ellipsis">
            {tag.value}
          </Text>
        </Box>
        {enabled && (
          <Button
            icon={CloseIcon}
            mode="bleed"
            onClick={handleRemoveClick}
            tooltipProps={{content: 'Remove'}}
          />
        )}
      </Flex>
    </Card>
  )
}
