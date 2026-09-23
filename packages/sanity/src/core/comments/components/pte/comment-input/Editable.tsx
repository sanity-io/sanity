import {
  defineInlineObject,
  defineTextBlock,
  type EditorSelection,
  PortableTextEditable,
  usePortableTextEditorSelection,
} from '@portabletext/editor'
import {NodePlugin} from '@portabletext/editor/plugins'
import {isPortableTextSpan, isPortableTextTextBlock} from '@sanity/types'
import {useClickOutsideEvent, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {dequal as isEqual} from 'dequal/lite'
import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {Popover, type PopoverProps} from '../../../../../ui-components/popover/Popover'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {commentsLocaleNamespace} from '../../../i18n'
import {MentionsMenu, type MentionsMenuHandle} from '../../mentions/MentionsMenu'
import {MentionInlineBlock} from '../blocks/MentionInlineBlock'
import {type CommentInputRenderBlock} from './CommentInput'
import {
  placeholderColorVar,
  placeholderWrapper,
  radius3Var,
  space1Var,
  styledPopover,
} from './Editable.css'
import {useCommentInput} from './useCommentInput'
import {useCursorElement} from './useCursorElement'

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['bottom', 'top']
const INLINE_STYLE: React.CSSProperties = {outline: 'none'}
const EMPTY_ARRAY: [] = []

function PlaceholderWrapper(props: {children: ReactNode}) {
  const {color} = useThemeV2()

  return (
    <span
      className={placeholderWrapper}
      style={assignInlineVars({[placeholderColorVar]: color.input.default.enabled.placeholder})}
    >
      {props.children}
    </span>
  )
}

interface EditableProps {
  focusLock?: boolean
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  onBlur?: (e: React.FormEvent<HTMLDivElement>) => void
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  onFocus?: (e: React.FormEvent<HTMLDivElement>) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  onSubmit?: () => void
  placeholder?: React.ReactNode
  renderBlock: CommentInputRenderBlock
}

interface EditableHandle {
  setShowMentionOptions: (show: boolean) => void
}

export function Editable(props: EditableProps) {
  const {t} = useTranslation(commentsLocaleNamespace)
  const {
    focusLock,
    onFocus,
    onBlur,
    onKeyDown,
    onSubmit,
    placeholder = t('compose.create-comment-placeholder'),
    renderBlock,
  } = props
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const [inputElement, setInputElement] = useState<HTMLDivElement | null>(null)
  const mentionsMenuRef = useRef<MentionsMenuHandle | null>(null)
  const {space, radius} = useThemeV2()

  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const selection = usePortableTextEditorSelection()

  const {
    canSubmit,
    closeMentions,
    insertMention,
    mentionOptions,
    mentionsMenuOpen,
    mentionsSearchTerm,
    onBeforeInput,
    value,
  } = useCommentInput()

  const cursorElement = useCursorElement({
    disabled: !mentionsMenuOpen,
    rootElement: rootElement,
  })

  const renderPlaceholder = useCallback(
    () => <PlaceholderWrapper>{placeholder}</PlaceholderWrapper>,
    [placeholder],
  )

  const nodes = useMemo(
    () => [
      defineTextBlock({
        type: 'block',
        render: (blockProps) => (
          <div {...blockProps.attributes}>{renderBlock({children: blockProps.children})}</div>
        ),
      }),
      defineInlineObject({
        type: 'mention',
        render: (mentionProps) =>
          mentionProps.node.userId ? (
            <span {...mentionProps.attributes}>
              {/* Carries the engine's caret spacer; dropping this loses cursor placement around the mention. */}
              {mentionProps.children}
              {/* `draggable` makes the mention movable and keeps its text
                  unselectable (a draggable element starts a drag instead of a
                  text selection), matching the legacy pipeline's wrapper. */}
              <span draggable={!mentionProps.readOnly} style={{display: 'inline-block'}}>
                <MentionInlineBlock
                  selected={mentionProps.selected}
                  userId={mentionProps.node.userId as string}
                />
              </span>
            </span>
          ) : (
            mentionProps.renderDefault(mentionProps)
          ),
      }),
    ],
    [renderBlock],
  )

  useClickOutsideEvent(mentionsMenuOpen && closeMentions, () => [popoverRef.current])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Enter':
          // Shift enter is used to insert a new line,
          // keep the default behavior
          if (event.shiftKey) {
            break
          }

          // If the mention menu is open close it, but don't submit.
          if (mentionsMenuOpen) {
            // Enter is being used both to select something from the mentionsMenu, prevent the default behavior.
            event.preventDefault()
            event.stopPropagation()
            closeMentions()
            break
          }

          // Submit the comment if eligible for submission
          if (onSubmit && canSubmit) {
            // Enter is being used to submit the comment, prevent the default behavior.
            event.preventDefault()
            event.stopPropagation()
            onSubmit()
          }
          break

        case 'Escape':
        case 'ArrowLeft':
        case 'ArrowRight':
          if (mentionsMenuOpen) {
            // stop these events if the menu is open
            event.preventDefault()
            event.stopPropagation()
            closeMentions()
          }
          break
        default:
      }
      // Call parent key handler
      if (onKeyDown) onKeyDown(event)
    },
    [canSubmit, closeMentions, mentionsMenuOpen, onKeyDown, onSubmit],
  )

  const initialSelectionAtEndOfContent: EditorSelection | undefined = useMemo(() => {
    if (selection) {
      return undefined
    }
    const lastBlock = (value || EMPTY_ARRAY).slice(-1)[0]
    const lastChild = isPortableTextTextBlock(lastBlock)
      ? lastBlock.children.slice(-1)[0]
      : undefined
    if (!lastChild) {
      return undefined
    }
    const point = {
      path: [{_key: lastBlock._key}, 'children', {_key: lastChild._key}],
      offset: isPortableTextSpan(lastChild) ? lastChild.text.length : 0,
    }
    return {
      focus: point,
      anchor: point,
    }
  }, [value, selection])

  // Update the mentions search term in the mentions menu
  useEffect(() => {
    mentionsMenuRef.current?.setSearchTerm(mentionsSearchTerm)
  }, [mentionsSearchTerm])

  // Close mentions if the user selects text
  useEffect(() => {
    if (mentionsMenuOpen && selection && !isEqual(selection.anchor, selection.focus)) {
      closeMentions()
    }
  }, [mentionsMenuOpen, closeMentions, selection])

  const popoverContent = (
    <MentionsMenu
      inputElement={inputElement}
      loading={mentionOptions.loading}
      onSelect={insertMention}
      options={mentionOptions.data || EMPTY_ARRAY}
      ref={mentionsMenuRef}
    />
  )

  return (
    <div ref={setRootElement}>
      <Popover
        arrow={false}
        className={styledPopover}
        constrainSize
        content={popoverContent}
        disabled={!mentionsMenuOpen}
        fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
        open={mentionsMenuOpen}
        placement="bottom"
        ref={popoverRef}
        referenceElement={cursorElement}
        style={assignInlineVars({
          [space1Var]: `${space[1]}px`,
          [radius3Var]: `${radius[3]}px`,
        })}
      />
      <NodePlugin nodes={nodes} />
      <PortableTextEditable
        data-testid="comment-input-editable"
        data-ui="EditableElement"
        onBeforeInput={onBeforeInput}
        onBlur={onBlur}
        onFocus={onFocus}
        onKeyDown={handleKeyDown}
        ref={setInputElement}
        renderPlaceholder={renderPlaceholder}
        selection={initialSelectionAtEndOfContent}
        style={INLINE_STYLE}
        tabIndex={focusLock ? 0 : undefined}
      />
    </div>
  )
}
