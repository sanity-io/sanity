import {defineType, type ObjectDefinition} from 'sanity'

import {ColorInput} from '../LazyColorInput'
import {type ColorOptions} from '../types'

const round = (val: number = 1) => Math.round(val * 100)

const colorTypeName = 'color' as const

/**
 * @public
 */
export interface ColorDefinition extends Omit<ObjectDefinition, 'type' | 'fields' | 'options'> {
  type: typeof colorTypeName
  options?: ColorOptions
}

declare module '@sanity/types' {
  // makes type: 'color' narrow correctly when using defineTyp/defineField/defineArrayMember
  export interface IntrinsicDefinitions {
    color: ColorDefinition
  }
}

export const color = defineType({
  name: colorTypeName,
  type: 'object',
  title: 'Color',
  components: {input: ColorInput},
  fields: [
    {
      title: 'Hex',
      name: 'hex',
      type: 'string',
    },
    {
      title: 'Alpha',
      name: 'alpha',
      type: 'number',
    },
    {
      title: 'Hue Saturation Lightness',
      name: 'hsl',
      type: 'hslaColor',
    },
    {
      title: 'Hue Saturation Value',
      name: 'hsv',
      type: 'hsvaColor',
    },
    {
      title: 'Red Green Blue (rgb)',
      name: 'rgb',
      type: 'rgbaColor',
    },
  ],
  preview: {
    select: {
      title: 'hex',
      alpha: 'alpha',
      hex: 'hex',
      hsl: 'hsl',
    },
    prepare({
      title,
      hex,
      hsl,
      alpha,
    }: {
      title?: string
      alpha?: number
      hex?: string
      hsl?: {h: number; s: number; l: number}
    }) {
      let subtitle = hex || 'No color set'
      if (hsl) {
        subtitle = `H:${round(hsl.h)} S:${round(hsl.s)} L:${round(hsl.l)} A:${round(alpha)}`
      }
      return {
        title: title,
        subtitle: subtitle,
        media: () => (
          <div
            style={{
              backgroundColor: hex ?? '#000',
              opacity: alpha ?? 1,
              position: 'absolute',
              height: '100%',
              width: '100%',
              top: '0',
              left: '0',
            }}
          />
        ),
      }
    },
  },
})
