import {type Path} from '@sanity/types'
import {vars} from '@sanity/ui/css'
import {type ChangeEvent, useCallback, useEffect, useRef} from 'react'
import {styled} from 'styled-components'

import {type FormPatch, type PatchEvent, set, type StringFieldProps, unset} from '../../../../form'

const Root = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  padding-top: ${vars.space[3]};
`

const TitleInput = styled.textarea`
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
  font-family: ${vars.font.text.family};
  font-weight: ${vars.font.text.weight.semibold};
  font-size: ${vars.font.text.scale[3].fontSize};
  line-height: ${vars.font.text.scale[3].lineHeight};
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

  color: ${vars.color.tinted.default.fg[2]};

  &::placeholder {
    color: ${vars.color.tinted.default.border[4]};
  }
`

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
