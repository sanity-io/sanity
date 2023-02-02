import {BaseRange, Transforms, Text} from 'slate'
import React, {useCallback, useMemo, useEffect, forwardRef} from 'react'
import {
  Editable as SlateEditable,
  ReactEditor,
  RenderElementProps,
  RenderLeafProps,
  useSlate,
} from '@sanity/slate-react'
import {noop} from 'lodash'
import {
  EditorSelection,
  OnBeforeInputFn,
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
import {toSlateRange} from '../utils/ranges'
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
}

const EMPTY_DECORATORS: BaseRange[] = []

/**
 * @public
 */
export type PortableTextEditableProps = {
  hotkeys?: HotkeyOptions
  onBeforeInput?: OnBeforeInputFn
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
  props: PortableTextEditableProps & Omit<React.HTMLProps<HTMLDivElement>, 'as' | 'onPaste'>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>
) {
  const {
    hotkeys,
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

  const {change$, schemaTypes} = portableTextEditor
  const slateEditor = useSlate()

  const blockTypeName = schemaTypes.block.name

  // React/UI-specific plugins
  const withInsertData = useMemo(
    () => createWithInsertData(change$, schemaTypes, keyGenerator),
    [change$, keyGenerator, schemaTypes]
  )
  const withHotKeys = useMemo(
    () => createWithHotkeys(schemaTypes, keyGenerator, portableTextEditor, hotkeys),
    [hotkeys, keyGenerator, portableTextEditor, schemaTypes]
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
    [schemaTypes, spellCheck, readOnly, renderBlock, renderChild, renderListItem, renderStyle]
  )

  const renderLeaf = useCallback(
    (lProps: RenderLeafProps & {leaf: Text & {placeholder?: boolean}}) => {
      const rendered = (
        <Leaf
          {...lProps}
          keyGenerator={keyGenerator}
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
            <div style={PLACEHOLDER_STYLE} contentEditable={false}>
              {renderPlaceholder()}
            </div>
            {rendered}
          </>
        )
      }
      return rendered
    },
    [
      keyGenerator,
      readOnly,
      renderAnnotation,
      renderChild,
      renderDecorator,
      renderPlaceholder,
      schemaTypes,
    ]
  )

  // Restore selection from props
  useEffect(() => {
    if (propsSelection) {
      debug(`Selection from props ${JSON.stringify(propsSelection)}`)
      const normalizedSelection = normalizeSelection(
        propsSelection,
        fromSlateValue(slateEditor.children, blockTypeName)
      )
      if (normalizedSelection !== null) {
        debug(`Normalized selection from props ${JSON.stringify(normalizedSelection)}`)
        const slateRange = toSlateRange(normalizedSelection, slateEditor)
        if (slateRange) {
          Transforms.select(slateEditor, slateRange)
          // Output selection here in those cases where the editor selection was the same, and there are no set selection operations in the
          // editor (this is usually automatically outputted by the withPortableTextSelections plugin)
          if (!slateEditor.operations.some((o) => o.type === 'set_selection')) {
            change$.next({type: 'selection', selection: normalizedSelection})
          }
          slateEditor.onChange()
        }
      }
    }
  }, [slateEditor, propsSelection, blockTypeName, change$])

  // Set initial selection from props
  useEffect(() => {
    if (propsSelection) {
      PortableTextEditor.select(portableTextEditor, propsSelection)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only initial

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
    [onCopy]
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
        resolve(
          onPaste({
            event,
            value: PortableTextEditor.getValue(portableTextEditor),
            path: slateEditor.selection?.focus.path || [],
            schemaTypes,
          })
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
            slateEditor.insertFragment(toSlateValue(result.insert, {schemaTypes}))
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
    [change$, onPaste, portableTextEditor, schemaTypes, slateEditor]
  )

  const handleOnFocus = useCallback(() => {
    change$.next({type: 'focus'})
  }, [change$])

  const handleOnBlur = useCallback(() => {
    change$.next({type: 'blur'})
  }, [change$])

  const handleOnBeforeInput = useCallback(
    (event: Event) => {
      if (onBeforeInput) {
        onBeforeInput(event)
      }
    },
    [onBeforeInput]
  )

  const handleKeyDown = slateEditor.pteWithHotKeys

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

  // The editor
  const slateEditable = useMemo(
    () => (
      <SlateEditable
        autoFocus={false}
        className="pt-editable"
        decorate={decorate}
        onBlur={handleOnBlur}
        onCopy={handleCopy}
        onDOMBeforeInput={handleOnBeforeInput}
        onFocus={handleOnFocus}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        readOnly={readOnly}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        scrollSelectionIntoView={scrollSelectionIntoViewToSlate}
      />
    ),
    [
      decorate,
      handleCopy,
      handleKeyDown,
      handleOnBeforeInput,
      handleOnBlur,
      handleOnFocus,
      handlePaste,
      readOnly,
      renderElement,
      renderLeaf,
      scrollSelectionIntoViewToSlate,
    ]
  )

  if (!portableTextEditor) {
    return null
  }
  return (
    <div ref={ref} {...restProps}>
      {slateEditable}
    </div>
  )
})
