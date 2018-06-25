/* eslint-disable react/display-name */
import React from 'react'
import ColorInput from './ColorInput'

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
    },
    {
      title: 'Hue Saturation Lightness',
      name: 'hsl',
      type: 'object',
      fields: [
        {name: 'h', type: 'number', title: 'Hue'},
        {name: 's', type: 'number', title: 'Saturation'},
        {name: 'l', type: 'number', title: 'Lightness'},
        {name: 'a', type: 'number', title: 'Alpha'}
      ]
    },
    {
      title: 'Hue Saturation Value',
      name: 'hsv',
      type: 'object',
      fields: [
        {name: 'h', type: 'number', title: 'Hue'},
        {name: 's', type: 'number', title: 'Saturation'},
        {name: 'v', type: 'number', title: 'Value'},
        {name: 'a', type: 'number', title: 'Alpha'}
      ]
    },
    {
      title: 'Red Green Blue (rgb)',
      name: 'rgb',
      type: 'object',
      fields: [
        {name: 'r', type: 'number', title: 'Red'},
        {name: 'g', type: 'number', title: 'Green'},
        {name: 'b', type: 'number', title: 'Blue'},
        {name: 'a', type: 'number', title: 'Alpha'}
      ]
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
        subtitle = `H:${Math.round(hsl.l * 100)} S:${Math.round(hsl.l * 100)} L:${Math.round(
          hsl.l * 100
        )} A:${Math.round(alpha * 100)}` //eslint-disable-line max-len
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
                position: 'absolute',
                height: '100%',
                width: '100%',
                top: '0',
                left: '0'
              }}
            />
          )
        }
      }
    }
  }
}
