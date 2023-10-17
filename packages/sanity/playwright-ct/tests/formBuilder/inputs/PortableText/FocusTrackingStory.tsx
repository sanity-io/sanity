/* eslint-disable react/jsx-no-bind */
import {Path, defineArrayMember, defineField, defineType} from '@sanity/types'
import React, {useEffect, useState} from 'react'
import {SanityDocument} from '@sanity/client'
import {TestWrapper} from '../../utils/TestWrapper'
import {TestForm} from '../../utils/TestForm'

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'body',
        of: [
          defineArrayMember({
            type: 'block',
            of: [
              defineArrayMember({
                type: 'object',
                name: 'inlineObjectWithTextProperty',
                fields: [
                  defineField({
                    type: 'string',
                    name: 'text',
                    components: {
                      input: (inputProps) => (
                        <div data-testid="inlineTextInputField">
                          {inputProps.renderDefault(inputProps)}
                        </div>
                      ),
                    },
                  }),
                ],
              }),
            ],
          }),
          defineArrayMember({
            type: 'object',
            name: 'testObjectBlock',
            fields: [{type: 'string', name: 'text'}],
            components: {
              input: (inputProps) => (
                <div data-testid="objectBlockInputField">
                  {inputProps.renderDefault(inputProps)}
                </div>
              ),
            },
          }),
        ],
      }),
    ],
  }),
]

export function FocusTrackingStory({
  focusPath: focusPathFromProps,
  document,
}: {
  focusPath?: Path
  document?: SanityDocument
}) {
  const [focusPath, setFocusPath] = useState<Path>(focusPathFromProps || [])
  useEffect(() => {
    ;(window as any).__setFocusPath = (path: Path) => {
      setFocusPath(path)
    }
    return () => {
      ;(window as any).__setFocusPath = undefined
    }
  }, [])
  return (
    <div data-focus-path={JSON.stringify(focusPath)}>
      <TestWrapper schemaTypes={SCHEMA_TYPES}>
        <TestForm document={document} focusPath={focusPath} />
      </TestWrapper>
    </div>
  )
}

export default FocusTrackingStory
