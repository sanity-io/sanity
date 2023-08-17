/* eslint-disable react/display-name */

import {DropIcon} from '@sanity/icons'
import React from 'react'
import {defineType} from 'sanity'

export default defineType({
  name: 'colorTest',
  type: 'document',
  title: 'Color',
  icon: DropIcon,
  preview: {
    select: {
      title: 'title',
      color: 'testColor1',
    },

    prepare({title, color}) {
      let subtitle = (color && color.hex) || 'No color set'
      if (color && color.hsl) {
        subtitle = `${color.hex}` //eslint-disable-line max-len
      }
      return {
        title: title,
        subtitle: subtitle,
        description:
          color &&
          color.hsl &&
          `H:${Math.round(color.hsl.l * 100)} S:${Math.round(color.hsl.l * 100)} L:${Math.round(
            color.hsl.l * 100,
          )} A:${Math.round(color.hsl.a * 100)}`,
        media: () => (
          <div
            style={{
              backgroundColor: (color && color.hex) || '#000',
              opacity: (color && color.alpha) || 1,
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
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    // {
    //   name: 'testColor1',
    //   title: 'Color to be used in preview',
    //   description: 'A color input',
    //   type: 'color',
    // },
    // {
    //   name: 'testColor2',
    //   title: 'Color with no alpha',
    //   description: 'A color input with no alpha',
    //   type: 'color',
    //   options: {
    //     disableAlpha: true,
    //   },
    // },
    // {
    //   name: 'colorList',
    //   title: 'List of colors',
    //   description: 'An array of colors with the built in color preview',
    //   type: 'array',
    //   of: [
    //     {
    //       type: 'color',
    //     },
    //   ],
    // },
    // {
    //   name: 'readOnlyColor',
    //   title: 'Read-only color',
    //   description: 'Color input in readOnly mode',
    //   readOnly: true,
    //   type: 'color',
    // },
    // {
    //   name: 'colorGrid',
    //   title: 'Grid of colors',
    //   description: 'An grid of colors with the built in color preview',
    //   type: 'array',
    //   options: {
    //     layout: 'grid',
    //   },
    //   of: [
    //     {
    //       type: 'color',
    //     },
    //   ],
    // },
    // {
    //   name: 'objectWithObjectWithColors',
    //   title: 'Object with object with colors',
    //   type: 'object',
    //   fields: [
    //     {
    //       name: 'objectWithColors',
    //       title: 'Object with colors',
    //       type: 'object',
    //       fields: [
    //         {name: 'primaryColor', title: 'Primary color', type: 'color'},
    //         {name: 'secondaryColor', title: 'Secondary color', type: 'color'},
    //         {name: 'extraColor', title: 'Extra color', type: 'color'},
    //       ],
    //     },
    //   ],
    // },
  ],
})
