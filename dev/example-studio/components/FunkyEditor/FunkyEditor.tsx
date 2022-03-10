import PropTypes from 'prop-types'
import React from 'react'
import {BlockEditor, FormInputProps} from '@sanity/form-builder'
import {
  PortableTextBlock,
  PortableTextEditor,
  Type as PortableTextArraySchemaType,
} from '@sanity/portable-text-editor'
import {Stack, Text} from '@sanity/ui'
import CustomMarkers from './CustomMarkers'
import BlockActions from './BlockActions'
import {extractTextFromBlocks, handlePaste} from './helpers'

export type FunkyEditorProps = FormInputProps<PortableTextBlock[], PortableTextArraySchemaType>

const FunkyEditor = (props: FunkyEditorProps) => {
  const {value, onFocus, type, ...restProps} = props

  return (
    <Stack space={3}>
      <BlockEditor
        {...restProps}
        type={type}
        onFocus={onFocus}
        onPaste={handlePaste}
        renderBlockActions={(blockActionsProps) => <BlockActions {...blockActionsProps} />}
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
        markers={[
          {
            type: 'customMarkerTest',
            path: value?.[0] ? [{_key: value[0]._key}] : [],
          },
        ]}
        value={value}
      />
      <Text as="p" muted size={1}>
        Text length: <strong>{extractTextFromBlocks(props.value || []).length}</strong> characters
      </Text>
    </Stack>
  )
}

FunkyEditor.propTypes = {
  type: PropTypes.shape({
    title: PropTypes.string,
  }).isRequired,
  level: PropTypes.number,
  value: PropTypes.arrayOf(PropTypes.any),
  markers: PropTypes.arrayOf(PropTypes.any),
  onChange: PropTypes.func.isRequired,
}

export default FunkyEditor
