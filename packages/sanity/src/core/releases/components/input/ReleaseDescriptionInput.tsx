import {
  type BlockChildRenderProps,
  type EditorConfig,
  type EditorEmittedEvent,
  EditorProvider,
  PortableTextEditable,
  PortableTextEditor,
  type RenderChildFunction,
  usePortableTextEditor,
  usePortableTextEditorSelection,
} from '@portabletext/editor'
import {EventListenerPlugin} from '@portabletext/editor/plugins'
import {BoldIcon, ItalicIcon, LinkIcon, UnderlineIcon} from '@sanity/icons'
import {type Path, type PortableTextBlock} from '@sanity/types'
import {Box, Button, Card, Flex} from '@sanity/ui'
import {useEffect, useState} from 'react'
import {randomKey} from '@sanity/util/content'
import {type JSX, useCallback, useMemo} from 'react'
import {styled} from 'styled-components'

import {useModifierKey} from '../../../hooks'
import {UpdateReadOnlyPlugin} from '../../../form/inputs/PortableText/PortableTextInput'
import {releaseDescriptionSchema} from '../../schema/releaseDescriptionSchema'
import {type ReleaseDescription} from '../../types/releaseDescription'
import {normalizeDescriptionToPTE} from '../../util/descriptionConversion'
import {AutoLinkPlugin} from './AutoLinkPlugin'
import {ReleaseReferenceChip} from './ReleaseReferenceChip'
import {ReleasePickerDropdown} from './ReleasePickerDropdown'

interface ReleaseDescriptionInputProps {
  value: ReleaseDescription | undefined | null
  onChange: (value: PortableTextBlock[]) => void
  onFocus?: () => void
  onBlur?: () => void
  readOnly?: boolean
  disabled?: boolean
  placeholder?: string
}

const StyledCard = styled(Card)`
  [data-text-overflow] {
    text-overflow: ellipsis;
  }
`

const StyledEditable = styled(PortableTextEditable)`
  outline: none;
  min-height: 60px;
  padding: 12px;

  &[data-read-only='true'] {
    cursor: default;
  }
`

const TOOLBAR_BUTTONS = [
  {mark: 'strong', icon: BoldIcon, title: 'Bold (Cmd+B)'},
  {mark: 'em', icon: ItalicIcon, title: 'Italic (Cmd+I)'},
  {mark: 'underline', icon: UnderlineIcon, title: 'Underline (Cmd+U)'},
  {action: 'linkRelease', icon: LinkIcon, title: 'Link Release'},
] as const

function Toolbar({
  readOnly,
  showReleasePicker,
  onToggleReleasePicker,
}: {
  readOnly: boolean
  showReleasePicker: boolean
  onToggleReleasePicker: () => void
}): JSX.Element | null {
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()

  const handleToggleMark = useCallback(
    (mark: string) => {
      PortableTextEditor.toggleMark(editor, mark)
      PortableTextEditor.focus(editor)
    },
    [editor],
  )

  if (readOnly) return null

  return (
    <Box paddingX={2} paddingY={1} style={{borderBottom: '1px solid var(--card-border-color)'}}>
      <Flex gap={1}>
        {TOOLBAR_BUTTONS.map((button) => {
          if ('mark' in button) {
            return (
              <Button
                key={button.mark}
                mode="bleed"
                icon={button.icon}
                onClick={() => handleToggleMark(button.mark)}
                title={button.title}
                fontSize={1}
                padding={2}
                selected={selection ? PortableTextEditor.isMarkActive(editor, button.mark) : false}
              />
            )
          } else if (button.action === 'linkRelease') {
            return (
              <Button
                key={button.action}
                mode="bleed"
                icon={button.icon}
                onClick={onToggleReleasePicker}
                title={button.title}
                fontSize={1}
                padding={2}
                selected={showReleasePicker}
              />
            )
          }
          return null
        })}
      </Flex>
    </Box>
  )
}

