// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {type ChangeEvent, useCallback} from 'react'
import {set, type StringFieldProps} from 'sanity'
import styled, {css} from 'styled-components'

const Root = styled.div`
  padding-top: 14px;
  padding-bottom: 7px;
`
const TitleInput = styled.input((props) => {
  const {color, font} = getTheme_v2(props.theme)

  return css`
    appearance: none;
    background: none;
    border: 0;
    padding: 0;
    border-radius: 0;
    outline: none;
    width: 100%;
    box-sizing: border-box;
    font-family: ${font.text.family};
    font-weight: ${font.text.weights.semibold};
    font-size: ${font.text.sizes[3].fontSize}px;
    line-height: ${font.text.sizes[3].lineHeight}px;
    margin: 0;
    position: relative;
    z-index: 1;
    display: block;

    /* NOTE: This is a hack to disable Chrome’s autofill styles */
    &:-webkit-autofill,
    &:-webkit-autofill:hover,
    &:-webkit-autofill:focus,
    &:-webkit-autofill:active {
      -webkit-text-fill-color: var(--input-fg-color) !important;
      transition: background-color 5000s;
      transition-delay: 86400s /* 24h */;
    }

    color: ${color.input.default.enabled.fg};

    &::placeholder {
      color: ${color.input.default.enabled.placeholder};
    }
  `
})

export function TitleField(props: StringFieldProps) {
  const {value, inputProps} = props
  const {onChange} = inputProps
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      return onChange(set(event.currentTarget.value))
    },
    [onChange],
  )

  return (
    <Root>
      <TitleInput
        value={value}
        placeholder={props.inputProps.schemaType.placeholder}
        onChange={handleChange}
      />
    </Root>
  )
}
