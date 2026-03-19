import {CloseIcon} from '@sanity/icons'
import {Box, Card, Flex, isHTMLElement, rem, Text} from '@sanity/ui'
import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {
  type ChangeEvent,
  type FocusEvent,
  forwardRef,
  type HTMLProps,
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

import {Button} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {studioLocaleNamespace} from '../../../i18n/localeNamespaces'
import {focusRingBorderStyle, focusRingStyle} from './styles'
import {
  borderRadiusVar,
  boxShadowVar,
  contentItemStyle,
  contentStyle,
  focusBoxShadowVar,
  inputColorVar,
  inputDisabledColorVar,
  inputFontFamilyVar,
  inputFontSizeVar,
  inputFontWeightVar,
  inputLineHeightVar,
  inputPaddingBottomVar,
  inputPaddingLeftVar,
  inputPaddingRightVar,
  inputPaddingTopVar,
  inputStyle,
  placeholderColorVar,
  placeholderStyle,
  rootStyle,
  spaceVar,
  tagBox,
} from './tagInput.css'

export const TagInput = forwardRef(
  (
    props: {
      readOnly?: boolean
      onChange?: (newValue: {value: string}[]) => void
      onFocus?: (event: FocusEvent) => void
      placeholder?: string
      value?: {value: string}[]
    } & Omit<HTMLProps<HTMLInputElement>, 'as' | 'onChange' | 'onFocus' | 'ref' | 'value'>,
    forwardedRef: React.ForwardedRef<HTMLInputElement>,
  ) => {
    const {
      disabled,
      onChange,
      onFocus,
      placeholder: placeholderProp,
      readOnly,
      value = [],
      ...restProps
    } = props

    const {t} = useTranslation(studioLocaleNamespace)
    const theme = useThemeV2()
    const [inputValue, setInputValue] = useState('')
    const enabled = !disabled && !readOnly
    const [focused, setFocused] = useState(false)
    const ref = useRef<HTMLInputElement | null>(null)
    const rootRef = useRef<HTMLDivElement | null>(null)

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
        inputElement.style.width = `${inputElement.scrollWidth}px`
      }
    }, [inputValue])

    const {input, radius, fonts, color: themeColor, space} = theme
    const color = themeColor.input || themeColor
    const spaceVal = rem(space[1])
    const font = fonts.text
    const size = fonts.text.sizes[2]
    const p = space[2]

    return (
      <Card
        className={rootStyle}
        data-disabled={disabled ? '' : undefined}
        data-focused={focused ? '' : undefined}
        data-read-only={readOnly ? '' : undefined}
        data-ui="TagInput"
        onPointerDown={handleRootPointerDown}
        overflow="auto"
        padding={1}
        ref={rootRef}
        style={assignInlineVars({
          [borderRadiusVar]: `${radius[1]}px`,
          [boxShadowVar]: focusRingBorderStyle({
            color: 'var(--card-border-color)',
            width: input.border.width,
          }),
          [focusBoxShadowVar]: focusRingStyle({
            border: {
              color: 'var(--card-border-color)',
              width: input.border.width,
            },
            focusRing: theme.card.focusRing,
          }),
          [spaceVar]: spaceVal,
        })}
      >
        {enabled && (
          <Box
            className={placeholderStyle}
            hidden={Boolean(inputValue || value.length)}
            padding={3}
            style={assignInlineVars({
              [placeholderColorVar]: 'var(--card-muted-fg-color)',
            })}
          >
            <Text textOverflow="ellipsis">
              {placeholderProp
                ? placeholderProp
                : t('inputs.tags.placeholder', {
                    context:
                      typeof window !== 'undefined' && 'ontouchstart' in window
                        ? 'touch'
                        : undefined,
                  })}
            </Text>
          </Box>
        )}

        <div className={contentStyle}>
          {value.map((tag, tagIndex) => (
            <div className={contentItemStyle} key={`tag-${tagIndex}`}>
              <Box className={tagBox}>
                <Tag
                  enabled={enabled}
                  index={tagIndex}
                  muted={!enabled}
                  onRemove={handleTagRemove}
                  tag={tag}
                />
              </Box>
            </div>
          ))}

          <div className={contentItemStyle} key="tag-input">
            <input
              {...restProps}
              className={inputStyle}
              disabled={!enabled}
              onBlur={handleInputBlur}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onKeyDown={handleInputKeyDown}
              ref={ref}
              type="text"
              value={inputValue}
              style={assignInlineVars({
                [inputFontSizeVar]: rem(size.fontSize),
                [inputLineHeightVar]: `${size.lineHeight / size.fontSize}`,
                [inputFontFamilyVar]: font.family,
                [inputFontWeightVar]: `${font.weights.regular}`,
                [inputPaddingTopVar]: rem(p - size.ascenderHeight),
                [inputPaddingRightVar]: rem(p),
                [inputPaddingBottomVar]: rem(p - size.descenderHeight),
                [inputPaddingLeftVar]: rem(p),
                [inputColorVar]: 'var(--card-fg-color)',
                [inputDisabledColorVar]: 'var(--card-muted-fg-color)',
              })}
            />
          </div>
        </div>
      </Card>
    )
  },
)

TagInput.displayName = 'ForwardRef(TagInput)'

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
        <Box flex={1} paddingY={2} paddingLeft={2}>
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
