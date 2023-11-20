import {BaseRange, Transforms, Text, Range as SlateRange, Editor, NodeEntry} from 'slate'
import React, {useCallback, useMemo, useEffect, forwardRef, useState, KeyboardEvent} from 'react'
import {
  Editable as SlateEditable,
  ReactEditor,
  RenderElementProps,
  RenderLeafProps,
  useSlate,
} from 'slate-react'
import {flatten, noop} from 'lodash'
import {PortableTextBlock} from '@sanity/types'
import {
  EditorChange,
  EditorSelection,
  OnCopyFn,
  OnPasteFn,
  OnPasteResult,
  PortableTextSlateEditor,
  RangeDecoration,
  RenderAnnotationFunction,
  RenderBlockFunction,
  RenderChildFunction,
  RenderDecoratorFunction,
  RenderListItemFunction,
  RenderStyleFunction,
  ScrollSelectionIntoViewFunction,
} from '../types/editor'
import {HotkeyOptions} from '../types/options'
import {fromSlateValue, isEqualToEmptyEditor, toSlateValue} from '../utils/values'
import {normalizeSelection} from '../utils/selection'
import {toPortableTextRange, toSlateRange} from '../utils/ranges'
import {debugWithName} from '../utils/debug'
import {usePortableTextEditorReadOnlyStatus} from './hooks/usePortableTextReadOnly'
import {usePortableTextEditorKeyGenerator} from './hooks/usePortableTextEditorKeyGenerator'
import {Leaf} from './components/Leaf'
import {Element} from './components/Element'
import {usePortableTextEditor} from './hooks/usePortableTextEditor'
import {PortableTextEditor} from './PortableTextEditor'
import {createWithInsertData, createWithHotkeys} from './plugins'
import {useForwardedRef} from './hooks/useForwardedRef'

const debug = debugWithName('component:Editable')

const PLACEHOLDER_STYLE: React.CSSProperties = {
  opacity: 0.5,
  position: 'absolute',
  userSelect: 'none',
  pointerEvents: 'none',
  left: 0,
  right: 0,
}

const EMPTY_DECORATORS: BaseRange[] = []

/**
 * @public
 */
export type PortableTextEditableProps = Omit<
  React.TextareaHTMLAttributes<HTMLDivElement>,
  'onPaste' | 'onCopy' | 'onBeforeInput'
> & {
  hotkeys?: HotkeyOptions
  onBeforeInput?: (event: InputEvent) => void
  onPaste?: OnPasteFn
  onCopy?: OnCopyFn
  ref: React.MutableRefObject<HTMLDivElement | null>
  rangeDecorations?: RangeDecoration[]
  renderAnnotation?: RenderAnnotationFunction
  renderBlock?: RenderBlockFunction
  renderChild?: RenderChildFunction
  renderDecorator?: RenderDecoratorFunction
  renderListItem?: RenderListItemFunction
  renderPlaceholder?: () => React.ReactNode
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
    Omit<React.HTMLProps<HTMLDivElement>, 'as' | 'onPaste' | 'onBeforeInput'>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    hotkeys,
    onBlur,
    onFocus,
    onBeforeInput,
    onPaste,
    onCopy,
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
  const ref = useForwardedRef(forwardedRef)
  const [editableElement, setEditableElement] = useState<HTMLDivElement | null>(null)
  const [hasInvalidValue, setHasInvalidValue] = useState(false)

  const {change$, schemaTypes} = portableTextEditor
  const slateEditor = useSlate()

  const blockTypeName = schemaTypes.block.name

  // React/UI-specific plugins
  const withInsertData = useMemo(
    () => createWithInsertData(change$, schemaTypes, keyGenerator),
    [change$, keyGenerator, schemaTypes],
  )
  const withHotKeys = useMemo(
    () => createWithHotkeys(schemaTypes, keyGenerator, portableTextEditor, hotkeys),
    [hotkeys, keyGenerator, portableTextEditor, schemaTypes],
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

  // Subscribe to change$ and restore selection from props when the editor has been initialized properly with it's value
  useEffect(() => {
    debug('Subscribing to editor changes$')
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
      debug('Unsubscribing to changes$')
      sub.unsubscribe()
    }
  }, [change$, restoreSelectionFromProps])

  // Restore selection from props when it changes
  useEffect(() => {
    if (propsSelection && !hasInvalidValue) {
      restoreSelectionFromProps()
    }
  }, [hasInvalidValue, propsSelection, restoreSelectionFromProps])

  // Handle from props onCopy function
  const handleCopy = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>): void | ReactEditor => {
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
    (event: React.ClipboardEvent<HTMLDivElement>): Promise<void> | void => {
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

  const handleOnFocus: React.FocusEventHandler<HTMLDivElement> = useCallback(
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

  const handleOnBlur: React.FocusEventHandler<HTMLDivElement> = useCallback(
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
    if (!domSelection) {
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
    ([node, path]) => {
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
      return rangeDecorations && rangeDecorations.length
        ? getChildNodeToRangeDecorations({
            slateEditor,
            portableTextEditor,
            rangeDecorations,
            nodeEntry: [node, path],
          })
        : EMPTY_DECORATORS
    },
    [slateEditor, schemaTypes, portableTextEditor, rangeDecorations],
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

const getChildNodeToRangeDecorations = ({
  rangeDecorations = [],
  nodeEntry,
  slateEditor,
  portableTextEditor,
}: {
  rangeDecorations: RangeDecoration[]
  nodeEntry: NodeEntry
  slateEditor: PortableTextSlateEditor
  portableTextEditor: PortableTextEditor
}): SlateRange[] => {
  if (rangeDecorations.length === 0) {
    return EMPTY_DECORATORS
  }
  const [, path] = nodeEntry
  return flatten(
    rangeDecorations.map((decoration) => {
      const slateRange = toSlateRange(decoration.selection, slateEditor)
      if (decoration.isRangeInvalid(portableTextEditor)) {
        return EMPTY_DECORATORS
      }
      if (slateRange && SlateRange.includes(slateRange, path) && path.length > 0) {
        return {...slateRange, rangeDecoration: decoration}
      }
      return EMPTY_DECORATORS
    }),
  )
}
