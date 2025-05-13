import {definePlugin} from 'sanity'

import {color, type ColorDefinition} from './schemas/color'
import {hslaColor} from './schemas/hslaColor'
import {hsvaColor} from './schemas/hsvaColor'
import {rgbaColor} from './schemas/rgbaColor'

export const colorInput = definePlugin({
  name: '@sanity/color-input',
  schema: {
    types: [hslaColor, hsvaColor, rgbaColor, color],
  },
})

export {color, hslaColor, hsvaColor, rgbaColor}
export {ColorInput} from './LazyColorInput'
export type {ColorDefinition}
export type {ColorInputProps, ColorOptions, ColorSchemaType, ColorValue} from './types'
