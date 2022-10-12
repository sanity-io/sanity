import React from 'react'
import {defineType} from 'sanity'
import {LinkIcon, RocketIcon} from '@sanity/icons'
import {CustomContentInput} from './CustomContentInput'

const boostRender = (props: any) => (
  <span style={{backgroundColor: 'yellow'}}>{props.children}</span>
)

const normalRender = (props: any) => <span style={{fontFamily: 'monospace'}}>{props.children}</span>

const hyperLinkRender = (props: any) => <span style={{color: 'blue'}}>{props.children}</span>

export const ptCustomMarkersTestType = defineType({
  type: 'document',
  name: 'pt_customMarkersTest',
  title: 'Custom markers',

  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title',
    },

    {
      type: 'array',
      name: 'content',
      title: 'Content',
      of: [
        {
          type: 'block',
          marks: {
            annotations: [
              {
                type: 'object',
                name: 'hyperlink',
                title: 'Hyperlink',
                fields: [{type: 'string', name: 'href', title: 'URL'}],
                blockEditor: {
                  icon: LinkIcon,
                  render: hyperLinkRender,
                },
              },
            ],
            decorators: [
              {
                title: 'Boost',
                value: 'boost',
                blockEditor: {
                  icon: RocketIcon,
                  render: boostRender,
                },
              },
            ],
          },
          styles: [
            {
              title: 'Normal',
              value: 'normal',
              blockEditor: {
                render: normalRender,
              },
            },
          ],
        },
        {type: 'code'},
      ],
      components: {input: CustomContentInput},
    },
  ],
})
