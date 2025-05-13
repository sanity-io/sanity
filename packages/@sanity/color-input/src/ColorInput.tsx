import {AddIcon} from '@sanity/icons'
import {Button} from '@sanity/ui'
import {startTransition, useCallback, useDeferredValue, useEffect, useRef, useState} from 'react'
import {type ObjectInputProps, set, setIfMissing, unset} from 'sanity'
import {useEffectEvent} from 'use-effect-event'

import {ColorPicker} from './ColorPicker'
import type {ColorSchemaType, ColorValue} from './types'

const DEFAULT_COLOR: ColorValue & {source: string} = {
  hex: '#24a3e3',
  hsl: {h: 200, s: 0.7732, l: 0.5156, a: 1},
  hsv: {h: 200, s: 0.8414, v: 0.8901, a: 1},
  rgb: {r: 46, g: 163, b: 227, a: 1},
  source: 'hex',
}

export default function ColorInput(props: ObjectInputProps) {
  const {onChange, readOnly} = props
  const value = props.value as ColorValue | undefined
  const type = props.schemaType as ColorSchemaType
  const focusRef = useRef<HTMLButtonElement>(null)

  // use local state so we can have instant ui updates while debouncing patch emits
  const [color, setColor] = useState(value)
  // Marking the `setColor` in a transition allows React to interrupt render should the user start dragging the input before React is finished rendering
  useEffect(() => startTransition(() => setColor(value)), [value])

  // The color picker emits onChange events continuously while the user is sliding the
  // hue/saturation/alpha selectors. This debounces the event to avoid excessive patches
  // and massively improve render performance and avoid jank
  const [emitColor, setEmitColor] = useState<typeof value>(undefined)
  const debouncedColor = useDeferredValue(emitColor)
  const handleChange = useEffectEvent((nextColor: ColorValue) => {
    const fieldPatches = type.fields
      .filter((field) => field.name in nextColor)
      .map((field) => {
        const nextFieldValue = nextColor[field.name as keyof ColorValue]
        const isObject = field.type.jsonType === 'object'
        return set(
          isObject ? Object.assign({_type: field.type.name}, nextFieldValue) : nextFieldValue,
          [field.name],
        )
      })

    onChange([
      setIfMissing({_type: type.name}),
      set(type.name, ['_type']),
      set(nextColor.rgb?.a, ['alpha']),
      ...fieldPatches,
    ])
  })
  useEffect(() => {
    if (!debouncedColor) return undefined
    const raf = requestAnimationFrame(() => handleChange(debouncedColor))
    return () => cancelAnimationFrame(raf)
  }, [debouncedColor, handleChange])

  const handleCreateColor = useCallback(() => {
    setColor(DEFAULT_COLOR)
    setEmitColor(DEFAULT_COLOR)
  }, [])

  const handleColorChange = useCallback((nextColor: ColorValue) => {
    setColor(nextColor)
    setEmitColor(nextColor)
  }, [])

  const handleUnset = useCallback(() => {
    setColor(undefined)
    onChange(unset())
  }, [onChange])

  return (
    <>
      {value && value.hex ? (
        <ColorPicker
          color={color}
          onChange={handleColorChange}
          readOnly={readOnly || (typeof type.readOnly === 'boolean' && type.readOnly)}
          disableAlpha={!!type.options?.disableAlpha}
          colorList={type.options?.colorList}
          onUnset={handleUnset}
        />
      ) : (
        <Button
          icon={AddIcon}
          mode="ghost"
          text="Create color"
          ref={focusRef}
          disabled={Boolean(readOnly)}
          onClick={handleCreateColor}
        />
      )}
    </>
  )
}
