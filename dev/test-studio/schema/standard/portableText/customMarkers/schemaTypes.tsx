import React from 'react'
import {defineType, BlockMemberRenderProps} from 'sanity'
import {LinkIcon, RocketIcon} from '@sanity/icons'
import {CustomContentInput} from './CustomContentInput'

const DecoratorBoost = (props: BlockMemberRenderProps) => {
  return <span style={{backgroundColor: 'yellow'}}>{props.defaultRender(props)}</span>
}

const StyleNormal = (props: BlockMemberRenderProps) => {
  return <span style={{fontFamily: 'monospace'}}>{props.defaultRender(props)}</span>
}

const HyperLinkItem = (props: BlockMemberRenderProps) => {
  return <span style={{color: 'blue'}}>{props.defaultRender(props)}</span>
}

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
                icon: LinkIcon,
                components: {
                  item: HyperLinkItem,
                },
              },
            ],
            decorators: [
              {
                title: 'Boost',
                value: 'boost',
                icon: RocketIcon,
                components: {
                  item: DecoratorBoost,
                },
              },
            ],
          },
          styles: [
            {
              title: 'Normal',
              value: 'normal',
              components: {
                item: StyleNormal,
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
