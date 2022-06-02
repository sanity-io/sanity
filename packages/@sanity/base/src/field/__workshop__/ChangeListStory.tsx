import {ObjectSchemaType} from '@sanity/types'
import {Card, Container} from '@sanity/ui'
import React, {useCallback, useMemo} from 'react'
import {useSchema} from '../../hooks'
import {ChangeList, DocumentChangeContext, DocumentChangeContextInstance} from '../diff'
import {ObjectDiff, StringDiff} from '../types'

export default function ChangeListStory() {
  const documentId = 'test'
  const documentType = 'author'
  const schema = useSchema()
  const schemaType = schema.get(documentType) as ObjectSchemaType

  const nameDiff: StringDiff = useMemo(
    () => ({
      type: 'string',
      action: 'changed',
      isChanged: true,
      fromValue: '',
      toValue: 'Test',
      annotation: {
        chunk: {
          index: 0,
          id: 'foo',
          type: 'editDraft',
          start: 0,
          end: 0,
          startTimestamp: new Date('2021-01-01').toJSON(),
          endTimestamp: new Date('2021-01-02').toJSON(),
          authors: new Set(['p27ewL8aM']),
          draftState: 'present',
          publishedState: 'missing',
        },
        timestamp: new Date('2021-01-02').toJSON(),
        author: 'p27ewL8aM',
      },
      segments: [],
    }),
    []
  )

  const diff: ObjectDiff = useMemo(
    () => ({
      type: 'object',
      action: 'changed',
      isChanged: true,
      fields: {
        name: nameDiff,
      },
      fromValue: {
        name: '',
      },
      toValue: {
        name: 'Test',
      },
      annotation: {
        chunk: {
          index: 0,
          id: 'foo',
          type: 'editDraft',
          start: 0,
          end: 0,
          startTimestamp: new Date('2021-01-01').toJSON(),
          endTimestamp: new Date('2021-01-02').toJSON(),
          authors: new Set(['p27ewL8aM']),
          draftState: 'present',
          publishedState: 'missing',
        },
        timestamp: new Date('2021-01-02').toJSON(),
        author: 'p27ewL8aM',
      },
    }),
    [nameDiff]
  )

  const FieldWrapper = useCallback((_props) => {
    // console.log('props', _props)
    return <Card>{_props.children}</Card>
  }, [])

  const documentContext: DocumentChangeContextInstance = useMemo(
    () => ({
      documentId,
      FieldWrapper,
      isComparingCurrent: true,
      rootDiff: diff,
      schemaType,
      value: {name: 'Test'},
    }),
    [diff, documentId, FieldWrapper, schemaType]
  )

  return (
    <Card height="fill" padding={[4, 5, 6, 7]} sizing="border" tone="transparent">
      <Container width={1}>
        <Card padding={4} radius={3}>
          <DocumentChangeContext.Provider value={documentContext}>
            <ChangeList diff={diff} schemaType={schemaType} />
          </DocumentChangeContext.Provider>
        </Card>
      </Container>
    </Card>
  )
}
