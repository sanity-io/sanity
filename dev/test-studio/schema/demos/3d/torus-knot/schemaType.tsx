import React, {lazy, Suspense} from 'react'
import {defineType} from 'sanity'
import styled from 'styled-components'
import {Box, Inline} from '@sanity/ui'
import {structureGroupOptions} from '../../../../structure/groupByOption'
import {SchemaIcon} from './SchemaIcon'

const TorusKnotInput = lazy(() => import('./TorusKnotInput'))
const TorusKnotPreview = lazy(() => import('./TorusKnotPreview'))
// const TorusKnotInputPreview = lazy(() => import('./TorusKnotInputPreview'))
const ColorInput = lazy(() => import('./ColorInput'))
const ColorPreview = styled(Box).attrs({padding: 2})`
  border-radius: 2px;
  background: red;
`

/*

 <Suspense fallback={null}>
            <div
              className="overflow-hidden rounded-[3px] bg-[#f0f0f0]"
              style={{
                height: '35px',
                width: '35px',
                overflow: 'hidden',
                borderRadius: '3px',
              }}
            >
              <LaminaLayering thumbnail element={props} />
            </div>
          </Suspense>
// */

export const torusKnotType = defineType({
  type: 'document',
  name: 'demo-3d-torus-knot',
  title: '3D Torus Knot',
  icon: SchemaIcon,
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
        subtitle: `base: ${props.base}, colorA: ${props.colorA}, colorB: ${props.colorB}`,
        title: props.title,
        media: <TorusKnotPreview {...props} />,
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
          initialValue: '#ff4eb8',
          components: {
            input: ColorInput,
          },
        },
        {
          type: 'string',
          name: 'colorA',
          title: 'Color A',
          fieldset: 'colors',
          initialValue: '#00ffff',
          components: {
            input: ColorInput,
          },
        },
        {
          type: 'string',
          name: 'colorB',
          title: 'Color B',
          fieldset: 'colors',
          initialValue: '#ff8f00',
          components: {
            input: ColorInput,
          },
        },
      ],
    },
  ],
})
