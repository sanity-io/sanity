import {BaseRange, Transforms, Text, select, Editor} from 'slate'
import React, {useCallback, useMemo, useEffect, forwardRef, useState, KeyboardEvent} from 'react'
import {
  Editable as SlateEditable,
  ReactEditor,
  RenderElementProps,
  RenderLeafProps,
  useSlate,
} from 'slate-react'
import {noop} from 'lodash'
import {PortableTextBlock} from '@sanity/types'
import {
  EditorChange,
  EditorSelection,
  OnCopyFn,
  OnPasteFn,
  OnPasteResult,
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
import {removeAllDocumentSelectionRanges, toPortableTextRange, toSlateRange} from '../utils/ranges'
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
    (lProps: RenderLeafProps & {leaf: Text & {placeholder?: boolean}}) => {
      const rendered = (
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
      return rendered
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

  const handleDOMChange = useCallback(() => {
    let newDomRange: any = null
    const currentSelection = slateEditor.selection
    try {
      newDomRange =
        slateEditor.selection && ReactEditor.toDOMRange(slateEditor, slateEditor.selection)
    } catch (error) {
      removeAllDocumentSelectionRanges(true)
      Transforms.deselect(slateEditor)
      Transforms.select(slateEditor, [0, 0])
      slateEditor.onChange()
      debug(`Could not resolve selection (${JSON.stringify(currentSelection)}), unselecting`)
    }
  }, [slateEditor])

  useEffect(() => {
    const mutationObserver = new MutationObserver(handleDOMChange)

    if (ref.current) {
      mutationObserver.observe(ref.current, {
        childList: true,
        subtree: true,
      })
    }

    return () => {
      mutationObserver.disconnect()
    }
  }, [handleDOMChange, ref])

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

  const decorate = useCallback(() => {
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
    return EMPTY_DECORATORS
  }, [schemaTypes, slateEditor])

  // Set the forwarded ref to be the Slate editable DOM element
  useEffect(() => {
    ref.current = ReactEditor.toDOMNode(slateEditor, slateEditor) as HTMLDivElement | null
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
