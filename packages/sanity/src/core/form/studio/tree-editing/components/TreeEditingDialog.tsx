/* eslint-disable @sanity/i18n/no-attribute-string-literals */
/* eslint-disable i18next/no-literal-string */
import {Dialog} from '@sanity/ui'
import * as PathUtils from '@sanity/util/paths'
import {type ReactElement, useCallback, useEffect, useMemo, useState} from 'react'
import {
  FormInput,
  type InputProps,
  type ObjectInputProps,
  type ObjectSchemaType,
  type Path,
} from 'sanity'

import {buildTreeMenuItems, getSchemaField, isOpen} from '../utils'
import {TreeEditingLayout} from './TreeEditingLayout'

function renderDefault(props: InputProps) {
  return props.renderDefault(props)
}

function toString(path: Path): string {
  return PathUtils.toString(path)
}

interface TreeEditingDialogProps {
  // ...
  focusPath: Path
  schemaType: ObjectSchemaType
  setFocusPath: (path: Path) => void
  rootInputProps: Omit<ObjectInputProps, 'renderDefault'>
}

const EMPTY_ARRAY: [] = []

export function TreeEditingDialog(props: TreeEditingDialogProps): ReactElement | null {
  const {focusPath, rootInputProps, schemaType, setFocusPath} = props
  const [relativePath, setRelativePath] = useState<Path>(EMPTY_ARRAY)
  const {value} = rootInputProps

  const onClose = useCallback(() => {
    setFocusPath(EMPTY_ARRAY)
    setRelativePath(EMPTY_ARRAY)
  }, [setFocusPath])

  const open = useMemo(() => isOpen(schemaType, focusPath), [schemaType, focusPath])
  const menuItems = useMemo(() => buildTreeMenuItems(schemaType, value), [schemaType, value])

  useEffect(() => {
    if (focusPath.length === 0) return
    const parentPathString = toString(focusPath.slice(0, -1))
    const parentField = getSchemaField(schemaType, parentPathString)

    if (focusPath.length === 0) {
      return
    }

    if (parentField?.type.jsonType === 'array') {
      setRelativePath(focusPath)
      return
    }

    if (parentField?.type.jsonType === 'object') {
      setRelativePath(focusPath)
    }
  }, [focusPath, schemaType, setRelativePath])

  if (!open || relativePath.length === 0) return null

  return (
    <Dialog
      autoFocus={false}
      id="tree-editing-dialog"
      onClickOutside={onClose}
      padding={0}
      width={2}
    >
      <TreeEditingLayout items={menuItems} onPathSelect={setFocusPath}>
        <FormInput {...rootInputProps} relativePath={relativePath} renderDefault={renderDefault} />
      </TreeEditingLayout>
    </Dialog>
  )
}
