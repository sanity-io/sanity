import React from 'react'
import {DiffFromTo} from '../../../diff'
import {DiffComponent, StringDiff} from '../../../types'
import {StringPreview} from '../../string/preview'

export const UrlFieldDiff: DiffComponent<StringDiff> = ({diff, schemaType}) => {
  return <DiffFromTo diff={diff} schemaType={schemaType} previewComponent={StringPreview} />
}
