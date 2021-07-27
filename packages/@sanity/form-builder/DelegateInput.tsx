import {isArraySchemaType, isKeySegment, isObjectSchemaType, Path, SchemaType} from '@sanity/types'
import React, {ComponentType, useCallback} from 'react'
import * as PathUtils from '@sanity/util/paths'
import {resolveTypeName} from '@sanity/util/content'

interface Operation {
  type: 'set' | 'unset' | 'setIfMissing'
  value?: unknown
}

export function setFrom(value, nativeEvent?: Event): PatchEvent {
  return {
    nativeEvent,
    patches: [
      {
        path: [],
        operation: {
          type: 'set',
          value: value,
        },
      },
    ],
  }
}

export function prependPath(event: PatchEvent, path: Path): PatchEvent {
  return {
    ...event,
    patches: event.patches.map((patch) => ({
      ...patch,
      path: [...path, ...patch.path],
    })),
  }
}

interface Patch {
  path: Path
  operation: Operation
}

interface PatchEvent {
  patches: Patch[]
  nativeEvent: Event
}

interface InputComponentProps {
  onChange: (patch: PatchEvent) => void
  value: unknown | undefined
  type: SchemaType
}

interface Props {
  type: SchemaType
  path: Path
  value: unknown
  onChange: (event: PatchEvent) => void
  input: ComponentType<InputComponentProps>
}

function getTypeAt(value: unknown | undefined, path: Path, type: SchemaType): SchemaType {
  if (path.length === 0) {
    return type
  }
  const [head, ...tail] = path
  if (isKeySegment(head) || typeof head === 'number') {
    if (!Array.isArray(value)) {
      throw new Error(`Cannot resolve type of value at path: ${PathUtils.toString(path)}`)
    }
    if (!isArraySchemaType(type)) {
      throw new Error(`Expected type at path ${PathUtils.toString(path)} to be array type`)
    }
    const item = PathUtils.get(value, [head])
    const itemTypeName = resolveTypeName(type)
    const itemType = type.of.find((memberType) => memberType.name === resolveTypeName(type))
    if (!itemType) {
      throw new Error(`Array schema definition does not support items of type ${itemTypeName}`)
    }
    return getTypeAt(item, tail, itemType)
  }
  if (typeof head !== 'string') {
    throw new Error(
      'Expected path segment to be either a string, number or an object with a "_key" property'
    )
  }
  if (!isObjectSchemaType(type)) {
    throw new Error(
      `Expected type at path ${PathUtils.toString(path)} to be an object type. Instead saw ${
        type.name
      }`
    )
  }
  const field = type.fields.find((f) => f.name === head)
  if (!field) {
    throw new Error(`Invalid path: "${head}" is not a field on type "${type.name}"`)
  }

  return getTypeAt((value as any)?.[field.name], tail, field.type)
}

export function DelegateInput(props: Props) {
  const {path, value, type, input: Input} = props

  const handleChange = useCallback(
    (event) => {
      console.log(prependPath(event, path))
      // todo insert setIfMissing patches with initial values at every path segment
    },
    [path, value]
  )

  return (
    <>
      {PathUtils.toString(path)}
      <Input value={value} onChange={handleChange} type={getTypeAt(value, path, type)} />
    </>
  )
}
