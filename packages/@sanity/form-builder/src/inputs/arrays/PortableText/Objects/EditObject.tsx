/* eslint-disable react/no-find-dom-node */
import React, {useState, useEffect, useMemo, useLayoutEffect} from 'react'
import {isKeySegment, Path, Marker} from '@sanity/types'
import {FormFieldPresence} from '@sanity/base/presence'
import {
  PortableTextBlock,
  PortableTextChild,
  Type,
  PortableTextEditor,
  compactPatches,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import {get, debounce} from 'lodash'

import {applyAll} from '../../../../simplePatch'

import type {Patch} from '../../../../patch/types'
import {PatchEvent} from '../../../../PatchEvent'
import {ObjectEditData} from '../types'
import {ModalType} from '../../ArrayOfObjectsInput/types'
import {DefaultObjectEditing} from './renderers/DefaultObjectEditing'
import {PopoverObjectEditing} from './renderers/PopoverObjectEditing'
import {FullscreenObjectEditing} from './renderers/FullscreenObjectEditing'

const PATCHES: WeakMap<PortableTextEditor, Patch[]> = new WeakMap()
const IS_THROTTLING: WeakMap<PortableTextEditor, boolean> = new WeakMap()
const THROTTLE_MS = 300

interface Props {
  focusPath: Path
  markers: Marker[]
  objectEditData: ObjectEditData
  onBlur: () => void
  onChange: (patchEvent: PatchEvent, editPath: Path) => void
  onClose: () => void
  onFocus: (path: Path) => void
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
  value,
}: Props) => {
  const editor = usePortableTextEditor()
  const ptFeatures = PortableTextEditor.getPortableTextFeatures(editor)
  const [_object, type] = useMemo(() => findObjectAndType(objectEditData, value, ptFeatures), [
    objectEditData,
    ptFeatures,
    value,
  ])
  const [object, setObject] = useState(_object)
  const [timeoutInstance, setTimeoutInstance] = useState(undefined)

  // Initialize weakmaps on mount, and send patches on unmount
  useEffect(() => {
    PATCHES.set(editor, [])
    IS_THROTTLING.set(editor, false)
    return () => {
      sendPatches()
      PATCHES.delete(editor)
      IS_THROTTLING.delete(editor)
    }
  }, [])

  useLayoutEffect(() => {
    setObject(_object)
  }, [_object])

  if (!objectEditData) {
    return null
  }
  const {formBuilderPath, kind} = objectEditData

  function handleClose(): void {
    onClose()
  }

  const editModalLayout: ModalType = get(type, 'options.editModal')

  const cancelThrottle = debounce(() => {
    IS_THROTTLING.set(editor, false)
  }, THROTTLE_MS)

  function handleChange(patchEvent: PatchEvent): void {
    setObject(applyAll(object, patchEvent.patches))
    const patches = PATCHES.get(editor)
    IS_THROTTLING.set(editor, true)
    if (patches) {
      PATCHES.set(editor, PATCHES.get(editor).concat(patchEvent.patches))
      sendPatches()
    }
  }

  function sendPatches() {
    if (IS_THROTTLING.get(editor) === true) {
      cancelThrottle()
      clearInterval(timeoutInstance)
      setTimeoutInstance(setTimeout(sendPatches, THROTTLE_MS + 100))
      return
    }
    const patches = PATCHES.get(editor)
    if (!patches || patches.length === 0) {
      return
    }
    const length = patches.length
    const _patches = compactPatches(PATCHES.get(editor).slice(0, length))
    PATCHES.set(editor, PATCHES.get(editor).slice(length))
    setTimeout(() => {
      onChange(PatchEvent.from(_patches), formBuilderPath)
    })
    cancelThrottle()
  }

  if (!object || !type) {
    return null
  }

  if (editModalLayout === 'fullscreen') {
    return (
      <FullscreenObjectEditing
        focusPath={focusPath}
        markers={markers}
        object={object}
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
        editorPath={objectEditData.editorPath}
        markers={markers}
        object={object}
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
  return (
    <DefaultObjectEditing
      focusPath={focusPath}
      markers={markers}
      object={object}
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

function findObjectAndType(
  objectEditData,
  value,
  ptFeatures
): [PortableTextChild | undefined, Type | undefined] {
  if (!objectEditData) {
    return [undefined, undefined]
  }
  const {editorPath, formBuilderPath, kind} = objectEditData
  let object: PortableTextChild
  let type: Type

  // Try finding the relevant block
  const blockKey =
    Array.isArray(formBuilderPath) && isKeySegment(formBuilderPath[0]) && formBuilderPath[0]._key

  const block =
    value && blockKey && Array.isArray(value) && value.find((blk) => blk._key === blockKey)
  const child =
    block &&
    block.children &&
    block.children.find((cld) => isKeySegment(editorPath[2]) && cld._key === editorPath[2]._key)

  if (block) {
    // Get object, type, and relevant editor element
    switch (kind) {
      case 'blockObject':
        object = block
        type = ptFeatures.types.blockObjects.find((t) => t.name === block._type)
        break
      case 'inlineObject':
        object = child
        // eslint-disable-next-line max-depth
        if (object) {
          type = ptFeatures.types.inlineObjects.find((t) => t.name === child._type)
        }
        break
      case 'annotation':
        // eslint-disable-next-line max-depth
        if (child) {
          const markDef =
            child.marks &&
            block.markDefs &&
            block.markDefs.find((def) => child.marks.includes(def._key))
          // eslint-disable-next-line max-depth
          if (markDef) {
            type = ptFeatures.types.annotations.find((t) => t.name === markDef._type)
            object = markDef
          }
        }
        break
      default:
      // Nothing
    }
  }
  return [object, type]
}
