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
import {MarkdownShortcutsPlugin} from '@portabletext/plugin-markdown-shortcuts'
import {PasteLinkPlugin} from '@portabletext/plugin-paste-link'
import {BoldIcon, ItalicIcon, UnderlineIcon} from '@sanity/icons'
import {type PortableTextBlock} from '@sanity/types'
import {Box, Card, Flex} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {randomKey} from '@sanity/util/content'
import {type JSX, useCallback, useMemo, useState} from 'react'
import {css, styled} from 'styled-components'

import {Button} from '../../../../ui-components'
import {UpdateReadOnlyPlugin} from '../../../form/inputs/PortableText/PortableTextInput'
import {useModifierKey} from '../../../hooks'
import {releaseDescriptionSchema} from '../../schema/releaseDescriptionSchema'
import {type ReleaseDescription} from '../../types/releaseDescription'
import {normalizeDescriptionToPTE} from '../../util/descriptionConversion'
import {AutoLinkPlugin} from './AutoLinkPlugin'
import {ReleaseLinkMenuButton} from './ReleaseLinkMenuButton'
import {ReleaseReferenceChip} from './ReleaseReferenceChip'

interface ReleaseDescriptionInputProps {
  value: ReleaseDescription | undefined | null
  onChange: (value: PortableTextBlock[]) => void
  onFocus?: () => void
  onBlur?: () => void
  readOnly?: boolean
  disabled?: boolean
  placeholder?: string
  excludeReleaseId?: string
}

const EDITOR_PADDING = 12

const StyledCard = styled(Card)`
  [data-text-overflow] {
    text-overflow: ellipsis;
  }
`

const StyledEditable = styled(PortableTextEditable)`
  outline: none;
  min-height: 60px;
  padding: ${EDITOR_PADDING}px;

  &[data-read-only='true'] {
    cursor: default;
  }
`

const PlaceholderWrapper = styled.span((props) => {
  const {color, font} = getTheme_v2(props.theme)
  return css`
    color: ${color.input.default.enabled.placeholder};
    font-family: ${font.text.family};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
    padding-left: ${EDITOR_PADDING}px;
  `
})

const MARK_BUTTONS = [
  {mark: 'strong', icon: BoldIcon, title: 'Bold (Cmd+B)'},
  {mark: 'em', icon: ItalicIcon, title: 'Italic (Cmd+I)'},
  {mark: 'underline', icon: UnderlineIcon, title: 'Underline (Cmd+U)'},
] as const

function Toolbar({readOnly}: {readOnly: boolean}): JSX.Element | null {
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
        {MARK_BUTTONS.map((button) => (
          <Button
            key={button.mark}
            mode="bleed"
            icon={button.icon}
            onClick={() => handleToggleMark(button.mark)}
            tooltipProps={{content: button.title}}
            selected={selection ? PortableTextEditor.isMarkActive(editor, button.mark) : false}
          />
        ))}
        <ReleaseLinkMenuButton selected={false} />
      </Flex>
    </Box>
  )
}

export function ReleaseDescriptionInput(props: ReleaseDescriptionInputProps): JSX.Element {
  const {value, onChange, onFocus, onBlur, readOnly, disabled, placeholder, excludeReleaseId} =
    props
  const isReadOnly = readOnly ?? disabled ?? false
  const {isPressed: isModifierPressed, onMouseEnter, onMouseLeave} = useModifierKey()
  const pteValue = useMemo(() => normalizeDescriptionToPTE(value ?? undefined), [value])

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
        default:
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
      const isLink = annotation._type === 'link' && typeof annotation.href === 'string'

      if (isLink) {
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
            style={{
              textDecoration: 'underline',
              color: 'var(--card-link-color)',
              cursor: isReadOnly || isModifierPressed ? 'pointer' : 'text',
            }}
            title={annotation.href}
          >
            {children}
          </a>
        )
      }

      return <>{children}</>
    },
    [isReadOnly, isModifierPressed],
  )

  const renderChild: RenderChildFunction = useCallback(
    (childProps: BlockChildRenderProps) => {
      const {children, value: childValue, selected, path} = childProps

      if (childValue._type === 'releaseReference' && 'releaseId' in childValue) {
        return (
          <ReleaseReferenceChip
            releaseId={childValue.releaseId as string}
            selected={selected}
            path={path}
            excludeReleaseId={excludeReleaseId}
          />
        )
      }

      return children
    },
    [excludeReleaseId],
  )

  return (
    <StyledCard
      border
      radius={2}
      tone="default"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <EditorProvider initialConfig={initialConfig}>
        <EventListenerPlugin on={handleEditorEvent} />
        <UpdateReadOnlyPlugin readOnly={isReadOnly} />
        <AutoLinkPlugin />
        <PasteLinkPlugin />
        <MarkdownShortcutsPlugin
          boldDecorator={({context}) =>
            context.schema.decorators.find((d: {name: string}) => d.name === 'strong')?.name
          }
          italicDecorator={({context}) =>
            context.schema.decorators.find((d: {name: string}) => d.name === 'em')?.name
          }
        />
        <Toolbar readOnly={isReadOnly} />
        <StyledEditable
          renderPlaceholder={() =>
            placeholder ? <PlaceholderWrapper>{placeholder}</PlaceholderWrapper> : null
          }
          renderDecorator={renderDecorator}
          renderAnnotation={renderAnnotation}
          renderChild={renderChild}
          data-testid="release-description-input"
        />
      </EditorProvider>
    </StyledCard>
  )
}
