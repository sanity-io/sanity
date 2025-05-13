import type {Color, HSLColor, HSVColor, RGBColor} from 'react-color'
import type {ObjectInputProps, ObjectOptions, ObjectSchemaType} from 'sanity'

export interface ColorValue {
  hex: string
  hsl: HSLColor
  hsv: HSVColor
  rgb: RGBColor
}

export interface ColorOptions extends Omit<ObjectOptions, 'columns'> {
  disableAlpha?: boolean
  colorList?: Array<Color>
}

export type ColorSchemaType = Omit<ObjectSchemaType, 'options'> & {
  options?: ColorOptions
}
export type ColorInputProps = ObjectInputProps<ColorValue, ColorSchemaType>
