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
import {Box, Card, Flex, useClickOutsideEvent} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {randomKey} from '@sanity/util/content'
import {isEqual} from 'lodash-es'
import {
  type JSX,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {css, styled} from 'styled-components'

import {Button, Popover, type PopoverProps} from '../../../../ui-components'
import {UpdateReadOnlyPlugin} from '../../../form/inputs/PortableText/PortableTextInput'
import {useModifierKey} from '../../../hooks'
import {releaseDescriptionSchema} from '../../schema/releaseDescriptionSchema'
import {type ReleaseDescription} from '../../types/releaseDescription'
import {normalizeDescriptionToPTE} from '../../util/descriptionConversion'
import {AutoLinkPlugin} from './AutoLinkPlugin'
import {ReleaseLinkMenuButton} from './ReleaseLinkMenuButton'
import {ReleaseReferenceChip} from './ReleaseReferenceChip'
import {SlashCommandMenu, type SlashCommandMenuHandle} from './SlashCommandMenu'
import {useCursorElement} from './useCursorElement'
import {useSlashCommands} from './useSlashCommands'

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

const StyledEditable = styled(PortableTextEditable)((props) => {
  const {color, font} = getTheme_v2(props.theme)
  return css`
    outline: none;
    min-height: 60px;
    padding: ${EDITOR_PADDING}px;
    font-family: ${font.text.family};
    font-weight: ${font.text.weights.regular};
    font-size: ${font.text.sizes[2].fontSize}px;
    line-height: ${font.text.sizes[2].lineHeight}px;
    color: ${color.input.default.enabled.fg};

    &[data-read-only='true'] {
      cursor: default;
    }
  `
})

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

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['bottom', 'top']

const StyledPopover = styled(Popover)(({theme}) => {
  const {space, radius} = theme.sanity
  return css`
    &[data-placement='bottom'] {
      transform: translateY(${space[1]}px);
    }
    &[data-placement='top'] {
      transform: translateY(-${space[1]}px);
    }
    [data-ui='Popover__wrapper'] {
      border-radius: ${radius[3]}px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
      width: 240px;
    }
  `
})

const MARK_BUTTONS = [
  {mark: 'strong', icon: BoldIcon, label: 'Bold'},
  {mark: 'em', icon: ItalicIcon, label: 'Italic'},
  {mark: 'underline', icon: UnderlineIcon, label: 'Underline'},
] as const

interface EditorInnerProps {
  isReadOnly: boolean
  placeholder: string | undefined
  renderDecorator: (decoratorProps: {children: React.ReactNode; value: string}) => JSX.Element
  renderAnnotation: (annotationProps: {
    children: React.ReactNode
    value: {_type: string; href?: string}
  }) => JSX.Element
  renderChild: RenderChildFunction
}

function EditorInner(props: EditorInnerProps): JSX.Element {
  const {isReadOnly, placeholder, renderDecorator, renderAnnotation, renderChild} = props
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const [editableElement, setEditableElement] = useState<HTMLDivElement | null>(null)
  const menuRef = useRef<SlashCommandMenuHandle | null>(null)

  const {menuOpen, searchTerm, commands, closeMenu, onBeforeInput, executeCommand} =
    useSlashCommands({
      editor,
      disabled: isReadOnly,
    })

  const cursorElement = useCursorElement({disabled: !menuOpen, rootElement})

  useEffect(() => {
    menuRef.current?.setSearchTerm(searchTerm)
  }, [searchTerm])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!menuOpen) return
      switch (event.key) {
        case 'Escape':
        case 'ArrowLeft':
        case 'ArrowRight':
          event.preventDefault()
          event.stopPropagation()
          closeMenu()
          break
        case 'Enter':
          event.preventDefault()
          event.stopPropagation()
          break
        default:
      }
    },
    [menuOpen, closeMenu],
  )

  useClickOutsideEvent(menuOpen && closeMenu, () => [popoverRef.current])

  useEffect(() => {
    if (menuOpen && selection && !isEqual(selection.anchor, selection.focus)) {
      closeMenu()
    }
  }, [menuOpen, closeMenu, selection])

  return (
    <div ref={setRootElement}>
      {!isReadOnly && (
        <Box paddingX={2} paddingY={1} style={{borderBottom: '1px solid var(--card-border-color)'}}>
          <Flex gap={1}>
            {MARK_BUTTONS.map((button) => (
              <Button
                key={button.mark}
                mode="bleed"
                icon={button.icon}
                onClick={() => {
                  PortableTextEditor.toggleMark(editor, button.mark)
                  PortableTextEditor.focus(editor)
                }}
                tooltipProps={{content: button.label}}
                selected={!!selection && PortableTextEditor.isMarkActive(editor, button.mark)}
              />
            ))}
            <ReleaseLinkMenuButton selected={false} />
          </Flex>
        </Box>
      )}
      <StyledPopover
        arrow={false}
        constrainSize
        content={
          <SlashCommandMenu
            ref={menuRef}
            commands={commands}
            inputElement={editableElement}
            onSelect={executeCommand}
          />
        }
        disabled={!menuOpen}
        fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
        open={menuOpen}
        placement="bottom"
        ref={popoverRef}
        referenceElement={cursorElement}
      />
      <StyledEditable
        ref={setEditableElement}
        renderPlaceholder={() =>
          placeholder ? <PlaceholderWrapper>{placeholder}</PlaceholderWrapper> : null
        }
        renderDecorator={renderDecorator}
        renderAnnotation={renderAnnotation}
        renderChild={renderChild}
        onBeforeInput={onBeforeInput}
        onKeyDown={handleKeyDown}
        data-testid="release-description-input"
      />
    </div>
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
      }
    },
    [onBlur, onChange, onFocus],
  )

  const renderDecorator = useCallback(
    ({children, value: mark}: {children: React.ReactNode; value: string}) => {
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
    ({
      children,
      value: annotation,
    }: {
      children: React.ReactNode
      value: {_type: string; href?: string}
    }) => {
      if (annotation._type !== 'link' || typeof annotation.href !== 'string') {
        return <>{children}</>
      }

      return (
        <a
          href={annotation.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault()
            if (isReadOnly || e.metaKey || e.ctrlKey) {
              window.open(annotation.href, '_blank', 'noopener,noreferrer')
            }
          }}
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
    },
    [isReadOnly, isModifierPressed],
  )

  const renderChild: RenderChildFunction = useCallback(
    ({children, value, selected, path}: BlockChildRenderProps) => {
      if (value._type === 'releaseReference' && 'releaseId' in value) {
        return (
          <ReleaseReferenceChip
            releaseId={value.releaseId as string}
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
        <EditorInner
          isReadOnly={isReadOnly}
          placeholder={placeholder}
          renderDecorator={renderDecorator}
          renderAnnotation={renderAnnotation}
          renderChild={renderChild}
        />
      </EditorProvider>
    </StyledCard>
  )
}
