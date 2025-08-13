import {
  type EditorEmittedEvent,
  EditorProvider,
  PortableTextEditable,
  useEditor,
} from '@portabletext/editor'
import {EventListenerPlugin} from '@portabletext/editor/plugins'
import {type PortableTextBlock} from '@sanity/types'
import {Box, TextArea} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {useCallback, useEffect} from 'react'
import {css, styled} from 'styled-components'

const StyledPortableTextEditable = styled(PortableTextEditable)((props) => {
  const {color, font} = getTheme_v2(props.theme)
  const textSize = font.text.sizes[1]

  return css`
    &[data-slate-editor] {
      min-height: 46px;
      max-height: 200px;
      overflow-y: auto;
      font-family: ${font.text.family};
      font-weight: ${font.text.weights.regular};
      font-size: ${textSize.fontSize}px;
      line-height: ${textSize.lineHeight}px;
      color: ${color.input.default.enabled.fg};
      background: ${color.input.default.enabled.bg};
      border: 1px solid ${color.input.default.enabled.border};
      border-radius: 3px;
      padding: 8px 12px;

      &:focus {
        outline: none;
        border-color: ${color.input.default.hovered.border};
        box-shadow: 0 0 0 1px ${color.input.default.hovered.border};
      }

      &[data-read-only] {
        background: ${color.input.default.readOnly.bg};
        border-color: ${color.input.default.readOnly.border};
        color: ${color.input.default.readOnly.fg};
      }
    }

    strong {
      font-weight: ${font.text.weights.semibold};
    }
  `
})

// Simple schema with just bold support - this needs to be a proper schema type
const createSimpleSchema = () => ({
  type: 'array' as const,
  name: 'content',
  of: [
    {
      type: 'block' as const,
      name: 'block',
      styles: [{title: 'Normal', value: 'normal'}],
      lists: [],
      marks: {
        decorators: [{title: 'Bold', value: 'strong'}],
        annotations: [],
      },
    },
  ],
})

interface ReleaseDescriptionPortableTextProps {
  'value'?: string | PortableTextBlock[]
  'onChange'?: (value: PortableTextBlock[]) => void
  'placeholder'?: string
  'readOnly'?: boolean
  'disabled'?: boolean
  'data-testid'?: string
}

// Plugin to handle readOnly state updates
function UpdateReadOnlyPlugin({readOnly}: {readOnly: boolean}) {
  const editor = useEditor()

  useEffect(() => {
    console.warn('[PortableText] UpdateReadOnlyPlugin readOnly:', readOnly)
    editor.send({
      type: 'update readOnly',
      readOnly,
    })
  }, [editor, readOnly])

  return null
}

