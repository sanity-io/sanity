/* eslint-disable react/display-name */
import ColorInput from './ColorInput'
import React from 'react'

export default {
  name: 'color',
  type: 'object',
  title: 'Color',
  inputComponent: ColorInput,
  fields: [
    {
      title: 'Hex',
      name: 'hex',
      type: 'string'
    },
    {
      title: 'Alpha',
      name: 'alpha',
      type: 'number'
    }
  ],
  preview: {
    select: {
      title: 'hex',
      alpha: 'alpha',
      hex: 'hex',
      hsl: 'hsl'
    },
    prepare({title, hex, hsl, alpha}) {
      let subtitle = hex || 'No color set'
      if (hsl) {
        subtitle = `H:${Math.round(hsl.l * 100)} S:${Math.round(hsl.l * 100)} L:${Math.round(hsl.l * 100)} A:${Math.round(alpha * 100)}` //eslint-disable-line max-len
      }
      return {
        title: title,
        subtitle: subtitle,
        media: () => {
          return (
            <div
              style={{
                backgroundColor: hex || '#000',
                opacity: alpha || 1,
                position: 'absolute', height: '100%', width: '100%', top: '0', left: '0'
              }}
            />
          )
        }
      }
    }
  }
}
