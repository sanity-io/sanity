import React from 'react'
import {PatchEvent} from '@sanity/base/form'
import {BlockEditor} from '@sanity/form-builder'
import {OnPasteFn, PortableTextBlock, PortableTextEditor} from '@sanity/portable-text-editor'
import {htmlToBlocks} from '@sanity/block-tools'
import {ArraySchemaType, Marker, Path} from '@sanity/types'
import {DocumentPresence} from '@sanity/base/presence'
import CustomMarkers from './CustomMarkers'
import BlockActions from './BlockActions'

export interface FunkyEditorProps {
  focusPath: Path
  level: number
  markers: Marker[]
  onBlur: () => void
  onChange: (event: PatchEvent) => void
  onFocus: (pathOrEvent?: Path | React.FocusEvent) => void
  presence: DocumentPresence[]
  readOnly: boolean
  type: ArraySchemaType
  value?: PortableTextBlock[]
}

function extractTextFromBlocks(blocks: {_type: string; children?: any[]}[]) {
  if (!blocks) {
    return ''
  }
  return blocks
    .filter((val) => val._type === 'block')
    .map((block) => {
      return (block.children || [])
        .filter((child) => child._type === 'span')
        .map((span) => span.text)
        .join('')
    })
    .join('')
}

const handlePaste: OnPasteFn = (input) => {
  const {event, type, path} = input
  const html = 'clipboardData' in event && (event as any).clipboardData.getData('text/html')
  // check if schema has the code type
  const hasCodeType = type.of?.map(({name}) => name).includes('code')
  if (!hasCodeType) {
    // eslint-disable-next-line no-console
    console.log('Run `sanity install @sanity/code-input, and add `type: "code"` to your schema.')
  }
  if (html && hasCodeType) {
    const blocks = htmlToBlocks(html, type, {
      rules: [
        {
          deserialize(el: any, next: any, block: any) {
            /**
             *  `el` and `next` is DOM Elements
             * learn all about them:
             * https://developer.mozilla.org/en-US/docs/Web/API/Element
             **/

            if (!el || !el.children || (el.tagName && el.tagName.toLowerCase() !== 'pre')) {
              return undefined
            }
            const code = el.children[0]
            const childNodes =
              code && code.tagName.toLowerCase() === 'code' ? code.childNodes : el.childNodes
            let text = ''
            childNodes.forEach((node: any) => {
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
    })
    // return an insert patch
    return {insert: blocks, path}
  }
  return undefined
}

const EMPTY_ARRAY: never[] = []

export const FunkyEditor = (props: FunkyEditorProps) => {
  const {markers, value = EMPTY_ARRAY, onFocus, type} = props
  return (
    <div>
      <BlockEditor
        {...props}
        type={type as any}
        onPaste={handlePaste}
        renderBlockActions={BlockActions as any}
        renderCustomMarkers={CustomMarkers}
        hotkeys={{
          custom: {
            'control+k': (e, editor) => {
              e.preventDefault()
              const existing = PortableTextEditor.activeAnnotations(editor).find(
                (a) => a._type === 'link'
              )
              if (existing) {
                const focusBlock = PortableTextEditor.focusBlock(editor)
                if (focusBlock) {
                  const aPath = [{_key: focusBlock._key}, 'markDefs', {_key: existing._key}, '$']
                  PortableTextEditor.blur(editor)
                  onFocus(aPath)
                }
              } else {
                const paths = PortableTextEditor.addAnnotation(editor, {name: 'link'} as any)
                if (paths && paths.markDefPath) {
                  PortableTextEditor.blur(editor)
                  onFocus(paths.markDefPath.concat('$'))
                }
              }
            },
          },
        }}
        markers={markers.concat([
          {
            type: 'customMarkerTest',
            path: value?.[0] ? [{_key: value[0]._key}] : [],
          },
        ])}
        value={value}
      />
      <p>
        Text length: <strong>{extractTextFromBlocks(props.value || []).length}</strong> characters
      </p>
    </div>
  )
}
