import {type Path} from '@sanity/types'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {type ChangeEvent, useCallback, useEffect, useRef} from 'react'
import {css, styled} from 'styled-components'

import {type FormPatch, type PatchEvent, set, type StringFieldProps, unset} from '../../../../form'

const Root = styled.div((props) => {
  const theme = getTheme_v2(props.theme)
  return `
      display: grid;
      grid-template-columns: 1fr;
      padding-top: ${theme.space[3]}px;
    `
})
const TitleInput = styled.textarea((props) => {
  const {color, font} = getTheme_v2(props.theme)

  return css`
    resize: none;
    overflow: hidden;
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
    transition: height 500ms;
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

export function Title(props: {
  value: string | undefined
  path?: Path
  onChange: (patch: FormPatch | PatchEvent | FormPatch[]) => void
  placeholder?: string
}) {
  const {value, onChange, placeholder, path} = props
  const ref = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    // Set the height of the title to make it auto grow.
    if (!ref.current) return
    ref.current.style.height = 'auto'
    ref.current.style.height = `${ref.current.scrollHeight}px`
  }, [value])

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const inputValue = event.currentTarget.value
      if (!inputValue) onChange(unset(path))
      return onChange(set(inputValue.replace(/\n/g, ''), path))
    },
    [onChange, path],
  )

  return (
    <Root>
      <TitleInput
        ref={ref}
        autoFocus={!value}
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        rows={1}
      />
    </Root>
  )
}

export function TitleField(props: StringFieldProps) {
  const {value, inputProps} = props
  const {onChange, schemaType} = inputProps

  return <Title value={value} onChange={onChange} placeholder={schemaType.placeholder} />
}
