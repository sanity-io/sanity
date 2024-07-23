import {CloseIcon} from '@sanity/icons'
import {Box, Card, Flex, isHTMLElement, rem, Text, type Theme} from '@sanity/ui'
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
import {css, type CSSObject, styled} from 'styled-components'

import {Button} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {studioLocaleNamespace} from '../../../i18n/localeNamespaces'
import {focusRingBorderStyle, focusRingStyle} from './styles'

const Root = styled(Card)((props: {theme: Theme}): CSSObject => {
  const {theme} = props
  const {focusRing, input, radius} = theme.sanity
  const color = theme.sanity.color.input
  const space = rem(theme.sanity.space[1])

  return {
    'position': 'relative',
    'borderRadius': `${radius[1]}px`,
    'color': color.default.enabled.fg,
    'boxShadow': focusRingBorderStyle({
      color: color.default.enabled.border,
      width: input.border.width,
    }),

    '& > .content': {
      position: 'relative',
      lineHeight: 0,
      margin: `-${space} 0 0 -${space}`,
    },

    '& > .content > div': {
      display: 'inline-block',
      verticalAlign: 'top',
      padding: `${space} 0 0 ${space}`,
    },

    // enabled
    '&:not([data-read-only])': {
      cursor: 'text',
    },

    // hovered
    '@media(hover:hover):not([data-disabled]):not([data-read-only]):hover': {
      borderColor: color.default.hovered.border,
    },

    // focused
    '&:not([data-disabled]):not([data-read-only])[data-focused]': {
      boxShadow: focusRingStyle({
        border: {
          color: color.default.enabled.border,
          width: input.border.width,
        },
        focusRing,
      }),
    },

    // disabled
    '*:disabled + &': {
      color: color.default.disabled.fg,
      backgroundColor: color.default.disabled.bg,
      boxShadow: focusRingBorderStyle({
        color: color.default.disabled.border,
        width: input.border.width,
      }),
    },
  }
})

const Input = styled.input((props: {theme: Theme}): CSSObject => {
  const {theme} = props
  const font = theme.sanity.fonts.text
  const color = theme.sanity.color.input
  const p = theme.sanity.space[2]
  const size = theme.sanity.fonts.text.sizes[2]

  return {
    'appearance': 'none',
    'background': 'none',
    'border': 0,
    'borderRadius': 0,
    'outline': 'none',
    'fontSize': rem(size.fontSize),
    'lineHeight': size.lineHeight / size.fontSize,
    'fontFamily': font.family,
    'fontWeight': font.weights.regular,
    'margin': 0,
    'display': 'block',
    'minWidth': '1px',
    'maxWidth': '100%',
    'boxSizing': 'border-box',
    'paddingTop': rem(p - size.ascenderHeight),
    'paddingRight': rem(p),
    'paddingBottom': rem(p - size.descenderHeight),
    'paddingLeft': rem(p),

    // enabled
    '&:not(:invalid):not(:disabled)': {
      color: color.default.enabled.fg,
    },

    // disabled
    '&:not(:invalid):disabled': {
      color: color.default.disabled.fg,
    },
  }
})

const Placeholder = styled(Box)((props: {theme: Theme}) => {
  const {theme} = props
  const color = theme.sanity.color.input

  return css`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    pointer-events: none;
    --card-fg-color: ${color.default.enabled.placeholder};
  `
})

const TagBox = styled(Box)`
  // This is needed to make textOverflow="ellipsis" work properly for the Text primitive
  max-width: 100%;
`

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

    return (
      <Root
        data-disabled={disabled ? '' : undefined}
        data-focused={focused ? '' : undefined}
        data-read-only={readOnly ? '' : undefined}
        data-ui="TagInput"
        onPointerDown={handleRootPointerDown}
        overflow="auto"
        padding={1}
        ref={rootRef}
      >
        {enabled && (
          <Placeholder hidden={Boolean(inputValue || value.length)} padding={3}>
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
          </Placeholder>
        )}

        <div className="content">
          {value.map((tag, tagIndex) => (
            // eslint-disable-next-line react/no-array-index-key
            <TagBox key={`tag-${tagIndex}`}>
              <Tag
                enabled={enabled}
                index={tagIndex}
                muted={!enabled}
                onRemove={handleTagRemove}
                tag={tag}
              />
            </TagBox>
          ))}

          <div key="tag-input">
            <Input
              {...restProps}
              disabled={!enabled}
              onBlur={handleInputBlur}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onKeyDown={handleInputKeyDown}
              ref={ref}
              type="text"
              value={inputValue}
            />
          </div>
        </div>
      </Root>
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
