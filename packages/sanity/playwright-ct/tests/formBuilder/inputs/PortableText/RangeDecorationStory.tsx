/* eslint-disable max-nested-callbacks */
import {type EditorSelection, type RangeDecoration} from '@sanity/portable-text-editor'
import {defineArrayMember, defineField, defineType, type SanityDocument} from '@sanity/types'
import {type PropsWithChildren, useEffect, useMemo, useState} from 'react'
import {type InputProps, PortableTextInput, type PortableTextInputProps} from 'sanity'

import {TestForm} from '../../utils/TestForm'
import {TestWrapper} from '../../utils/TestWrapper'

export type DecorationData = {selection: EditorSelection; word: string}

const RangeDecorationTestComponent = (props: PropsWithChildren) => {
  return (
    <span style={{backgroundColor: 'yellow'}} data-testid="range-decoration">
      {props.children}
    </span>
  )
}

const CustomPortableTextInput = (
  props: PortableTextInputProps & {decorationData?: DecorationData[]},
) => {
  const {decorationData} = props
  const [rangeDecorationsState, setRangeDecorationsState] = useState<RangeDecoration[]>([])

  useEffect(() => {
    setRangeDecorationsState(
      (decorationData?.map((data) => ({
        component: RangeDecorationTestComponent,
        selection: data.selection,
        onMoved: (movedProps) => {
          const {newSelection, rangeDecoration} = movedProps
          setRangeDecorationsState((prev) =>
            prev.map((decoration) =>
              data.selection === rangeDecoration.selection
                ? {...decoration, selection: newSelection}
                : decoration,
            ),
          )
        },
        payload: {word: data.word},
      })) || []) as RangeDecoration[],
    )
  }, [decorationData])

  return <PortableTextInput {...props} rangeDecorations={rangeDecorationsState} />
}

export function RangeDecorationStory({
  document,
  decorationData,
}: {
  document?: SanityDocument
  decorationData?: DecorationData[]
}) {
  const schemaTypes = useMemo(
    () => [
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
              }),
            ],
            components: {
              input: (props: InputProps) => (
                <CustomPortableTextInput
                  {...(props as PortableTextInputProps)}
                  decorationData={decorationData}
                />
              ),
            },
          }),
        ],
      }),
    ],
    [decorationData],
  )

  return (
    <TestWrapper schemaTypes={schemaTypes}>
      <TestForm document={document} />
    </TestWrapper>
  )
}
