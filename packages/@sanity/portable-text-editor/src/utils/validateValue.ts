import {
  type PortableTextBlock,
  type PortableTextSpan,
  type PortableTextTextBlock,
  isPortableTextTextBlock,
} from '@sanity/types'
import {flatten, isPlainObject, uniq} from 'lodash'
import {set, unset, insert} from '../patch/PatchEvent'
import type {InvalidValueResolution, PortableTextMemberSchemaTypes} from '../types/editor'

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

        i18n: {
          description: 'inputs.portable-text.invalid-value.not-an-array.description',
          action: 'inputs.portable-text.invalid-value.not-an-array.action',
        },
      },
      value,
    }
  }
  if (
    value.some((blk: PortableTextBlock, index: number): boolean => {
      // Is the block an object?
      if (!isPlainObject(blk)) {
        resolution = {
          patches: [unset([index])],
          description: `Block must be an object, got ${String(blk)}`,
          action: `Unset invalid item`,
          item: blk,

          i18n: {
            description: 'inputs.portable-text.invalid-value.not-an-object.description',
            action: 'inputs.portable-text.invalid-value.not-an-object.action',
            values: {index},
          },
        }
        return true
      }
      // Test that every block has a _key prop
      if (!blk._key || typeof blk._key !== 'string') {
        resolution = {
          patches: [set({...blk, _key: keyGenerator()}, [index])],
          description: `Block at index ${index} is missing required _key.`,
          action: 'Set the block with a random _key value',
          item: blk,

          i18n: {
            description: 'inputs.portable-text.invalid-value.missing-key.description',
            action: 'inputs.portable-text.invalid-value.missing-key.action',
            values: {index},
          },
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

            i18n: {
              description: 'inputs.portable-text.invalid-value.incorrect-block-type.description',
              action: 'inputs.portable-text.invalid-value.incorrect-block-type.action',
              values: {key: blk._key, expectedTypeName: currentBlockTypeName},
            },
          }
          return true
        }

        // If the block has no `_type`, but aside from that is a valid Portable Text block
        if (!blk._type && isPortableTextTextBlock({...blk, _type: types.block.name})) {
          resolution = {
            patches: [set({...blk, _type: types.block.name}, [{_key: blk._key}])],
            description: `Block with _key '${blk._key}' is missing a type name. According to the schema, the block type name is '${types.block.name}'`,
            action: `Use type '${types.block.name}'`,
            item: blk,

            i18n: {
              description: 'inputs.portable-text.invalid-value.missing-block-type.description',
              action: 'inputs.portable-text.invalid-value.missing-block-type.action',
              values: {key: blk._key, expectedTypeName: types.block.name},
            },
          }
          return true
        }

        if (!blk._type) {
          resolution = {
            patches: [unset([{_key: blk._key}])],
            description: `Block with _key '${blk._key}' is missing an _type property`,
            action: 'Remove the block',
            item: blk,

            i18n: {
              description: 'inputs.portable-text.invalid-value.missing-type.description',
              action: 'inputs.portable-text.invalid-value.missing-type.action',
              values: {key: blk._key},
            },
          }
          return true
        }

        resolution = {
          patches: [unset([{_key: blk._key}])],
          description: `Block with _key '${blk._key}' has invalid _type '${blk._type}'`,
          action: 'Remove the block',
          item: blk,

          i18n: {
            description: 'inputs.portable-text.invalid-value.disallowed-type.description',
            action: 'inputs.portable-text.invalid-value.disallowed-type.action',
            values: {key: blk._key, typeName: blk._type},
          },
        }
        return true
      }
      // Test that every child in text block is valid
      if (blk._type === types.block.name) {
        const textBlock = blk as PortableTextTextBlock
        // Test that it has (valid) children property
        if (!textBlock.children || !Array.isArray(textBlock.children)) {
          resolution = {
            patches: [unset([{_key: textBlock._key}])],
            description: `Text block with _key '${textBlock._key}' has a missing or invalid required property 'children'.`,
            action: 'Remove the block',
            item: textBlock,

            i18n: {
              description:
                'inputs.portable-text.invalid-value.missing-or-invalid-children.description',
              action: 'inputs.portable-text.invalid-value.missing-or-invalid-children.action',
              values: {key: textBlock._key},
            },
          }
          return true
        }
        // Test that markDefs exists and is valid
        if (!blk.markDefs || !Array.isArray(blk.markDefs)) {
          resolution = {
            patches: [set({...textBlock, markDefs: []}, [{_key: textBlock._key}])],
            description: `Block has a missing or invalid required property 'markDefs'.`,
            action: 'Add empty markDefs array',
            item: textBlock,

            i18n: {
              description:
                'inputs.portable-text.invalid-value.missing-or-invalid-markdefs.description',
              action: 'inputs.portable-text.invalid-value.missing-or-invalid-markdefs.action',
              values: {key: textBlock._key},
            },
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
            const orphaned = orphanedMarks.join(', ')
            resolution = {
              patches: spanChildren.map((child) => {
                return set(
                  (child.marks || []).filter((cMrk) => !orphanedMarks.includes(cMrk)),
                  [{_key: blk._key}, 'children', {_key: child._key}, 'marks'],
                )
              }),
              description: `Block with _key '${blk._key}' contains marks (${orphaned}) not supported by the current content model.`,
              action: 'Remove invalid marks',
              item: blk,

              i18n: {
                description: 'inputs.portable-text.invalid-value.orphaned-marks.description',
                action: 'inputs.portable-text.invalid-value.orphaned-marks.action',
                values: {key: blk._key, orphanedMarks},
              },
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

            i18n: {
              description: 'inputs.portable-text.invalid-value.empty-children.description',
              action: 'inputs.portable-text.invalid-value.empty-children.action',
              values: {key: blk._key},
            },
          }
          return true
        }
        // Test every child
        if (
          textBlock.children.some((child, cIndex: number) => {
            if (!isPlainObject(child)) {
              resolution = {
                patches: [unset([{_key: blk._key}, 'children', cIndex])],
                description: `Child at index '${cIndex}' in block with key '${blk._key}' is not an object.`,
                action: 'Remove the item',
                item: blk,

                i18n: {
                  description: 'inputs.portable-text.invalid-value.non-object-child.description',
                  action: 'inputs.portable-text.invalid-value.non-object-child.action',
                  values: {key: blk._key, index: cIndex},
                },
              }
              return true
            }

            if (!child._key || typeof child._key !== 'string') {
              const newChild = {...child, _key: keyGenerator()}
              resolution = {
                patches: [set(newChild, [{_key: blk._key}, 'children', cIndex])],
                description: `Child at index ${cIndex} is missing required _key in block with _key ${blk._key}.`,
                action: 'Set a new random _key on the object',
                item: blk,

                i18n: {
                  description: 'inputs.portable-text.invalid-value.missing-child-key.description',
                  action: 'inputs.portable-text.invalid-value.missing-child-key.action',
                  values: {key: blk._key, index: cIndex},
                },
              }
              return true
            }
            // Verify that children have valid types
            if (!child._type) {
              resolution = {
                patches: [unset([{_key: blk._key}, 'children', {_key: child._key}])],
                description: `Child with _key '${child._key}' in block with key '${blk._key}' is missing '_type' property.`,
                action: 'Remove the object',
                item: blk,

                i18n: {
                  description: 'inputs.portable-text.invalid-value.missing-child-type.description',
                  action: 'inputs.portable-text.invalid-value.missing-child-type.action',
                  values: {key: blk._key, childKey: child._key},
                },
              }
              return true
            }

            if (!validChildTypes.includes(child._type)) {
              resolution = {
                patches: [unset([{_key: blk._key}, 'children', {_key: child._key}])],
                description: `Child with _key '${child._key}' in block with key '${blk._key}' has invalid '_type' property (${child._type}).`,
                action: 'Remove the object',
                item: blk,

                i18n: {
                  description:
                    'inputs.portable-text.invalid-value.disallowed-child-type.description',
                  action: 'inputs.portable-text.invalid-value.disallowed-child-type.action',
                  values: {key: blk._key, childKey: child._key, childType: child._type},
                },
              }
              return true
            }

            // Verify that spans have .text property that is a string
            if (child._type === types.span.name && typeof child.text !== 'string') {
              resolution = {
                patches: [
                  set({...child, text: ''}, [{_key: blk._key}, 'children', {_key: child._key}]),
                ],
                description: `Child with _key '${child._key}' in block with key '${blk._key}' has missing or invalid text property!`,
                action: `Write an empty text property to the object`,
                item: blk,

                i18n: {
                  description: 'inputs.portable-text.invalid-value.invalid-span-text.description',
                  action: 'inputs.portable-text.invalid-value.invalid-span-text.action',
                  values: {key: blk._key, childKey: child._key},
                },
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
