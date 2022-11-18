import React, {useCallback, useMemo} from 'react'
import {PortableTextInput, PortableTextInputProps, PortableTextMarker} from 'sanity'
import {PortableTextBlock} from '@sanity/types'
import {htmlToBlocks} from '@sanity/block-tools'
import {OnPasteFn} from '@sanity/portable-text-editor'
import {renderBlockActions} from './blockActions'
import {renderCustomMarkers} from './customMarkers'

export const commentStore: any = {}

export function CustomContentInput(inputProps: PortableTextInputProps) {
  const {value} = inputProps

  const handlePaste: OnPasteFn = useCallback((input) => {
    const {event, types, path} = input
    const html = event.clipboardData.getData('text/html')
    // check if schema has the code type
    const hasCodeType = types.portableText.of.map(({name}) => name).includes('code')
    if (!hasCodeType) {
      // eslint-disable-next-line no-console
      console.log('Run `sanity install @sanity/code-input, and add `type: "code"` to your schema.')
    }
    if (html && hasCodeType) {
      const blocks = htmlToBlocks(html, types.portableText, {
        rules: [
          {
            deserialize(el, next, block) {
              if (
                !(el instanceof HTMLElement) ||
                (el.tagName && el.tagName.toLowerCase() !== 'pre')
              ) {
                return undefined
              }
              const code = el.children[0]
              const childNodes =
                code && code.tagName.toLowerCase() === 'code' ? code.childNodes : el.childNodes
              let text = ''
              childNodes.forEach((node) => {
                text += node.textContent
              })
              /**
               * Return this as an own block (via block helper function),
               * instead of appending it to a default block's children
               */
              return block({
                _type: 'code',
                code: text,
              })
            },
          },
        ],
      }) as PortableTextBlock[]
      // Only paste this if it contains a single code block
      if (blocks.length === 1 && blocks[0]._type !== 'code') {
        return undefined
      }
      // return an insert patch
      return {insert: blocks, path}
    }
    return undefined
  }, [])

  // Extract markers from content
  const markers: PortableTextMarker[] = useMemo(() => {
    const ret: PortableTextMarker[] = []

    if (!value) return ret

    for (const block of value) {
      if (commentStore[block._key]) {
        ret.push({
          type: 'comment',
          data: commentStore[block._key],
          path: [{_key: block._key}],
        })
      }
    }

    return ret
  }, [value])

  return (
    <PortableTextInput
      {...inputProps}
      onPaste={handlePaste}
      markers={markers}
      renderBlockActions={renderBlockActions}
      renderCustomMarkers={renderCustomMarkers}
    />
  )
}
