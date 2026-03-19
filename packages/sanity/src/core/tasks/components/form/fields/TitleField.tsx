import {type Path} from '@sanity/types'
// eslint-disable-next-line camelcase
import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type ChangeEvent, useCallback, useEffect, useRef} from 'react'

import {type FormPatch, type PatchEvent, set, type StringFieldProps, unset} from '../../../../form'
import * as classes from './TitleField.css'

export function Title(props: {
  value: string | undefined
  path?: Path
  onChange: (patch: FormPatch | PatchEvent | FormPatch[]) => void
  placeholder?: string
}) {
  const {value, onChange, placeholder, path} = props
  const ref = useRef<HTMLTextAreaElement | null>(null)
  const {color, font} = useThemeV2()

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
    <div
      className={classes.root}
      style={assignInlineVars({
        [classes.paddingTopVar]: `${useThemeV2().space[3]}px`,
      })}
    >
      <textarea
        className={classes.titleInput}
        ref={ref}
        autoFocus={!value}
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        rows={1}
        style={assignInlineVars({
          [classes.fontFamilyVar]: font.text.family,
          [classes.fontWeightVar]: String(font.text.weights.semibold),
          [classes.fontSizeVar]: `${font.text.sizes[3].fontSize}px`,
          [classes.lineHeightVar]: `${font.text.sizes[3].lineHeight}px`,
          [classes.fgColorVar]: color.input.default.enabled.fg,
          [classes.placeholderColorVar]: color.input.default.enabled.placeholder,
        })}
      />
    </div>
  )
}

export function TitleField(props: StringFieldProps) {
  const {value, inputProps} = props
  const {onChange, schemaType} = inputProps

  return <Title value={value} onChange={onChange} placeholder={schemaType.placeholder} />
}
