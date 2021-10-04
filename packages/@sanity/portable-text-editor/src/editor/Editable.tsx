import {Transforms, Node} from 'slate'
import {isEqual} from 'lodash'
import isHotkey from 'is-hotkey'
import {normalizeBlock} from '@sanity/block-tools'
import React, {useCallback, useMemo, useState, useEffect, useRef} from 'react'
import {Editable as SlateEditable, Slate, ReactEditor, withReact} from '@sanity/slate-react'
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
import {toSlateValue} from '../utils/values'
import {hasEditableTarget, setFragmentData} from '../utils/copyPaste'
import {normalizeSelection} from '../utils/selection'
import {toPortableTextRange, toSlateRange} from '../utils/ranges'
import {debugWithName} from '../utils/debug'
import {KEY_TO_SLATE_ELEMENT, KEY_TO_VALUE_ELEMENT} from '../utils/weakMaps'
import {Leaf} from './Leaf'
import {Element} from './Element'
import {usePortableTextEditor} from './hooks/usePortableTextEditor'
import {usePortableTextEditorValue} from './hooks/usePortableTextEditorValue'
import {PortableTextEditor} from './PortableTextEditor'
import {createWithEditableAPI, createWithHotkeys, createWithInsertData} from './plugins'

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

  const {change$, isThrottling, keyGenerator, portableTextFeatures, readOnly} = portableTextEditor

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
    [change$, keyGenerator, portableTextFeatures]
  )
  const withHotKeys = useMemo(
    () => createWithHotkeys(portableTextFeatures, keyGenerator, portableTextEditor, hotkeys),
    [hotkeys, keyGenerator, portableTextEditor, portableTextFeatures]
  )

  // Create the PortableTextEditor API
  const withEditableAPI = useMemo(
    () => createWithEditableAPI(portableTextEditor, portableTextFeatures, keyGenerator),
    [keyGenerator, portableTextEditor, portableTextFeatures]
  )

  // Update the Slate instance's plugins which are dependent on props for Editable
  useMemo(
    () => withHotKeys(withInsertData(withEditableAPI(withReact(portableTextEditor.slateInstance)))),
    [portableTextEditor.slateInstance, withEditableAPI, withHotKeys, withInsertData]
  )

  // Track editor value
  const [stateValue, setStateValue] = useState(
    // Default value
    toSlateValue(
      getValueOrIntitialValue(value, [placeHolderBlock]),
      portableTextFeatures.types.block.name,
      KEY_TO_SLATE_ELEMENT.get(portableTextEditor.slateInstance)
    )
  )

  // Track selection state
  const [selection, setSelection] = useState(portableTextEditor.slateInstance.selection)
  const [isSelecting, setIsSelecting] = useState(false)

  const renderElement = useCallback(
    (eProps) => {
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
    [keyGenerator, portableTextFeatures, readOnly, renderBlock, renderChild]
  )

  const renderLeaf = useCallback(
    (lProps) => {
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
    [portableTextFeatures, keyGenerator, renderAnnotation, renderChild, renderDecorator, readOnly]
  )

  const handleChange = useCallback(
    (val: Node[]) => {
      if (val !== stateValue) {
        setStateValue(val)
      }
      if (portableTextEditor.slateInstance.selection !== selection) {
        setSelection(portableTextEditor.slateInstance.selection)
      }
    },
    [portableTextEditor.slateInstance.selection, selection, stateValue]
  )

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

  useEffect(() => {
    KEY_TO_SLATE_ELEMENT.set(portableTextEditor.slateInstance, {})
    KEY_TO_VALUE_ELEMENT.set(portableTextEditor.slateInstance, {})
    return () => {
      KEY_TO_SLATE_ELEMENT.delete(portableTextEditor.slateInstance)
      KEY_TO_VALUE_ELEMENT.delete(portableTextEditor.slateInstance)
    }
  }, [portableTextEditor.slateInstance])

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
    const fromMap = VALUE_TO_SLATE_VALUE.get(value || [])
    if (fromMap === stateValue) {
      debug('Value in sync, not updating value from props')
    } else {
      debug('Setting value from props')
      const slateValueFromProps = toSlateValue(
        value,
        portableTextFeatures.types.block.name,
        KEY_TO_SLATE_ELEMENT.get(portableTextEditor.slateInstance)
      )
      setStateValue(slateValueFromProps)
      VALUE_TO_SLATE_VALUE.set(value || [], slateValueFromProps)
      change$.next({type: 'value', value})
    }
  }, [value, isSelecting, isThrottling])

  // Restore selection from props
  useEffect(() => {
    const pSelection = props.selection
    if (
      pSelection &&
      !isThrottling &&
      !isEqual(pSelection, toPortableTextRange(portableTextEditor.slateInstance))
    ) {
      debug('Selection from props', pSelection)
      const normalizedSelection = normalizeSelection(pSelection, value)
      if (normalizedSelection !== null) {
        debug('Normalized selection from props', normalizedSelection)
        const slateRange = toSlateRange(normalizedSelection, portableTextEditor.slateInstance)
        setSelection(slateRange)
      } else if (stateValue) {
        debug('Selecting top document')
        setSelection(SELECT_TOP_DOCUMENT)
      }
    }
  }, [props.selection])

  // Set initial selection from props
  useEffect(() => {
    if (props.selection) {
      PortableTextEditor.select(portableTextEditor, props.selection)
    }
  }, [])

  // Handle copy in the editor
  const handleCopy = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>): void | ReactEditor => {
      const {onCopy} = props
      if (onCopy) {
        const result = onCopy(event)
        // CopyFn may return something to avoid doing default stuff
        if (result !== undefined) {
          event.preventDefault()
          return
        }
      }
      if (hasEditableTarget(portableTextEditor.slateInstance, event.target)) {
        // Set Portable Text on the clipboard
        setFragmentData(event.clipboardData, portableTextEditor.slateInstance, portableTextFeatures)
      }
    },
    [portableTextEditor.slateInstance, portableTextFeatures, props]
  )

  // Handle pasting in the editor
  const handlePaste = useCallback(
    (event: React.SyntheticEvent): Promise<any> | void => {
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
              portableTextEditor.slateInstance.insertData(dataTransfer)
              change$.next({type: 'loading', isLoading: false})
              portableTextEditor.slateInstance.onChange()
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
    },
    [
      change$,
      portableTextEditor,
      portableTextFeatures.decorators,
      portableTextFeatures.types.block.name,
      portableTextFeatures.types.portableText,
      props,
      value,
    ]
  )

  // There's a bug in Slate atm regarding void nodes not being deleted. Seems related
  // to 'hanging: true' and 'voids: false'. 2020/05/26
  const handleCut = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>): void | ReactEditor => {
      event.preventDefault()
      event.stopPropagation()
      if (portableTextEditor.slateInstance.selection) {
        ReactEditor.setFragmentData(portableTextEditor.slateInstance, event.clipboardData)
        Transforms.delete(portableTextEditor.slateInstance, {
          at: portableTextEditor.slateInstance.selection,
          voids: false,
          hanging: true,
        })
        Transforms.collapse(portableTextEditor.slateInstance)
        portableTextEditor.slateInstance.onChange()
      }
      return portableTextEditor.slateInstance
    },
    [portableTextEditor.slateInstance]
  )

  // Emit selection after a selection is made
  const emitSelection = useCallback(() => {
    try {
      const newSelection = toPortableTextRange(portableTextEditor.slateInstance)
      // debug('Emitting new selection', JSON.stringify(newSelection))
      change$.next({type: 'selection', selection: newSelection})
    } catch (err) {
      change$.next({type: 'selection', selection: null})
    }
  }, [change$, portableTextEditor])
  const handleSelect = useCallback(() => {
    if (isThrottling) {
      return
    }
    emitSelection()
  }, [emitSelection, isThrottling])
  useEffect(() => {
    if (isThrottling) {
      return
    }
    emitSelection()
  }, [emitSelection, isThrottling])

  useEffect(() => {
    emitSelection()
  }, [emitSelection, selection])

  // Make sure that when the user is actively selecting something, we don't update the editor or selections will be broken
  const _isSelecting = useRef(false)
  const onSelectStart = useCallback(
    (event: any) => {
      if (ReactEditor.hasDOMNode(portableTextEditor.slateInstance, event.target)) {
        debug('Start selecting')
        _isSelecting.current = true
        setTimeout(() => setIsSelecting(true))
      }
    },
    [portableTextEditor]
  )
  const onSelectEnd = useCallback(() => {
    if (_isSelecting.current) {
      debug('Done selecting')
      setTimeout(() => setIsSelecting(false))
    }
  }, [_isSelecting])
  const isSelectKeys = (event: KeyboardEvent) =>
    isHotkey('shift+down', event) ||
    isHotkey('shift+up', event) ||
    isHotkey('shift+left', event) ||
    isHotkey('shift+right', event) ||
    isHotkey('shift+end', event) ||
    isHotkey('shift+home', event) ||
    isHotkey('shift+pageDown', event) ||
    isHotkey('shift+pageUp', event)
  const isSelectingWithKeys = useRef(false)
  const onSelectStartWithKeys = useCallback(
    (event: KeyboardEvent) => {
      if (isSelectKeys(event)) {
        isSelectingWithKeys.current = true
        onSelectStart(event)
      }
    },
    [onSelectStart]
  )
  const onSelectEndWithKeys = useCallback(
    (event: KeyboardEvent) => {
      if (isSelectingWithKeys.current && event.key === 'Shift') {
        onSelectEnd()
        isSelectingWithKeys.current = false
      }
    },
    [onSelectEnd]
  )

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
  }, [onSelectEnd, onSelectEndWithKeys, onSelectStart, onSelectStartWithKeys])

  const handleOnFocus = useCallback(() => {
    change$.next({type: 'focus'})
  }, [change$])

  const handleOnBlur = useCallback(() => {
    change$.next({type: 'blur'})
  }, [change$])

  const handleOnBeforeInput = useCallback(
    (event: Event) => {
      if (props.onBeforeInput) {
        props.onBeforeInput(event)
      }
    },
    [props]
  )

  const handleKeyDown = portableTextEditor.slateInstance.pteWithHotKeys
  // The editor
  const slateEditable = useMemo(
    () => (
      <Slate
        onChange={handleChange}
        editor={portableTextEditor.slateInstance}
        selection={selection}
        value={getValueOrIntitialValue(stateValue, [placeHolderBlock])}
      >
        <SlateEditable
          autoFocus={false}
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
    [
      handleChange,
      portableTextEditor,
      selection,
      stateValue,
      placeHolderBlock,
      handleOnBeforeInput,
      handleOnBlur,
      handleCopy,
      handleCut,
      handleOnFocus,
      handleKeyDown,
      handlePaste,
      handleSelect,
      placeholderText,
      readOnly,
      renderElement,
      renderLeaf,
      spellCheck,
    ]
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
