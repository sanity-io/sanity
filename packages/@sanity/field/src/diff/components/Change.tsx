import React from 'react'
import {Path} from '@sanity/types'
import {PreviewComponent as IPreviewComponent} from '../../preview/types'
import {getAnnotationAtPath, useAnnotationColor} from '../annotations'
import {Diff, SchemaType} from '../../types'
import {getChangeVerb} from '../helpers'
import {ChangeLayout} from './ChangeLayout'
import {DiffAnnotationTooltip} from './DiffAnnotationTooltip'

import styles from './Change.css'

interface ChangeProps {
  previewComponent: IPreviewComponent<any>
  diff: Diff
  schemaType: SchemaType
  path?: Path | string
  layout?: 'fluid' | 'fixed' | undefined
  direction?: 'horizontal' | 'vertical'
}

export function Change({
  layout,
  direction,
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
    <DiffAnnotationTooltip
      annotation={annotation}
      description={description}
      className={styles.annotation}
      data-layout={layout || 'fluid'}
    >
      <ChangeLayout from={from} to={to} layout={layout} direction={direction} />
    </DiffAnnotationTooltip>
  )
}

function hasValue(value: unknown) {
  return value !== null && typeof value !== 'undefined' && value !== ''
}
