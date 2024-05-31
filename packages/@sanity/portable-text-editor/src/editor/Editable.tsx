import {type PortableTextBlock} from '@sanity/types'
import {isEqual, noop} from 'lodash'
import {
  type ClipboardEvent,
  type CSSProperties,
  type FocusEventHandler,
  type ForwardedRef,
  forwardRef,
  type HTMLProps,
  type KeyboardEvent,
  type MutableRefObject,
  type ReactNode,
  type TextareaHTMLAttributes,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  type BaseRange,
  Editor,
  Node,
  type NodeEntry,
  type Operation,
  Path,
  Range as SlateRange,
  type Text,
  Transforms,
} from 'slate'
import {
  Editable as SlateEditable,
  ReactEditor,
  type RenderElementProps,
  type RenderLeafProps,
  useSlate,
} from 'slate-react'

import {
  type EditorChange,
  type EditorSelection,
  type OnCopyFn,
  type OnPasteFn,
  type OnPasteResult,
  type RangeDecoration,
  type RenderAnnotationFunction,
  type RenderBlockFunction,
  type RenderChildFunction,
  type RenderDecoratorFunction,
  type RenderListItemFunction,
  type RenderStyleFunction,
  type ScrollSelectionIntoViewFunction,
} from '../types/editor'
import {type HotkeyOptions} from '../types/options'
import {type SlateTextBlock, type VoidElement} from '../types/slate'
import {debugWithName} from '../utils/debug'
import {moveRangeByOperation, toPortableTextRange, toSlateRange} from '../utils/ranges'
import {normalizeSelection} from '../utils/selection'
import {fromSlateValue, isEqualToEmptyEditor, toSlateValue} from '../utils/values'
import {Element} from './components/Element'
import {Leaf} from './components/Leaf'
import {usePortableTextEditor} from './hooks/usePortableTextEditor'
import {usePortableTextEditorKeyGenerator} from './hooks/usePortableTextEditorKeyGenerator'
import {usePortableTextEditorReadOnlyStatus} from './hooks/usePortableTextReadOnly'
import {createWithHotkeys, createWithInsertData} from './plugins'
import {PortableTextEditor} from './PortableTextEditor'

const debug = debugWithName('component:Editable')

const PLACEHOLDER_STYLE: CSSProperties = {
  position: 'absolute',
  userSelect: 'none',
  pointerEvents: 'none',
  left: 0,
  right: 0,
}

interface BaseRangeWithDecoration extends BaseRange {
  rangeDecoration: RangeDecoration
}

const EMPTY_DECORATIONS_STATE: BaseRangeWithDecoration[] = []

/**
 * @public
 */
export type PortableTextEditableProps = Omit<
  TextareaHTMLAttributes<HTMLDivElement>,
  'onPaste' | 'onCopy' | 'onBeforeInput'
> & {
  hotkeys?: HotkeyOptions
  onBeforeInput?: (event: InputEvent) => void
  onPaste?: OnPasteFn
  onCopy?: OnCopyFn
  ref: MutableRefObject<HTMLDivElement | null>
  rangeDecorations?: RangeDecoration[]
  renderAnnotation?: RenderAnnotationFunction
  renderBlock?: RenderBlockFunction
  renderChild?: RenderChildFunction
  renderDecorator?: RenderDecoratorFunction
  renderListItem?: RenderListItemFunction
  renderPlaceholder?: () => ReactNode
  renderStyle?: RenderStyleFunction
  scrollSelectionIntoView?: ScrollSelectionIntoViewFunction
  selection?: EditorSelection
  spellCheck?: boolean
}

/**
 * @public
 */
