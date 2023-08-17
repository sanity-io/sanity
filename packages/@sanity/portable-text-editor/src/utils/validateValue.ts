import {PortableTextBlock, PortableTextSpan, PortableTextTextBlock} from '@sanity/types'
import {flatten, isObject, uniq} from 'lodash'
import {set, unset, insert} from '../patch/PatchEvent'
import {InvalidValueResolution, PortableTextMemberSchemaTypes} from '../types/editor'

export interface Validation {
  valid: boolean
  resolution: InvalidValueResolution | null
  value: PortableTextBlock[] | undefined
}

export function validateValue(
  value: PortableTextBlock[] | undefined,
  types: PortableTextMemberSchemaTypes,
  keyGenerator: () => string,
): Validation {
  let resolution: InvalidValueResolution | null = null
  let valid = true
  const validChildTypes = [types.span.name, ...types.inlineObjects.map((t) => t.name)]
  const validBlockTypes = [types.block.name, ...types.blockObjects.map((t) => t.name)]

  // Undefined is allowed
  if (value === undefined) {
    return {valid: true, resolution: null, value}
  }
  // Only lengthy arrays are allowed in the editor.
  if (!Array.isArray(value) || value.length === 0) {
    return {
      valid: false,
      resolution: {
        patches: [unset([])],
        description: 'Editor value must be an array of Portable Text blocks, or undefined.',
        action: 'Unset the value',
        item: value,
      },
      value,
    }
  }
  if (
    value.some((blk: PortableTextBlock, index: number): boolean => {
      // Is the block an object?
      if (!isObject(blk)) {
        resolution = {
          patches: [unset([index])],
          description: `Block must be an object, got ${String(blk)}`,
          action: `Unset invalid item`,
          item: blk,
        }
        return true
      }
      // Test that every block has a _key prop
      if (!blk._key) {
        resolution = {
          patches: [set({...blk, _key: keyGenerator()}, [index])],
          description: `Block at index ${index} is missing required _key.`,
          action: 'Set the block with a random _key value',
          item: blk,
        }
        return true
      }
      // Test that every block has valid _type
      if (!blk._type || !validBlockTypes.includes(blk._type)) {
        // Special case where block type is set to default 'block', but the block type is named something else according to the schema.
        if (blk._type === 'block') {
          const currentBlockTypeName = types.block.name
          resolution = {
            patches: [set({...blk, _type: currentBlockTypeName}, [{_key: blk._key}])],
            description: `Block with _key '${blk._key}' has invalid type name '${blk._type}'. According to the schema, the block type name is '${currentBlockTypeName}'`,
            action: `Use type '${currentBlockTypeName}'`,
            item: blk,
          }
          return true
        }
        resolution = {
          patches: [unset([{_key: blk._key}])],
          description: `Block with _key '${blk._key}' has invalid _type '${blk._type}'`,
          action: 'Remove the block',
          item: blk,
        }
        return true
      }
      // Test that every child in text block is valid
      if (blk._type === types.block.name) {
        const textBlock = blk as PortableTextTextBlock
        // Test that it has children
        if (!textBlock.children) {
          resolution = {
            patches: [unset([{_key: textBlock._key}])],
            description: `Text block with _key '${textBlock._key}' is missing required key 'children'.`,
            action: 'Remove the block',
            item: textBlock,
          }
          return true
        }
        // Test that markDefs exists
        if (!blk.markDefs) {
          resolution = {
            patches: [set({...textBlock, markDefs: []}, [{_key: textBlock._key}])],
            description: `Block is missing required key 'markDefs'.`,
            action: 'Add empty markDefs array',
            item: textBlock,
          }
          return true
        }
        // NOTE: this is commented out as we want to allow the saved data to have optional .marks for spans (as specified by the schema)
        // const spansWithUndefinedMarks = blk.children
        //   .filter(cld => cld._type === types.span.name)
        //   .filter(cld => typeof cld.marks === 'undefined')

        // if (spansWithUndefinedMarks.length > 0) {
        //   const first = spansWithUndefinedMarks[0]
        //   resolution = {
        //     patches: [
        //       set({...first, marks: []}, [{_key: blk._key}, 'children', {_key: first._key}])
        //     ],
        //     description: `Span has no .marks array`,
        //     action: 'Add empty marks array',
        //     item: first
        //   }
        //   return true
        // }
        const allUsedMarks = uniq(
          flatten(
            textBlock.children
              .filter((cld) => cld._type === types.span.name)
              .map((cld) => cld.marks || []),
          ) as string[],
        )
        // Note: this is commented out as it may be a bit too strict:
        // // Test that all markDefs are in use
        // if (Array.isArray(blk.markDefs) && blk.markDefs.length > 0) {
        //   const unusedMarkDefs: string[] = uniq(
        //     blk.markDefs.map((def) => def._key).filter((key) => !allUsedMarks.includes(key))
        //   )
        //   if (unusedMarkDefs.length > 0) {
        //     resolution = {
        //       patches: unusedMarkDefs.map((key) =>
        //         unset([{_key: blk._key}, 'markDefs', {_key: key}])
        //       ),
        //       description: `Block contains orphaned data (unused mark definitions): ${unusedMarkDefs.join(
        //         ', '
        //       )}.`,
        //       action: 'Remove unused mark definition item',
        //       item: blk,
        //     }
        //     return true
        //   }
        // }

        // Test that every annotation mark used has a definition
        const annotationMarks = allUsedMarks.filter(
          (mark) => !types.decorators.map((dec) => dec.value).includes(mark),
        )
        const orphanedMarks = annotationMarks.filter((mark) =>
          textBlock.markDefs ? !textBlock.markDefs.find((def) => def._key === mark) : false,
        )
        if (orphanedMarks.length > 0) {
          const spanChildren = textBlock.children.filter(
            (cld) =>
              cld._type === types.span.name &&
              Array.isArray(cld.marks) &&
              cld.marks.some((mark) => orphanedMarks.includes(mark)),
          ) as PortableTextSpan[]
          if (spanChildren) {
            resolution = {
              patches: spanChildren.map((child) => {
                return set(
                  (child.marks || []).filter((cMrk) => !orphanedMarks.includes(cMrk)),
                  [{_key: blk._key}, 'children', {_key: child._key}, 'marks'],
                )
              }),
              description: `Block with _key '${blk._key}' contains marks (${orphanedMarks.join(
                ', ',
              )}) not supported by the current content model.`,
              action: 'Remove invalid marks',
              item: blk,
            }
            return true
          }
        }

        // Test that children is lengthy
        if (textBlock.children && textBlock.children.length === 0) {
          const newSpan = {
            _type: types.span.name,
            _key: keyGenerator(),
            text: '',
          }
          resolution = {
            patches: [insert([newSpan], 'after', [{_key: blk._key}, 'children', 0])],
            description: `Children for text block with _key '${blk._key}' is empty.`,
            action: 'Insert an empty text',
            item: blk,
          }
          return true
        }
        // Test every child
        if (
          textBlock.children.some((child, cIndex: number) => {
            if (!child._key) {
              const newChild = {...child, _key: keyGenerator()}
              resolution = {
                patches: [set(newChild, [{_key: blk._key}, 'children', cIndex])],
                description: `Child at index ${cIndex} is missing required _key in block with _key ${blk._key}.`,
                action: 'Set a new random _key on the object',
                item: blk,
              }
              return true
            }
            // Verify that children have valid types
            if (!child._type || validChildTypes.includes(child._type) === false) {
              resolution = {
                patches: [unset([{_key: blk._key}, 'children', {_key: child._key}])],
                description: `Child with _key '${child._key}' in block with key '${blk._key}' has invalid '_type' property (${child._type}).`,
                action: 'Remove the object',
                item: blk,
              }
              return true
            }
            // Verify that spans have .text
            if (child._type === types.span.name && child.text === undefined) {
              resolution = {
                patches: [
                  set({...child, text: ''}, [{_key: blk._key}, 'children', {_key: child._key}]),
                ],
                description: `Child with _key '${child._key}' in block with key '${blk._key}' is missing text property!`,
                action: `Write an empty .text to the object`,
                item: blk,
              }
              return true
            }
            return false
          })
        ) {
          valid = false
        }
      }
      return false
    })
  ) {
    valid = false
  }
  return {valid, resolution, value}
}
