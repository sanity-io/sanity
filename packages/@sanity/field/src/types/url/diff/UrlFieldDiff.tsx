import React from 'react'
import {StringDiff, DiffComponent, Change} from '../../../diff'
import {StringPreview} from '../../string/preview'

export const UrlFieldDiff: DiffComponent<StringDiff> = ({diff, schemaType}) => {
  return <Change diff={diff} schemaType={schemaType} previewComponent={StringPreview} />
}
