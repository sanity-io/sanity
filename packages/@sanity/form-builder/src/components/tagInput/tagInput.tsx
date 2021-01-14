/* eslint-disable import/named */

import {CloseIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, isHTMLElement, rem, Text, Theme, useForwardedRef} from '@sanity/ui'
import React, {forwardRef, useCallback, useEffect, useRef, useState} from 'react'
import styled, {CSSObject} from 'styled-components'
import {focusRingBorderStyle, focusRingStyle} from './styles'

const Root = styled(Box)(
  (props: {theme: Theme}): CSSObject => {
    const {theme} = props
    const {focusRing, input, radius} = theme.sanity
    const color = theme.sanity.color.input
    const space = rem(theme.sanity.space[1])

    return {
      borderRadius: `${radius[1]}px`,
      color: color.default.enabled.fg,
      backgroundColor: color.default.enabled.bg,
      boxShadow: focusRingBorderStyle({
        color: color.default.enabled.border,
        width: input.border.width,
      }),

      '& > div': {
        lineHeight: 0,
        margin: `-${space} 0 0 -${space}`,
      },

      '& > div > div': {
        display: 'inline-block',
        verticalAlign: 'top',
        padding: `${space} 0 0 ${space}`,
      },

      // enabled
      '&:not([data-read-only])': {
        cursor: 'text',
      },

      // hovered
      '@media(hover:hover)': {
        '&:not([data-disabled]):not([data-read-only]):hover': {
          borderColor: color.default.hovered.border,
        },
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
  }
)

const Input = styled.input(
  (props: {theme: Theme}): CSSObject => {
    const {theme} = props
    const font = theme.sanity.fonts.text
    const color = theme.sanity.color.input
    const p = theme.sanity.space[2]
    const size = theme.sanity.fonts.text.sizes[2]

    return {
      appearance: 'none',
      background: 'none',
      border: 0,
      borderRadius: 0,
      outline: 'none',
      fontSize: rem(size.fontSize),
      lineHeight: size.lineHeight / size.fontSize,
      fontFamily: font.family,
      fontWeight: font.weights.regular,
      margin: 0,
      display: 'block',
      minWidth: '1px',
      maxWidth: '100%',
      boxSizing: 'border-box',
      paddingTop: rem(p - size.ascenderHeight),
      paddingRight: rem(p),
      paddingBottom: rem(p - size.descenderHeight),
      paddingLeft: rem(p),

      // enabled
      '&:not(:invalid):not(:disabled)': {
        color: color.default.enabled.fg,

        '&::placeholder': {
          color: color.default.enabled.placeholder,
        },
      },

      // disabled
      '&:not(:invalid):disabled': {
        color: color.default.disabled.fg,

        '&::placeholder': {
          color: color.default.disabled.placeholder,
        },
      },
    }
  }
)

export const TagInput = forwardRef(
  (
    props: {
      readOnly?: boolean
      onChange?: (newValue: {value: string}[]) => void
      onFocus?: () => void
      value?: {value: string}[]
    } & Omit<React.HTMLProps<HTMLInputElement>, 'as' | 'onChange' | 'onFocus' | 'ref' | 'value'>,
    ref: React.Ref<HTMLInputElement>
  ) => {
    const {disabled, onChange, onFocus, readOnly, value = [], ...restProps} = props
    const [inputValue, setInputValue] = useState('')
    const enabled = !disabled && !readOnly
    const [focused, setFocused] = useState(false)
    const forwardedRef = useForwardedRef(ref)
    const rootRef = useRef<HTMLDivElement | null>(null)

    const handleRootPointerDown = useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        const isTagElement = isHTMLElement(event.target) && event.target.closest('[data-ui="Tag"]')

        if (isTagElement) return

        const inputElement = forwardedRef.current

        if (inputElement) {
          setTimeout(() => inputElement.focus(), 0)
        }
      },
      [forwardedRef]
    )

    const handleInputBlur = useCallback(() => {
      setFocused(false)
    }, [])

    const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(event.currentTarget.value)
    }, [])

    const handleInputFocus = useCallback(() => {
      setFocused(true)
      if (onFocus) onFocus()
    }, [onFocus])

    const handleInputKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLInputElement>) => {
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
      [inputValue, onChange, value]
    )

    const handleTagRemove = useCallback(
      (index: number) => {
        if (!onChange) return

        const newValue = value.slice(0)

        newValue.splice(index, 1)

        onChange(newValue)
      },
      [onChange, value]
    )

    useEffect(() => {
      const inputElement = forwardedRef.current

      if (inputElement) {
        inputElement.style.width = '0'
        inputElement.style.width = `${inputElement.scrollWidth}px`
      }
    }, [forwardedRef, inputValue])

    return (
      <Root
        data-disabled={disabled ? '' : undefined}
        data-focused={focused ? '' : undefined}
        data-read-only={readOnly ? '' : undefined}
        data-ui="TagInput"
        onPointerDown={handleRootPointerDown}
        padding={1}
        ref={rootRef}
      >
        <div>
          {value.map((tag, tagIndex) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={`tag-${tagIndex}`}>
              <Tag
                enabled={enabled}
                index={tagIndex}
                muted={disabled}
                onRemove={handleTagRemove}
                tag={tag}
              />
            </div>
          ))}

          <div key="tag-input">
            <Input
              {...restProps}
              disabled={disabled}
              onBlur={handleInputBlur}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onKeyDown={handleInputKeyDown}
              ref={forwardedRef}
              type="text"
              value={inputValue}
            />
          </div>
        </div>
      </Root>
    )
  }
)

TagInput.displayName = 'TagInput'

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
    <Card data-ui="Tag" padding={1} radius={2} tone="transparent">
      <Flex align="center">
        <Box flex={1} padding={1}>
          <Text muted={muted}>{tag.value}</Text>
        </Box>

        {enabled && (
          <Box marginLeft={1}>
            <Button icon={CloseIcon} mode="bleed" onClick={handleRemoveClick} padding={1} />
          </Box>
        )}
      </Flex>
    </Card>
  )
}