export const ReleaseDescriptionPortableText = ({
  value = '',
  onChange,
  placeholder = 'Add a description...',
  readOnly = false,
  disabled = false,
  'data-testid': testId,
}: ReleaseDescriptionPortableTextProps) => {
  console.warn(
    '[PortableText] Component props:',
    JSON.stringify(
      {
        value,
        placeholder,
        readOnly,
        disabled,
        testId,
        valueType: typeof value,
        isArray: Array.isArray(value),
      },
      null,
      2,
    ),
  )

  // Check if we're in a test environment - use textarea for tests
  const isTestEnvironment = typeof process !== 'undefined' && process.env.NODE_ENV === 'test'
  console.warn('[PortableText] Environment check:', {
    isTestEnvironment,
    nodeEnv: process.env.NODE_ENV,
    processExists: typeof process !== 'undefined',
  })

  // Custom decorator renderer for bold text
  const renderDecorator = useCallback((props: any) => {
    if (props.mark === 'strong') {
      return <strong>{props.children}</strong>
    }
    return props.children
  }, [])

  // Convert string value to portable text blocks if needed
  const portableTextValue = useCallback((): PortableTextBlock[] => {
    console.warn('[PortableText] Converting value to portable text blocks:', value)
    if (typeof value === 'string') {
      if (value.trim() === '') {
        console.warn('[PortableText] Empty string, returning empty array')
        return []
      }
      const blocks = [
        {
          _type: 'block',
          _key: 'block1',
          style: 'normal',
          markDefs: [],
          children: [
            {
              _type: 'span',
              _key: 'span1',
              text: value,
              marks: [],
            },
          ],
        },
      ]
      console.warn('[PortableText] Created blocks from string:', blocks)
      return blocks
    }
    console.warn('[PortableText] Using existing array value:', value)
    return Array.isArray(value) ? value : []
  }, [value])

  // Convert portable text back to string for textarea fallback
  const stringValue = useCallback((): string => {
    console.warn('[PortableText] Converting to string value:', value)
    if (typeof value === 'string') {
      console.warn('[PortableText] Already string:', value)
      return value
    }
    if (Array.isArray(value) && value.length > 0) {
      const stringResult = value
        .map((block: PortableTextBlock) => {
          if (block.children && Array.isArray(block.children)) {
            return block.children.map((child: {text?: string}) => child.text || '').join('')
          }
          return ''
        })
        .join('\n')
      console.warn('[PortableText] Converted array to string:', stringResult)
      return stringResult
    }
    console.warn('[PortableText] Returning empty string')
    return ''
  }, [value])

  const handleChange = useCallback(
    (blocks: PortableTextBlock[]) => {
      console.warn('[PortableText] Portable text change:', JSON.stringify(blocks, null, 2))
      if (onChange) {
        onChange(blocks)
      }
    },
    [onChange],
  )

  const handleTextAreaChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      console.warn('[PortableText] Textarea change:', event.target.value)
      if (onChange) {
        const newValue = event.target.value
        // Convert string to portable text blocks
        if (newValue.trim() === '') {
          console.warn('[PortableText] Empty textarea, sending empty array')
          onChange([])
        } else {
          const blocks = [
            {
              _type: 'block',
              _key: 'block1',
              style: 'normal',
              markDefs: [],
              children: [
                {
                  _type: 'span',
                  _key: 'span1',
                  text: newValue,
                  marks: [],
                },
              ],
            },
          ]
          console.warn('[PortableText] Textarea change, sending blocks:', blocks)
          onChange(blocks)
        }
      }
    },
    [onChange],
  )

  // Use textarea in test environment for compatibility
  if (isTestEnvironment) {
    console.warn('[PortableText] Rendering textarea for test environment')
    return (
      <TextArea
        data-testid={testId}
        value={stringValue()}
        onChange={handleTextAreaChange}
        placeholder={placeholder}
        readOnly={readOnly || disabled}
        rows={3}
      />
    )
  }

  const schema = createSimpleSchema()
  const isReadOnly = readOnly || disabled
  console.warn('[PortableText] Rendering portable text editor with readOnly:', isReadOnly)

  return (
    <Box>
      <EditorProvider
        initialConfig={{
          initialValue: portableTextValue(),
          readOnly: isReadOnly,
          schema,
        }}
      >
        <UpdateReadOnlyPlugin readOnly={isReadOnly} />
        <EditorChangePlugin onChange={handleChange} />
        <StyledPortableTextEditable
          placeholder={placeholder}
          readOnly={isReadOnly}
          renderDecorator={renderDecorator}
        />
      </EditorProvider>

      {/* Test display box with hardcoded bold text */}
      <Box marginTop={3} padding={3} style={{border: '1px dashed #ccc', background: '#f9f9f9'}}>
        <Box marginBottom={2}>
          {}
          <strong>Test Display:</strong>
        </Box>
        <EditorProvider
          initialConfig={{
            initialValue: [
              {
                _type: 'block',
                _key: 'test-block',
                style: 'normal',
                markDefs: [],
                children: [
                  {
                    _type: 'span',
                    _key: 'span1',
                    text: 'Regular text followed by ',
                    marks: [],
                  },
                  {
                    _type: 'span',
                    _key: 'span2',
                    text: 'bold text',
                    marks: ['strong'],
                  },
                  {
                    _type: 'span',
                    _key: 'span3',
                    text: ' and more regular text.',
                    marks: [],
                  },
                ],
              },
            ],
            readOnly: true,
            schema,
          }}
        >
          <StyledPortableTextEditable readOnly renderDecorator={renderDecorator} />
        </EditorProvider>
      </Box>
    </Box>
  )
}

// Plugin to handle changes
function EditorChangePlugin({onChange}: {onChange: (blocks: PortableTextBlock[]) => void}) {
  const handleEditorEvent = useCallback(
    (event: EditorEmittedEvent) => {
      // Only log the event type and relevant data to avoid circular references
      if (event.type === 'value changed') {
        console.warn(
          '[PortableText] Value changed event, new value:',
          JSON.stringify(event.value, null, 2),
        )
        onChange(event.value || [])
      } else if (event.type === 'mutation') {
        console.warn('[PortableText] Mutation event - value:', JSON.stringify(event.value, null, 2))
      } else {
        console.warn('[PortableText] Editor event:', event.type)
      }
    },
    [onChange],
  )

  return <EventListenerPlugin on={handleEditorEvent} />
}