export const PortableTextEditable = forwardRef(function PortableTextEditable(
  props: PortableTextEditableProps &
    Omit<HTMLProps<HTMLDivElement>, 'as' | 'onPaste' | 'onBeforeInput'>,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const {
    hotkeys,
    onBlur,
    onFocus,
    onBeforeInput,
    onPaste,
    onCopy,
    onClick,
    rangeDecorations,
    renderAnnotation,
    renderBlock,
    renderChild,
    renderDecorator,
    renderListItem,
    renderPlaceholder,
    renderStyle,
    selection: propsSelection,
    scrollSelectionIntoView,
    spellCheck,
    ...restProps
  } = props

  const portableTextEditor = usePortableTextEditor()
  const readOnly = usePortableTextEditorReadOnlyStatus()
  const keyGenerator = usePortableTextEditorKeyGenerator()
  const ref = useRef<HTMLDivElement | null>(null)
  const [editableElement, setEditableElement] = useState<HTMLDivElement | null>(null)
  const [hasInvalidValue, setHasInvalidValue] = useState(false)
  const [rangeDecorationState, setRangeDecorationsState] =
    useState<BaseRangeWithDecoration[]>(EMPTY_DECORATIONS_STATE)

  // Forward ref to parent component
  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(forwardedRef, () => ref.current)

  const rangeDecorationsRef = useRef(rangeDecorations)

  const {change$, schemaTypes} = portableTextEditor
  const slateEditor = useSlate()

  const blockTypeName = schemaTypes.block.name

  // React/UI-specific plugins
  const withInsertData = useMemo(
    () => createWithInsertData(change$, schemaTypes, keyGenerator),
    [change$, keyGenerator, schemaTypes],
  )
  const withHotKeys = useMemo(
    () => createWithHotkeys(schemaTypes, portableTextEditor, hotkeys),
    [hotkeys, portableTextEditor, schemaTypes],
  )

  // Output a minimal React editor inside Editable when in readOnly mode.
  // NOTE: make sure all the plugins used here can be safely run over again at any point.
  // There will be a problem if they redefine editor methods and then calling the original method within themselves.
  useMemo(() => {
    if (readOnly) {
      debug('Editable is in read only mode')
      return withInsertData(slateEditor)
    }
    debug('Editable is in edit mode')
    return withInsertData(withHotKeys(slateEditor))
  }, [readOnly, slateEditor, withHotKeys, withInsertData])

  const renderElement = useCallback(
    (eProps: RenderElementProps) => (
      <Element
        {...eProps}
        readOnly={readOnly}
        renderBlock={renderBlock}
        renderChild={renderChild}
        renderListItem={renderListItem}
        renderStyle={renderStyle}
        schemaTypes={schemaTypes}
        spellCheck={spellCheck}
      />
    ),
    [schemaTypes, spellCheck, readOnly, renderBlock, renderChild, renderListItem, renderStyle],
  )

  const renderLeaf = useCallback(
    (
      lProps: RenderLeafProps & {
        leaf: Text & {placeholder?: boolean; rangeDecoration?: RangeDecoration}
      },
    ) => {
      if (lProps.leaf._type === 'span') {
        let rendered = (
          <Leaf
            {...lProps}
            schemaTypes={schemaTypes}
            renderAnnotation={renderAnnotation}
            renderChild={renderChild}
            renderDecorator={renderDecorator}
            readOnly={readOnly}
          />
        )
        if (renderPlaceholder && lProps.leaf.placeholder && lProps.text.text === '') {
          return (
            <>
              <span style={PLACEHOLDER_STYLE} contentEditable={false}>
                {renderPlaceholder()}
              </span>
              {rendered}
            </>
          )
        }
        const decoration = lProps.leaf.rangeDecoration
        if (decoration) {
          rendered = decoration.component({children: rendered})
        }
        return rendered
      }
      return lProps.children
    },
    [readOnly, renderAnnotation, renderChild, renderDecorator, renderPlaceholder, schemaTypes],
  )

  const restoreSelectionFromProps = useCallback(() => {
    if (propsSelection) {
      debug(`Selection from props ${JSON.stringify(propsSelection)}`)
      const normalizedSelection = normalizeSelection(
        propsSelection,
        fromSlateValue(slateEditor.children, blockTypeName),
      )
      if (normalizedSelection !== null) {
        debug(`Normalized selection from props ${JSON.stringify(normalizedSelection)}`)
        const slateRange = toSlateRange(normalizedSelection, slateEditor)
        if (slateRange) {
          Transforms.select(slateEditor, slateRange)
          // Output selection here in those cases where the editor selection was the same, and there are no set_selection operations made.
          // The selection is usually automatically emitted to change$ by the withPortableTextSelections plugin whenever there is a set_selection operation applied.
          if (!slateEditor.operations.some((o) => o.type === 'set_selection')) {
            change$.next({type: 'selection', selection: normalizedSelection})
          }
          slateEditor.onChange()
        }
      }
    }
  }, [propsSelection, slateEditor, blockTypeName, change$])

  const syncRangeDecorations = useCallback(
    (operation?: Operation) => {
      if (rangeDecorations && rangeDecorations.length > 0) {
        const newSlateRanges: BaseRangeWithDecoration[] = []
        rangeDecorations.forEach((rangeDecorationItem) => {
          const slateRange = toSlateRange(rangeDecorationItem.selection, slateEditor)
          if (!SlateRange.isRange(slateRange)) {
            if (rangeDecorationItem.onMoved) {
              rangeDecorationItem.onMoved({
                newSelection: null,
                rangeDecoration: rangeDecorationItem,
                origin: 'local',
              })
            }
            return
          }
          let newRange: BaseRange | null | undefined
          if (operation) {
            newRange = moveRangeByOperation(slateRange, operation)
            if ((newRange && newRange !== slateRange) || (newRange === null && slateRange)) {
              const value = PortableTextEditor.getValue(portableTextEditor)
              const newRangeSelection = toPortableTextRange(value, newRange, schemaTypes)
              if (rangeDecorationItem.onMoved) {
                rangeDecorationItem.onMoved({
                  newSelection: newRangeSelection,
                  rangeDecoration: rangeDecorationItem,
                  origin: 'local',
                })
              }
            }
          }
          // If the newRange is null, it means that the range is not valid anymore and should be removed
          // If it's undefined, it means that the slateRange is still valid and should be kept
          if (newRange !== null) {
            newSlateRanges.push({...(newRange || slateRange), rangeDecoration: rangeDecorationItem})
          }
        })
        if (newSlateRanges.length > 0) {
          setRangeDecorationsState(newSlateRanges)
          return
        }
      }
      setRangeDecorationsState(EMPTY_DECORATIONS_STATE)
    },
    [portableTextEditor, rangeDecorations, schemaTypes, slateEditor],
  )

  // Subscribe to change$ and restore selection from props when the editor has been initialized properly with it's value
  useEffect(() => {
    // debug('Subscribing to editor changes$')
    const sub = change$.subscribe((next: EditorChange): void => {
      switch (next.type) {
        case 'ready':
          restoreSelectionFromProps()
          break
        case 'invalidValue':
          setHasInvalidValue(true)
          break
        case 'value':
          setHasInvalidValue(false)
          break
        default:
      }
    })
    return () => {
      // debug('Unsubscribing to changes$')
      sub.unsubscribe()
    }
  }, [change$, restoreSelectionFromProps])

  // Restore selection from props when it changes
  useEffect(() => {
    if (propsSelection && !hasInvalidValue) {
      restoreSelectionFromProps()
    }
  }, [hasInvalidValue, propsSelection, restoreSelectionFromProps])

  // Store reference to original apply function (see below for usage in useEffect)
  const originalApply = useMemo(() => slateEditor.apply, [slateEditor])

  const [syncedRangeDecorations, setSyncedRangeDecorations] = useState(false)
  useEffect(() => {
    if (!syncedRangeDecorations) {
      // We only want this to run once, on mount
      setSyncedRangeDecorations(true)
      syncRangeDecorations()
    }
  }, [syncRangeDecorations, syncedRangeDecorations])

  useEffect(() => {
    if (!isEqual(rangeDecorations, rangeDecorationsRef.current)) {
      syncRangeDecorations()
    }
    rangeDecorationsRef.current = rangeDecorations
  }, [rangeDecorations, syncRangeDecorations])

  // Sync range decorations after an operation is applied
  useEffect(() => {
    slateEditor.apply = (op: Operation) => {
      originalApply(op)
      if (op.type !== 'set_selection') {
        syncRangeDecorations(op)
      }
    }
    return () => {
      slateEditor.apply = originalApply
    }
  }, [originalApply, slateEditor, syncRangeDecorations])

  // Handle from props onCopy function
  const handleCopy = useCallback(
    (event: ClipboardEvent<HTMLDivElement>): void | ReactEditor => {
      if (onCopy) {
        const result = onCopy(event)
        // CopyFn may return something to avoid doing default stuff
        if (result !== undefined) {
          event.preventDefault()
        }
      }
    },
    [onCopy],
  )

  // Handle incoming pasting events in the editor
  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLDivElement>): Promise<void> | void => {
      event.preventDefault()
      if (!slateEditor.selection) {
        return
      }
      if (!onPaste) {
        debug('Pasting normally')
        slateEditor.insertData(event.clipboardData)
        return
      }
      // Resolve it as promise (can be either async promise or sync return value)
      new Promise<OnPasteResult>((resolve) => {
        const value = PortableTextEditor.getValue(portableTextEditor)
        const ptRange = toPortableTextRange(value, slateEditor.selection, schemaTypes)
        const path = ptRange?.focus.path || []
        resolve(
          onPaste({
            event,
            value,
            path,
            schemaTypes,
          }),
        )
      })
        .then((result) => {
          debug('Custom paste function from client resolved', result)
          change$.next({type: 'loading', isLoading: true})
          if (!result || !result.insert) {
            debug('No result from custom paste handler, pasting normally')
            slateEditor.insertData(event.clipboardData)
            return
          }
          if (result && result.insert) {
            slateEditor.insertFragment(
              toSlateValue(result.insert as PortableTextBlock[], {schemaTypes}),
            )
            change$.next({type: 'loading', isLoading: false})
            return
          }
          console.warn('Your onPaste function returned something unexpected:', result)
        })
        .catch((error) => {
          change$.next({type: 'loading', isLoading: false})
          console.error(error) // eslint-disable-line no-console
          return error
        })
    },
    [change$, onPaste, portableTextEditor, schemaTypes, slateEditor],
  )

  const handleOnFocus: FocusEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      if (onFocus) {
        onFocus(event)
      }
      if (!event.isDefaultPrevented()) {
        const selection = PortableTextEditor.getSelection(portableTextEditor)
        // Create an editor selection if it does'nt exist
        if (selection === null) {
          Transforms.select(slateEditor, Editor.start(slateEditor, []))
          slateEditor.onChange()
        }
        change$.next({type: 'focus', event})
        const newSelection = PortableTextEditor.getSelection(portableTextEditor)
        // If the selection is the same, emit it explicitly here as there is no actual onChange event triggered.
        if (selection === newSelection) {
          change$.next({
            type: 'selection',
            selection,
          })
        }
      }
    },
    [onFocus, portableTextEditor, change$, slateEditor],
  )

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (onClick) {
        onClick(event)
      }
      // Inserts a new block if it's clicking on the editor, focused on the last block and it's a void element
      if (slateEditor.selection && event.target === event.currentTarget) {
        const [lastBlock, path] = Node.last(slateEditor, [])
        const focusPath = slateEditor.selection.focus.path.slice(0, 1)
        const lastPath = path.slice(0, 1)
        if (Path.equals(focusPath, lastPath)) {
          const node = Node.descendant(slateEditor, path.slice(0, 1)) as
            | SlateTextBlock
            | VoidElement
          if (lastBlock && Editor.isVoid(slateEditor, node)) {
            Transforms.insertNodes(slateEditor, slateEditor.pteCreateEmptyBlock())
            slateEditor.onChange()
          }
        }
      }
    },
    [onClick, slateEditor],
  )

  const handleOnBlur: FocusEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      if (onBlur) {
        onBlur(event)
      }
      if (!event.isPropagationStopped()) {
        change$.next({type: 'blur', event})
      }
    },
    [change$, onBlur],
  )

  const handleOnBeforeInput = useCallback(
    (event: InputEvent) => {
      if (onBeforeInput) {
        onBeforeInput(event)
      }
    },
    [onBeforeInput],
  )

  // This function will handle unexpected DOM changes inside the Editable rendering,
  // and make sure that we can maintain a stable slateEditor.selection when that happens.
  //
  // For example, if this Editable is rendered inside something that might re-render
  // this component (hidden contexts) while the user is still actively changing the
  // contentEditable, this could interfere with the intermediate DOM selection,
  // which again could be picked up by ReactEditor's event listeners.
  // If that range is invalid at that point, the slate.editorSelection could be
  // set either wrong, or invalid, to which slateEditor will throw exceptions
  // that are impossible to recover properly from or result in a wrong selection.
  //
  // Also the other way around, when the ReactEditor will try to create a DOM Range
  // from the current slateEditor.selection, it may throw unrecoverable errors
  // if the current editor.selection is invalid according to the DOM.
  // If this is the case, default to selecting the top of the document, if the
  // user already had a selection.
  const validateSelection = useCallback(() => {
    if (!slateEditor.selection) {
      return
    }
    const root = ReactEditor.findDocumentOrShadowRoot(slateEditor)
    const {activeElement} = root
    // Return if the editor isn't the active element
    if (ref.current !== activeElement) {
      return
    }
    const window = ReactEditor.getWindow(slateEditor)
    const domSelection = window.getSelection()
    if (!domSelection || domSelection.rangeCount === 0) {
      return
    }
    const existingDOMRange = domSelection.getRangeAt(0)
    try {
      const newDOMRange = ReactEditor.toDOMRange(slateEditor, slateEditor.selection)
      if (
        newDOMRange.startOffset !== existingDOMRange.startOffset ||
        newDOMRange.endOffset !== existingDOMRange.endOffset
      ) {
        debug('DOM range out of sync, validating selection')
        // Remove all ranges temporary
        domSelection?.removeAllRanges()
        // Set the correct range
        domSelection.addRange(newDOMRange)
      }
    } catch (error) {
      debug(`Could not resolve selection, selecting top document`)
      // Deselect the editor
      Transforms.deselect(slateEditor)
      // Select top document if there is a top block to select
      if (slateEditor.children.length > 0) {
        Transforms.select(slateEditor, [0, 0])
      }
      slateEditor.onChange()
    }
  }, [ref, slateEditor])

  // Observe mutations (child list and subtree) to this component's DOM,
  // and make sure the editor selection is valid when that happens.
  useEffect(() => {
    if (editableElement) {
      const mutationObserver = new MutationObserver(validateSelection)
      mutationObserver.observe(editableElement, {
        attributeOldValue: false,
        attributes: false,
        characterData: false,
        childList: true,
        subtree: true,
      })
      return () => {
        mutationObserver.disconnect()
      }
    }
    return undefined
  }, [validateSelection, editableElement])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (props.onKeyDown) {
        props.onKeyDown(event)
      }
      if (!event.isDefaultPrevented()) {
        slateEditor.pteWithHotKeys(event)
      }
    },
    [props, slateEditor],
  )

  const scrollSelectionIntoViewToSlate = useMemo(() => {
    // Use slate-react default scroll into view
    if (scrollSelectionIntoView === undefined) {
      return undefined
    }
    // Disable scroll into view totally
    if (scrollSelectionIntoView === null) {
      return noop
    }
    // Translate PortableTextEditor prop fn to Slate plugin fn
    return (editor: ReactEditor, domRange: Range) => {
      scrollSelectionIntoView(portableTextEditor, domRange)
    }
  }, [portableTextEditor, scrollSelectionIntoView])

  const decorate: (entry: NodeEntry) => BaseRange[] = useCallback(
    ([, path]) => {
      if (isEqualToEmptyEditor(slateEditor.children, schemaTypes)) {
        return [
          {
            anchor: {
              path: [0, 0],
              offset: 0,
            },
            focus: {
              path: [0, 0],
              offset: 0,
            },
            placeholder: true,
          },
        ]
      }
      // Editor node has a path length of 0 (should never be decorated)
      if (path.length === 0) {
        return EMPTY_DECORATIONS_STATE
      }
      const result = rangeDecorationState.filter((item) => {
        // Special case in order to only return one decoration for collapsed ranges
        if (SlateRange.isCollapsed(item)) {
          // Collapsed ranges should only be decorated if they are on a block child level (length 2)
          if (path.length !== 2) {
            return false
          }
          return Path.equals(item.focus.path, path) && Path.equals(item.anchor.path, path)
        }
        // Include decorations that either include or intersects with this path
        return (
          SlateRange.intersection(item, {anchor: {path, offset: 0}, focus: {path, offset: 0}}) ||
          SlateRange.includes(item, path)
        )
      })
      if (result.length > 0) {
        return result
      }
      return EMPTY_DECORATIONS_STATE
    },
    [slateEditor, schemaTypes, rangeDecorationState],
  )

  // Set the forwarded ref to be the Slate editable DOM element
  // Also set the editable element in a state so that the MutationObserver
  // is setup when this element is ready.
  useEffect(() => {
    ref.current = ReactEditor.toDOMNode(slateEditor, slateEditor) as HTMLDivElement | null
    setEditableElement(ref.current)
  }, [slateEditor, ref])

  if (!portableTextEditor) {
    return null
  }
  return hasInvalidValue ? null : (
    <SlateEditable
      {...restProps}
      autoFocus={false}
      className={restProps.className || 'pt-editable'}
      decorate={decorate}
      onBlur={handleOnBlur}
      onCopy={handleCopy}
      onClick={handleClick}
      onDOMBeforeInput={handleOnBeforeInput}
      onFocus={handleOnFocus}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      readOnly={readOnly}
      // We have implemented our own placeholder logic with decorations.
      // This 'renderPlaceholder' should not be used.
      renderPlaceholder={undefined}
      renderElement={renderElement}
      renderLeaf={renderLeaf}
      scrollSelectionIntoView={scrollSelectionIntoViewToSlate}
    />
  )
})
