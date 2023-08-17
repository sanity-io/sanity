import {Button, Grid} from '@sanity/ui'
import React, {useCallback, useEffect, useRef} from 'react'
import {defineField, ObjectInputProps, Path, set, unset} from 'sanity'

/**
 * This document renders a custom input component which patches `testValue.b` whenever the value
 * of `testValue.a` has changed (or is falsy).
 *
 * This is used to test cases where custom input components that patch documents (based on document values)
 * can cause issues when trying to restore previous revisions.
 *
 * To reproduce:
 * - Create a new document, give it a title ('Title 1'), click the 'Set random value for A' button and publish
 * - Update the title ('Title 2'), click the 'Set random value for A' button and publish
 * - Open document history and try restore the document at 'Title 1'
 */
export default {
  name: 'customInputsWithPatches',
  title: 'Custom input with patches',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),

    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{type: 'block'}],
    }),

    defineField({
      name: 'testValue',
      title: 'Test value',
      type: 'object',
      fields: [
        {
          name: 'a',
          title: 'A',
          type: 'string',
          readOnly: true,
        },
        {
          name: 'b',
          title: 'B',
          type: 'string',
          readOnly: true,
          description:
            'This value will be generated right after A is updated. Clearing A will also clear this value.',
        },
      ],
      components: {
        input: CustomComponent,
      },
    }),
  ],
}

export function CustomComponent(props: ObjectInputProps) {
  const {onChange, value} = props

  const valueA = value?.a
  const valueB = value?.b
  const prevA = useRef(valueA)

  const clearValue = useCallback(
    (path: Path) => {
      onChange(unset(path))
    },
    [onChange],
  )

  const setRandomValue = useCallback(
    (path: Path) => {
      const randomString = Math.random().toString()
      onChange(set(randomString, path))
    },
    [onChange],
  )

  /**
   * Set B when A has changed, and unset B when A is falsy.
   */
  useEffect(() => {
    if (!valueA && valueB) {
      clearValue(['b'])
      prevA.current = valueA
      return
    }

    if (valueA === prevA.current) return

    setRandomValue(['b'])
    prevA.current = valueA
  }, [clearValue, setRandomValue, valueA, valueB])

  return (
    <>
      <Grid columns={[2]} gap={2}>
        <Button
          // eslint-disable-next-line react/jsx-no-bind
          onClick={() => setRandomValue(['a'])}
          text="Set random value for A"
        />
        <Button
          // eslint-disable-next-line react/jsx-no-bind
          onClick={() => clearValue(['a'])}
          text="Clear A"
          tone="critical"
        />
      </Grid>

      {props.renderDefault(props)}
    </>
  )
}
