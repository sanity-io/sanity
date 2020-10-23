/* eslint-disable react/display-name */
import React from 'react'
import ColorInput from '../ColorInput'

const round = (val) => Math.round(val * 100)

export default {
  name: 'color',
  type: 'object',
  title: 'Color',
  inputComponent: ColorInput,
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
    prepare({title, hex, hsl, alpha}) {
      let subtitle = hex || 'No color set'
      if (hsl) {
        subtitle = `H:${round(hsl.l)} S:${round(hsl.l)} L:${round(hsl.l)} A:${round(alpha)}`
      }
      return {
        title: title,
        subtitle: subtitle,
        media: () => (
          <div
            style={{
              backgroundColor: hex || '#000',
              opacity: alpha || 1,
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
}