// Inner component that has access to PTE context
function EditorContent({
  readOnly,
  placeholder,
  renderDecorator,
  renderAnnotation,
  renderChild,
}: {
  readOnly: boolean
  placeholder?: string
  renderDecorator: (props: {children: React.ReactNode; value: string}) => JSX.Element
  renderAnnotation: (props: {
    children: React.ReactNode
    value: {_type: string; href?: string}
  }) => JSX.Element
  renderChild: RenderChildFunction
}): JSX.Element {
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()

  // State for release picker dropdown
  const [showReleasePicker, setShowReleasePicker] = useState(false)
  const [insertPosition, setInsertPosition] = useState<{path: Path; offset: number} | null>(null)

  // Handle Link Release button click
  const handleToggleReleasePicker = useCallback(() => {
    if (showReleasePicker) {
      // Close if already open
      setShowReleasePicker(false)
      setInsertPosition(null)
    } else if (selection) {
      // Editor focused: show dropdown immediately
      setInsertPosition(selection.focus)
      setShowReleasePicker(true)
    } else {
      // Not focused: flag to show on next focus
      setShowReleasePicker(true)
    }
  }, [showReleasePicker, selection])

  // Effect: Set position when editor gets focus after button click
  useEffect(() => {
    if (showReleasePicker && !insertPosition && selection) {
      setInsertPosition(selection.focus)
    }
  }, [showReleasePicker, insertPosition, selection])

  // Handle dropdown close
  const handleCloseReleasePicker = useCallback(() => {
    setShowReleasePicker(false)
    setInsertPosition(null)
  }, [])

  return (
    <>
      <Box style={{position: 'relative'}}>
        <Toolbar
          readOnly={readOnly}
          showReleasePicker={showReleasePicker}
          onToggleReleasePicker={handleToggleReleasePicker}
        />
        {showReleasePicker && insertPosition && (
          <ReleasePickerDropdown
            editor={editor}
            insertPosition={insertPosition}
            onClose={handleCloseReleasePicker}
          />
        )}
      </Box>
      <StyledEditable
        renderPlaceholder={() => (placeholder ? <span>{placeholder}</span> : null)}
        renderDecorator={renderDecorator}
        renderAnnotation={renderAnnotation}
        renderChild={renderChild}
        data-testid="release-description-input"
      />
    </>
  )
}

export function ReleaseDescriptionInput(props: ReleaseDescriptionInputProps): JSX.Element {
  const {value, onChange, onFocus, onBlur, readOnly, disabled, placeholder} = props
  const isReadOnly = readOnly ?? disabled ?? false
  const {isPressed: isModifierPressed, onMouseEnter, onMouseLeave} = useModifierKey()
  const pteValue = useMemo(() => normalizeDescriptionToPTE(value ?? ''), [value])

  const [initialConfig] = useState<EditorConfig>(() => ({
    initialValue: pteValue,
    readOnly: isReadOnly,
    keyGenerator: () => randomKey(12),
    schema: releaseDescriptionSchema,
  }))

  const handleEditorEvent = useCallback(
    (event: EditorEmittedEvent) => {
      switch (event.type) {
        case 'focused':
          onFocus?.()
          break
        case 'blurred':
          onBlur?.()
          break
        case 'mutation':
          onChange((event.value ?? []) as PortableTextBlock[])
          break
      }
    },
    [onBlur, onChange, onFocus],
  )

  const renderDecorator = useCallback(
    (decoratorProps: {children: React.ReactNode; value: string}) => {
      const {children, value: mark} = decoratorProps
      switch (mark) {
        case 'strong':
          return <strong>{children}</strong>
        case 'em':
          return <em>{children}</em>
        case 'underline':
          return <u>{children}</u>
        default:
          return <>{children}</>
      }
    },
    [],
  )

  const renderAnnotation = useCallback(
    (annotationProps: {children: React.ReactNode; value: {_type: string; href?: string}}) => {
      const {children, value: annotation} = annotationProps
      if (annotation._type !== 'link' || annotation.href === undefined) {
        return <>{children}</>
      }

      const handleClick = (e: React.MouseEvent<HTMLAnchorElement>): void => {
        e.preventDefault()
        if (isReadOnly || e.metaKey || e.ctrlKey) {
          window.open(annotation.href, '_blank', 'noopener,noreferrer')
        }
      }

      return (
        <a
          href={annotation.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          style={{textDecoration: 'underline', color: 'var(--card-link-color)', cursor: isReadOnly || isModifierPressed ? 'pointer' : 'text'}}
          title={isReadOnly ? annotation.href : `${annotation.href} (Cmd+Click to open)`}
        >
          {children}
        </a>
      )
    },
    [isReadOnly, isModifierPressed],
  )

  const renderChild: RenderChildFunction = useCallback(
    (childProps: BlockChildRenderProps) => {
      const {children, value, selected} = childProps

      // Check if this is a release reference inline object
      if (value._type === 'releaseReference' && 'releaseId' in value) {
        return <ReleaseReferenceChip releaseId={value.releaseId as string} selected={selected} />
      }

      // Default: render children as-is (spans, text nodes, etc.)
      return children
    },
    [],
  )

  return (
    <StyledCard border radius={2} tone="default" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <EditorProvider initialConfig={initialConfig}>
        <EventListenerPlugin on={handleEditorEvent} />
        <UpdateReadOnlyPlugin readOnly={isReadOnly} />
        <AutoLinkPlugin />
        <EditorContent
          readOnly={isReadOnly}
          placeholder={placeholder}
          renderDecorator={renderDecorator}
          renderAnnotation={renderAnnotation}
          renderChild={renderChild}
        />
      </EditorProvider>
    </StyledCard>
  )
}
