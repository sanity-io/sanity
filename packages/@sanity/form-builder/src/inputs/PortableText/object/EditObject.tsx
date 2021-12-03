/* eslint-disable react/no-find-dom-node */

import React, {useState, useEffect, useMemo, useLayoutEffect, useCallback} from 'react'
import {isKeySegment, Path, Marker} from '@sanity/types'
import {FormFieldPresence} from '@sanity/base/presence'
import {
  compactPatches,
  PortableTextBlock,
  PortableTextChild,
  PortableTextEditor,
  PortableTextFeatures,
  Type,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import {debounce} from 'lodash'
import {applyAll} from '../../../simplePatch'
import {PatchEvent} from '../../../PatchEvent'
import {ObjectEditData} from '../types'
import {Patch} from '../../../patch/types'
import {DefaultObjectEditing} from './renderers/DefaultObjectEditing'
import {PopoverObjectEditing} from './renderers/PopoverObjectEditing'
import {getModalOption} from './helpers'

const PATCHES: WeakMap<PortableTextEditor, Patch[]> = new WeakMap()
const IS_THROTTLING: WeakMap<PortableTextEditor, boolean> = new WeakMap()
const THROTTLE_MS = 300

export interface EditObjectProps {
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

export const EditObject = (props: EditObjectProps) => {
  const {
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
  } = props
  const editor = usePortableTextEditor()
  const ptFeatures = useMemo(() => PortableTextEditor.getPortableTextFeatures(editor), [editor])
  const [_object, type] = useMemo(() => findObjectAndType(objectEditData, value, ptFeatures), [
    objectEditData,
    ptFeatures,
    value,
  ])
  const [object, setObject] = useState(_object)
  const [timeoutInstance, setTimeoutInstance] = useState(undefined)
  const formBuilderPath = objectEditData && objectEditData.formBuilderPath
  const kind = objectEditData && objectEditData.kind
  const modalOption = useMemo(() => getModalOption({type}), [type])

  // Initialize weakmaps on mount, and send patches on unmount
  useEffect(() => {
    PATCHES.set(editor, [])
    IS_THROTTLING.set(editor, false)
    return () => {
      sendPatches()
      PATCHES.delete(editor)
      IS_THROTTLING.delete(editor)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    setObject(_object)
  }, [_object])

  const cancelThrottle = useMemo(
    () =>
      debounce(() => {
        IS_THROTTLING.set(editor, false)
      }, THROTTLE_MS),
    [editor]
  )

  const sendPatches = useCallback(() => {
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
  }, [cancelThrottle, editor, formBuilderPath, onChange, timeoutInstance])

  const handleChange = useCallback(
    (patchEvent: PatchEvent): void => {
      setObject(applyAll(object, patchEvent.patches))
      const patches = PATCHES.get(editor)
      IS_THROTTLING.set(editor, true)
      if (patches) {
        PATCHES.set(editor, PATCHES.get(editor).concat(patchEvent.patches))
        sendPatches()
      }
    },
    [editor, object, sendPatches]
  )

  if (!objectEditData || !object || !type) {
    return null
  }

  if (
    modalOption.type === 'popover' ||
    (kind === 'annotation' && typeof modalOption.type === 'undefined')
  ) {
    return (
      <PopoverObjectEditing
        focusPath={focusPath}
        editorPath={objectEditData.editorPath}
        markers={markers}
        object={object}
        onBlur={onBlur}
        onChange={handleChange}
        onClose={onClose}
        onFocus={onFocus}
        path={formBuilderPath}
        presence={presence}
        readOnly={readOnly}
        type={type}
        width={modalOption.width}
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
      onClose={onClose}
      onFocus={onFocus}
      path={formBuilderPath}
      presence={presence}
      readOnly={readOnly}
      type={type}
      width={modalOption.width}
    />
  )
}

function findObjectAndType(
  objectEditData: ObjectEditData,
  value: PortableTextBlock[] | undefined,
  ptFeatures: PortableTextFeatures
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
        if (object) {
          type = ptFeatures.types.inlineObjects.find((t) => t.name === child._type)
        }
        break
      case 'annotation':
        if (child) {
          const markDef =
            child.marks &&
            block.markDefs &&
            block.markDefs.find((def) => child.marks.includes(def._key))
          if (markDef) {
            type = ptFeatures.types.annotations.find((t) => t.name === markDef._type)
            object = markDef
          }
        }
        break
      default:
        // Nothing
        break
    }
  }
  return [object, type]
}
