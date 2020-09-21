import React from 'react'
import {Path} from '@sanity/types'
import {PreviewComponent as IPreviewComponent} from '../../preview/types'
import {getAnnotationAtPath, useAnnotationColor} from '../annotations'
import {Diff, SchemaType} from '../../types'
import {getChangeVerb} from '../helpers'
import {FromTo} from './FromTo'
import {DiffAnnotationTooltip} from './DiffAnnotationTooltip'

import styles from './DiffFromTo.css'

interface ChangeProps {
  previewComponent: IPreviewComponent<any>
  diff: Diff
  schemaType: SchemaType
  path?: Path | string
  layout?: 'grid' | 'inline'
}

export function DiffFromTo({
  layout = 'inline',
  diff,
  path,
  schemaType,
  previewComponent: PreviewComponent
}: ChangeProps): React.ReactElement {
  const {fromValue, toValue, action} = diff
  const annotation = getAnnotationAtPath(diff, path || [])
  const color = useAnnotationColor(annotation)
  const description = getChangeVerb(diff)

  if (action === 'unchanged') {
    return <PreviewComponent color={color} value={toValue} schemaType={schemaType} />
  }

  const from = hasValue(fromValue) ? (
    <del className={styles.from}>
      <PreviewComponent color={color} value={fromValue} schemaType={schemaType} />
    </del>
  ) : (
    undefined
  )

  const to = hasValue(toValue) ? (
    <ins className={styles.to}>
      <PreviewComponent color={color} value={toValue} schemaType={schemaType} />
    </ins>
  ) : (
    undefined
  )

  return (
    <DiffAnnotationTooltip annotation={annotation} description={description}>
      <FromTo from={from} to={to} layout={layout} />
    </DiffAnnotationTooltip>
  )
}

function hasValue(value: unknown) {
  return value !== null && typeof value !== 'undefined' && value !== ''
}
