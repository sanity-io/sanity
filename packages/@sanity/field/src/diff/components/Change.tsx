import React from 'react'
import {Path} from '../../paths'
import {PreviewComponent as IPreviewComponent} from '../../preview/types'
import {DiffAnnotationTooltip, getAnnotationAtPath, useAnnotationColor} from '../annotations'
import {Diff, SchemaType} from '../../types'
import {getChangeVerb} from '../helpers'
import {ChangeLayout} from './ChangeLayout'

import styles from './Change.css'

interface ChangeProps {
  previewComponent: IPreviewComponent<any>
  diff: Diff
  schemaType: SchemaType
  path?: Path | string
  layout?: 'grid' | 'inline'
}

export function Change({
  layout = 'inline',
  diff,
  path,
  schemaType,
  previewComponent: PreviewComponent
}: ChangeProps): React.ReactElement {
  const {fromValue, toValue, action} = diff
  const annotation = getAnnotationAtPath(diff, path || [])
  const color = useAnnotationColor(annotation)
  const description = `${getChangeVerb(diff)} by`

  if (action === 'unchanged') {
    return <PreviewComponent value={toValue} schemaType={schemaType} />
  }

  const from = hasValue(fromValue) ? (
    <DiffAnnotationTooltip
      as="del"
      className={styles.from}
      annotation={annotation}
      description={description}
    >
      <PreviewComponent color={color} value={fromValue} schemaType={schemaType} />
    </DiffAnnotationTooltip>
  ) : (
    undefined
  )

  const to = hasValue(toValue) ? (
    <DiffAnnotationTooltip
      as="ins"
      className={styles.to}
      annotation={annotation}
      description={description}
    >
      <PreviewComponent color={color} value={toValue} schemaType={schemaType} />
    </DiffAnnotationTooltip>
  ) : (
    undefined
  )

  return <ChangeLayout from={from} to={to} layout={layout} />
}

function hasValue(value: unknown) {
  return value !== null && typeof value !== 'undefined' && value !== ''
}
