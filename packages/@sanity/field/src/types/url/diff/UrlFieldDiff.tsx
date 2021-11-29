import React from 'react'
import type {DiffComponent, StringDiff} from '../../../diff'
import {DiffFromTo} from '../../../diff'
import {StringPreview} from '../../string/preview'

export const UrlFieldDiff: DiffComponent<StringDiff> = ({diff, schemaType}) => {
  return <DiffFromTo diff={diff} schemaType={schemaType} previewComponent={StringPreview} />
}
