/* eslint-disable react/no-find-dom-node */
import React, {useState, useEffect} from 'react'
import {FormFieldPresence} from '@sanity/base/presence'
import {
  PortableTextBlock,
  Type,
  PortableTextEditor,
  compactPatches,
  usePortableTextEditor
} from '@sanity/portable-text-editor'
import {get, debounce} from 'lodash'

import {applyAll} from '../../../simplePatch'
import {ModalType} from '../../ArrayInput/typedefs'
import {Marker} from '../../../typedefs'
import {Path} from '../../../typedefs/path'
import {Patch} from '../../../typedefs/patch'
import {PatchEvent} from '../../../PatchEvent'
import {ObjectEditData} from '../types'
import {DefaultObjectEditing} from './renderers/DefaultObjectEditing'
import {PopoverObjectEditing} from './renderers/PopoverObjectEditing'
import {FullscreenObjectEditing} from './renderers/FullscreenObjectEditing'

const PATCHES: WeakMap<PortableTextEditor, Patch[]> = new WeakMap()

interface Props {
  focusPath: Path
  markers: Marker[]
  objectEditData: ObjectEditData
  onBlur: () => void
  onChange: (patchEvent: PatchEvent, editPath: Path) => void
  onClose: () => void
  onFocus: (arg0: Path) => void
  presence: FormFieldPresence[]
  readOnly: boolean
  value: PortableTextBlock[] | undefined
}

// eslint-disable-next-line complexity
export const EditObject = ({
  focusPath,
  markers,
  objectEditData,
  onBlur,
  onChange,
  onClose,
  onFocus,
  presence,
  readOnly,
  value
}: Props) => {
  const editor = usePortableTextEditor()
  const ptFeatures = PortableTextEditor.getPortableTextFeatures(editor)
  const {formBuilderPath, editorPath, kind} = objectEditData

  let object
  let type: Type

  // Try finding the relevant block
  const blockKey =
    Array.isArray(formBuilderPath) &&
    formBuilderPath[0] &&
    typeof formBuilderPath[0] === 'object' &&
    formBuilderPath[0]._key
  const block =
    value && blockKey && Array.isArray(value) && value.find(blk => blk._key === blockKey)
  const child =
    block &&
    block.children &&
    block.children.find(cld => typeof editorPath[2] === 'object' && cld._key === editorPath[2]._key)

  if (block) {
    // Get object, type, and relevant editor element
    switch (kind) {
      case 'blockObject':
        object = block
        type = ptFeatures.types.blockObjects.find(t => t.name === block._type)
        break
      case 'inlineObject':
        object = child
        // eslint-disable-next-line max-depth
        if (object) {
          type = ptFeatures.types.inlineObjects.find(t => t.name === child._type)
        }
        break
      case 'annotation':
        // eslint-disable-next-line max-depth
        if (child) {
          const markDef =
            child.marks &&
            block.markDefs &&
            block.markDefs.find(def => child.marks.includes(def._key))
          // eslint-disable-next-line max-depth
          if (markDef) {
            type = ptFeatures.types.annotations.find(t => t.name === markDef._type)
            object = markDef
          }
        }
        break
      default:
      // Nothing
    }
  }

  const [stateValue, setStateValue] = useState(object)
  const [isThrottling, setIsThrottling] = useState(undefined)

  // This will cancel the throttle when the user is not producing anything for a short time
  const cancelThrottle = debounce(() => {
    setIsThrottling(false)
  }, 500)

  function handleClose(): void {
    onClose()
  }

  // Initialize weakmaps on mount, and send patches on unmount
  useEffect(() => {
    PATCHES.set(editor, [])
    return () => {
      sendPatches()
      PATCHES.delete(editor)
    }
  }, [])

  // Cancel throttle after editing activity has stopped
  useEffect(() => {
    if (isThrottling === true) {
      cancelThrottle()
    }
  }, [isThrottling])

  // Send away patches when we are no longer throttling
  useEffect(() => {
    if (isThrottling === false) {
      sendPatches()
    }
  }, [isThrottling])

  // Keep value from props in sync
  useEffect(() => {
    if (!isThrottling) {
      setStateValue(object)
    }
  }, [value])

  const editModalLayout: ModalType = get(type, 'options.editModal')

  function handleChange(patchEvent: PatchEvent): void {
    const appliedValue = applyAll(stateValue, patchEvent.patches)
    setStateValue(appliedValue)
    const patches = PATCHES.get(editor)
    if (patches) {
      const _patches = PATCHES.get(editor).concat(patchEvent.patches)
      setIsThrottling(true)
      PATCHES.set(editor, _patches)
    }
  }

  function sendPatches() {
    const patches = PATCHES.get(editor)
    if (!patches) {
      return
    }
    const length = patches.length
    const _patches = compactPatches(PATCHES.get(editor).slice(0, length))
    PATCHES.set(editor, PATCHES.get(editor).slice(length))
    setTimeout(() => {
      onChange(PatchEvent.from(_patches), formBuilderPath)
    })
  }

  // Render nothing if object or type wasn't found
  if (!object || !type) {
    return null
  }

  const editorElement: HTMLElement = PortableTextEditor.findDOMNode(
    editor,
    child ? child : block
  ) as HTMLElement

  // Render the various editing interfaces
  if (editModalLayout === 'fullscreen') {
    return (
      <FullscreenObjectEditing
        focusPath={focusPath}
        markers={markers}
        object={stateValue}
        onBlur={onBlur}
        onChange={handleChange}
        onClose={handleClose}
        onFocus={onFocus}
        path={formBuilderPath}
        presence={presence}
        readOnly={readOnly}
        type={type}
      />
    )
  }

  if (editModalLayout === 'popover' || kind === 'annotation') {
    return (
      <PopoverObjectEditing
        focusPath={focusPath}
        markers={markers}
        object={stateValue}
        onBlur={onBlur}
        onChange={handleChange}
        onClose={handleClose}
        onFocus={onFocus}
        path={formBuilderPath}
        presence={presence}
        readOnly={readOnly}
        referenceElement={editorElement}
        type={type}
      />
    )
  }
  return (
    <DefaultObjectEditing
      focusPath={focusPath}
      markers={markers}
      object={stateValue}
      onBlur={onBlur}
      onChange={handleChange}
      onClose={handleClose}
      onFocus={onFocus}
      path={formBuilderPath}
      presence={presence}
      readOnly={readOnly}
      type={type}
    />
  )
}
