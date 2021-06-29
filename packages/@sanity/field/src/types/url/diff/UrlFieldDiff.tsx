import React from 'react'
import {DiffComponent, DiffFromTo, StringDiff} from '../../../diff'
import {StringPreview} from '../../string/preview'

export const UrlFieldDiff: DiffComponent<StringDiff> = ({diff, schemaType}) => {
  return <DiffFromTo diff={diff} schemaType={schemaType} previewComponent={StringPreview} />
}
