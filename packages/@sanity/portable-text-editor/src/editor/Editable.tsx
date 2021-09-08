import {Transforms, createEditor, Node} from 'slate'
import {isEqual} from 'lodash'
import isHotkey from 'is-hotkey'
import {normalizeBlock} from '@sanity/block-tools'
import React, {useCallback, useMemo, useState, useEffect} from 'react'
import {Editable as SlateEditable, Slate, withReact, ReactEditor} from '@sanity/slate-react'
import {
  EditorSelection,
  OnBeforeInputFn,
  OnCopyFn,
  OnPasteFn,
  OnPasteResult,
  OnPasteResultOrPromise,
  RenderAnnotationFunction,
  RenderBlockFunction,
  RenderChildFunction,
  RenderDecoratorFunction,
} from '../types/editor'
import {PortableTextBlock} from '../types/portableText'
import {HotkeyOptions} from '../types/options'
import {toSlateValue, isEqualToEmptyEditor} from '../utils/values'
import {hasEditableTarget, setFragmentData} from '../utils/copyPaste'
import {normalizeSelection} from '../utils/selection'
import {toPortableTextRange, toSlateRange} from '../utils/ranges'
import {debugWithName} from '../utils/debug'
import {KEY_TO_SLATE_ELEMENT, KEY_TO_VALUE_ELEMENT} from '../utils/weakMaps'
import {createWithEditableAPI} from './plugins/createWithEditableAPI'
import {createWithInsertData, createWithHotkeys} from './plugins'
import {Leaf} from './Leaf'
import {Element} from './Element'
import {withPortableText} from './withPortableText'
import {usePortableTextEditor} from './hooks/usePortableTextEditor'
import {usePortableTextEditorValue} from './hooks/usePortableTextEditorValue'
import {PortableTextEditor} from './PortableTextEditor'

const debug = debugWithName('component:Editable')

// Weakmap for testing if we need to update the state value from a new value coming in from props
const VALUE_TO_SLATE_VALUE: WeakMap<PortableTextBlock[], Node[]> = new WeakMap()

type Props = {
  hotkeys?: HotkeyOptions
  onBeforeInput?: OnBeforeInputFn
  onPaste?: OnPasteFn
  onCopy?: OnCopyFn
  placeholderText?: string
  renderAnnotation?: RenderAnnotationFunction
  renderBlock?: RenderBlockFunction
  renderChild?: RenderChildFunction
  renderDecorator?: RenderDecoratorFunction
  selection?: EditorSelection
  spellCheck?: boolean
}

const SELECT_TOP_DOCUMENT = {anchor: {path: [0, 0], offset: 0}, focus: {path: [0, 0], offset: 0}}

