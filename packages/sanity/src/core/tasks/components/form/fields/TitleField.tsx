import {type Path} from '@sanity/types'
import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type ChangeEvent, useCallback, useEffect, useRef} from 'react'

import {set, unset} from '../../../../form/patch/patch'
import {type PatchEvent} from '../../../../form/patch/PatchEvent'
import {type FormPatch} from '../../../../form/patch/types'
import {type StringFieldProps} from '../../../../form/types/fieldProps'
import {
  fontTextFamilyVar,
  fontTextSize3FontSizeVar,
  fontTextSize3LineHeightVar,
  fontTextWeightSemiboldVar,
  inputFgColorVar,
  inputPlaceholderColorVar,
  root,
  space3Var,
  titleInput,
} from './TitleField.css'

export function Title(props: {
  value: string | undefined
  path?: Path
  onChange: (patch: FormPatch | PatchEvent | FormPatch[]) => void
  placeholder?: string
}) {
  const {value, onChange, placeholder, path} = props
  const ref = useRef<HTMLTextAreaElement | null>(null)
  const {color, font, space} = useThemeV2()

  useEffect(() => {
    // Set the height of the title to make it auto grow.
    if (!ref.current) return
    ref.current.style.height = 'auto'
    ref.current.style.height = `${ref.current.scrollHeight}px`
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- pre-existing violation, to be fixed in a follow-up
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
    <div className={root} style={assignInlineVars({[space3Var]: `${space[3]}px`})}>
      <textarea
        className={titleInput}
        ref={ref}
        autoFocus={!value}
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        rows={1}
        style={assignInlineVars({
          [fontTextFamilyVar]: font.text.family,
          [fontTextWeightSemiboldVar]: String(font.text.weights.semibold),
          [fontTextSize3FontSizeVar]: `${font.text.sizes[3].fontSize}px`,
          [fontTextSize3LineHeightVar]: `${font.text.sizes[3].lineHeight}px`,
          [inputFgColorVar]: color.input.default.enabled.fg,
          [inputPlaceholderColorVar]: color.input.default.enabled.placeholder,
        })}
      />
    </div>
  )
}

export function TitleField(props: StringFieldProps) {
  const {value, inputProps} = props
  const {onChange, schemaType} = inputProps

  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  return <Title value={value} onChange={onChange} placeholder={schemaType.placeholder} />
}
