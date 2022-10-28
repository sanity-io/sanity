import React from 'react'
import {defineType} from 'sanity'
import {structureGroupOptions} from '../../../../structure/groupByOption'
import TorusKnotInput from './TorusKnotInput'
import {LazyPreviewMedia, LazyColorInput} from './TorusKnotLazyComponents'

const initialBase = '#ff4eb8'
const initialColorA = '#00ffff'
const initialColorB = '#ff8f00'

const TorusKnotIcon = () => (
  <LazyPreviewMedia base={initialBase} colorA={initialColorA} colorB={initialColorB} />
)

export const torusKnotType = defineType({
  type: 'document',
  name: 'demo-3d-torus-knot',
  title: '3D Torus Knot',
  icon: TorusKnotIcon,
  options: structureGroupOptions({
    structureGroup: '3d',
  }),
  preview: {
    select: {
      title: 'title',
      base: 'scene.base',
      colorA: 'scene.colorA',
      colorB: 'scene.colorB',
    },
    prepare: (props: any) => {
      return {
        title: props.title,
        subtitle: `base: ${props.base}, colorA: ${props.colorA}, colorB: ${props.colorB}`,
        media: <LazyPreviewMedia {...props} />,
      }
    },
  },
  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title',
    },

    {
      type: 'object',
      name: 'scene',
      title: '3D Scene',
      description: 'Based on the delightful https://codesandbox.io/s/layer-materials-nvup4',

      components: {
        input: TorusKnotInput,
      },
      fieldsets: [
        {
          name: 'colors',
          title: 'Colors',
          options: {columns: 3},
        },
      ],
      fields: [
        {
          type: 'string',
          name: 'base',
          title: 'Base',
          fieldset: 'colors',
          initialValue: initialBase,
          components: {input: LazyColorInput},
        },
        {
          type: 'string',
          name: 'colorA',
          title: 'Color A',
          fieldset: 'colors',
          initialValue: initialColorA,
          components: {input: LazyColorInput},
        },
        {
          type: 'string',
          name: 'colorB',
          title: 'Color B',
          fieldset: 'colors',
          initialValue: initialColorB,
          components: {input: LazyColorInput},
        },
      ],
    },
  ],
})