export const PortableTextEditable = (props: Props) => {
  const {
    hotkeys,
    placeholderText,
    renderAnnotation,
    renderBlock,
    renderChild,
    renderDecorator,
    spellCheck,
  } = props

  const portableTextEditor = usePortableTextEditor()
  const value = usePortableTextEditorValue()

  const {
    change$,
    isThrottling,
    incomingPatches$,
    keyGenerator,
    maxBlocks,
    portableTextFeatures,
    readOnly,
  } = portableTextEditor

  const placeHolderBlock = useMemo(
    () => ({
      _type: portableTextFeatures.types.block.name,
      _key: keyGenerator(),
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: keyGenerator(),
          text: '',
          marks: [],
        },
      ],
    }),
    [portableTextFeatures.types.block.name, keyGenerator]
  )

  // React/UI-spesific plugins
  const withInsertData = useMemo(
    () => createWithInsertData(change$, portableTextFeatures, keyGenerator),
    []
  )
  const withHotKeys = useMemo(
    () => createWithHotkeys(portableTextFeatures, keyGenerator, portableTextEditor, hotkeys),
    []
  )

  // Create the PortableTextEditor API
  const withEditableAPI = useMemo(
    () => createWithEditableAPI(portableTextEditor, portableTextFeatures, keyGenerator),
    []
  )

  // Init the Slate Editor
  const editor = useMemo(
    () =>
      withHotKeys(
        withInsertData(
          withEditableAPI(
            withReact(
              withPortableText(createEditor(), {
                portableTextFeatures: portableTextFeatures,
                keyGenerator,
                change$,
                maxBlocks,
                incomingPatches$,
                readOnly,
              })
            )
          )
        )
      ),
    []
  )

  // Track editor value
  const [stateValue, setStateValue] = useState(
    // Default value
    toSlateValue(
      getValueOrIntitialValue(value, [placeHolderBlock]),
      portableTextFeatures.types.block.name,
      KEY_TO_SLATE_ELEMENT.get(editor)
    )
  )

  // Track selection state
  const [selection, setSelection] = useState(editor.selection)
  const [isSelecting, setIsSelecting] = useState(false)

  const renderElement = useCallback(
    (eProps) => {
      if (isEqualToEmptyEditor(editor.children, portableTextFeatures)) {
        return <div {...eProps.attributes}>{eProps.children}</div>
      }
      return (
        <Element
          {...eProps}
          keyGenerator={keyGenerator}
          portableTextFeatures={portableTextFeatures}
          readOnly={readOnly}
          renderBlock={renderBlock}
          renderChild={renderChild}
        />
      )
    },
    [value, renderChild, renderBlock]
  )

  const renderLeaf = useCallback(
    (lProps) => {
      if (isEqualToEmptyEditor(editor.children, portableTextFeatures)) {
        return <span {...lProps.attributes}>{lProps.children}</span>
      }
      return (
        <Leaf
          {...lProps}
          keyGenerator={keyGenerator}
          portableTextFeatures={portableTextFeatures}
          renderAnnotation={renderAnnotation}
          renderChild={renderChild}
          renderDecorator={renderDecorator}
          readOnly={readOnly}
        />
      )
    },
    [value, renderChild, renderDecorator, renderAnnotation]
  )

  const handleChange = (val: any) => {
    if (val !== stateValue) {
      setStateValue(val)
    }
    if (editor.selection !== selection) {
      setSelection(editor.selection)
    }
  }

  // // Test Slate decorations. Highlight the word 'w00t'
  // // TODO: remove this and make something useful.
  // const woot = 'w00t'
  // const decorate = useCallback(
  //   ([node, path]) => {
  //     const ranges: Range[] = []

  //     if (woot && Text.isText(node)) {
  //       const {text} = node
  //       const parts = text.split(woot)
  //       let offset = 0

  //       parts.forEach((part, i) => {
  //         if (i !== 0) {
  //           ranges.push({
  //             anchor: {path, offset: offset - woot.length},
  //             focus: {path, offset},
  //             __highlight: true
  //           })
  //         }

  //         offset = offset + part.length + woot.length
  //       })
  //     }
  //     return ranges
  //   },
  //   [woot]
  // )

  const setValueFromProps = () => {
    const fromMap = VALUE_TO_SLATE_VALUE.get(value || [])
    if (fromMap === stateValue) {
      debug('Value in sync, not updating value from props')
    } else {
      debug('Setting value from props')
      const slateValueFromProps = toSlateValue(
        value,
        portableTextFeatures.types.block.name,
        KEY_TO_SLATE_ELEMENT.get(editor)
      )
      setStateValue(slateValueFromProps)
      VALUE_TO_SLATE_VALUE.set(value || [], slateValueFromProps)
      change$.next({type: 'value', value})
    }
  }

  useEffect(() => {
    KEY_TO_SLATE_ELEMENT.set(editor, {})
    KEY_TO_VALUE_ELEMENT.set(editor, {})
    return () => {
      KEY_TO_SLATE_ELEMENT.delete(editor)
      KEY_TO_VALUE_ELEMENT.delete(editor)
    }
  }, [editor])

  // Restore value from props
  useEffect(() => {
    if (isThrottling) {
      debug('Not setting value from props (throttling)')
      return
    }
    if (isSelecting) {
      debug('Not setting value from props (is selecting)')
      return
    }
    setValueFromProps()
  }, [value, isSelecting])

  // Restore selection from props
  useEffect(() => {
    const pSelection = props.selection
    if (pSelection && !isThrottling && !isEqual(pSelection, toPortableTextRange(editor))) {
      debug('Selection from props', pSelection)
      const normalizedSelection = normalizeSelection(pSelection, value)
      if (normalizedSelection !== null) {
        debug('Normalized selection from props', normalizedSelection)
        const slateRange = toSlateRange(normalizedSelection, editor)
        setSelection(slateRange)
      } else if (stateValue) {
        debug('Selecting top document')
        setSelection(SELECT_TOP_DOCUMENT)
      }
    }
  }, [props.selection])

  // Handle copy in the editor
  const handleCopy = (event: React.ClipboardEvent<HTMLDivElement>): void | ReactEditor => {
    const {onCopy} = props
    if (onCopy) {
      const result = onCopy(event)
      // CopyFn may return something to avoid doing default stuff
      if (result !== undefined) {
        event.preventDefault()
        return
      }
    }
    if (hasEditableTarget(editor, event.target)) {
      // Set Portable Text on the clipboard
      setFragmentData(event.clipboardData, editor, portableTextFeatures)
    }
  }

  // Handle pasting in the editor
  const handlePaste = (event: React.SyntheticEvent): Promise<any> | void => {
    event.persist() // Keep the event through the plugin chain after calling next()
    const {onPaste} = props
    const _selection = PortableTextEditor.getSelection(portableTextEditor)
    const type = portableTextFeatures.types.portableText
    if (!_selection) {
      return
    }
    if (onPaste) {
      const resolveOnPasteResultOrError = (): OnPasteResultOrPromise | Error => {
        try {
          return onPaste({event, value, path: _selection.focus.path, type})
        } catch (error) {
          return error as Error
        }
      }
      // Resolve it as promise (can be either async promise or sync return value)
      const resolved: OnPasteResultOrPromise | Error = Promise.resolve(
        resolveOnPasteResultOrError()
      )
      resolved
        .then((result: OnPasteResult) => {
          debug('Custom paste function from client resolved', result)
          change$.next({type: 'loading', isLoading: true})
          if (!result) {
            return
          }
          if (result instanceof Error) {
            throw result
          }
          if (result && result.insert) {
            event.preventDefault() // Stop the chain
            const allowedDecorators = portableTextFeatures.decorators.map((item) => item.value)
            const blocksToInsertNormalized = result.insert.map((block) =>
              normalizeBlock(block, {allowedDecorators})
            ) as PortableTextBlock[]
            const dataTransfer = new DataTransfer()
            const stringToEncode = JSON.stringify(
              toSlateValue(blocksToInsertNormalized, portableTextFeatures.types.block.name)
            )
            const encoded = window.btoa(encodeURIComponent(stringToEncode))
            dataTransfer.setData('application/x-slate-fragment', encoded)
            editor.insertData(dataTransfer)
            change$.next({type: 'loading', isLoading: false})
            editor.onChange()
            return
          }
          console.warn('Your onPaste function returned something unexpected:', result)
        })
        .catch((error) => {
          change$.next({type: 'loading', isLoading: false})
          console.error(error) // eslint-disable-line no-console
          return error
        })
    }
  }

  // There's a bug in Slate atm regarding void nodes not being deleted. Seems related
  // to 'hanging: true' and 'voids: false'. 2020/05/26
  const handleCut = (event: React.ClipboardEvent<HTMLDivElement>): void | ReactEditor => {
    event.preventDefault()
    event.stopPropagation()
    if (editor.selection) {
      ReactEditor.setFragmentData(editor, event.clipboardData)
      Transforms.delete(editor, {at: editor.selection, voids: false, hanging: true})
      Transforms.collapse(editor)
      editor.onChange()
    }
    return editor
  }

  // Set initial selection from props
  useEffect(() => {
    if (props.selection) {
      PortableTextEditor.select(portableTextEditor, props.selection)
    }
  }, [])

  // Emit selection after a selection is made
  const emitSelection = () => {
    try {
      const newSelection = toPortableTextRange(editor)
      // debug('Emitting new selection', JSON.stringify(newSelection))
      change$.next({type: 'selection', selection: newSelection})
    } catch (err) {
      change$.next({type: 'selection', selection: null})
    }
  }
  const handleSelect = () => {
    if (isThrottling) {
      return
    }
    emitSelection()
  }
  useEffect(() => {
    if (isThrottling) {
      return
    }
    emitSelection()
  }, [isThrottling])

  useEffect(() => {
    emitSelection()
  }, [selection])

  // Make sure that when the user is actively selecting something, we don't update the editor or selections will be broken
  let _isSelecting = false
  const onSelectStart = (event: any) => {
    if (ReactEditor.hasDOMNode(editor, event.target)) {
      debug('Start selecting')
      _isSelecting = true
      setTimeout(() => setIsSelecting(true))
    }
  }
  const onSelectEnd = () => {
    if (_isSelecting) {
      debug('Done selecting')
      setTimeout(() => setIsSelecting(false))
    }
  }
  const isSelectKeys = (event: KeyboardEvent) =>
    isHotkey('shift+down', event) ||
    isHotkey('shift+up', event) ||
    isHotkey('shift+left', event) ||
    isHotkey('shift+right', event) ||
    isHotkey('shift+end', event) ||
    isHotkey('shift+home', event) ||
    isHotkey('shift+pageDown', event) ||
    isHotkey('shift+pageUp', event)
  let isSelectingWithKeys = false
  const onSelectStartWithKeys = (event: KeyboardEvent) => {
    if (isSelectKeys(event)) {
      isSelectingWithKeys = true
      onSelectStart(event)
    }
  }
  const onSelectEndWithKeys = (event: KeyboardEvent) => {
    if (isSelectingWithKeys && event.key === 'Shift') {
      onSelectEnd()
      isSelectingWithKeys = false
    }
  }
  useEffect(() => {
    document.addEventListener('keydown', onSelectStartWithKeys, false)
    document.addEventListener('keyup', onSelectEndWithKeys, false)
    document.addEventListener('mousedown', onSelectStart, false)
    document.addEventListener('mouseup', onSelectEnd, false)
    document.addEventListener('dragend', onSelectEnd, false)
    return () => {
      document.removeEventListener('keydown', onSelectStartWithKeys, false)
      document.removeEventListener('keyup', onSelectEndWithKeys, false)
      document.removeEventListener('mousedown', onSelectStart, false)
      document.removeEventListener('mouseup', onSelectEnd, false)
      document.removeEventListener('dragend', onSelectEnd, false)
    }
  }, [])

  const handleOnFocus = () => {
    change$.next({type: 'focus'})
  }

  const handleOnBlur = () => {
    change$.next({type: 'blur'})
  }

  const handleOnBeforeInput = (event: Event) => {
    if (props.onBeforeInput) {
      props.onBeforeInput(event)
    }
  }

  const handleKeyDown = editor.pteWithHotKeys
  // The editor
  const slateEditable = useMemo(
    () => (
      <Slate
        onChange={handleChange}
        editor={editor}
        selection={selection}
        value={getValueOrIntitialValue(stateValue, [placeHolderBlock])}
      >
        <SlateEditable
          autoFocus={false}
          className={'pt-editable'}
          // decorate={decorate}
          onDOMBeforeInput={handleOnBeforeInput}
          onBlur={handleOnBlur}
          onCopy={handleCopy}
          onCut={handleCut}
          onFocus={handleOnFocus}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onSelect={handleSelect}
          placeholder={placeholderText}
          readOnly={readOnly}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          spellCheck={spellCheck}
        />
      </Slate>
    ),
    [placeholderText, readOnly, spellCheck, stateValue, selection, renderElement]
  )
  if (!portableTextEditor) {
    return null
  }
  return slateEditable
}

function getValueOrIntitialValue(value: any, initialValue: any) {
  if (Array.isArray(value) && value.length > 0) {
    return value
  }
  return initialValue
}
