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
  className?: string
}

export function Change({
  layout = 'inline',
  diff,
  path,
  className,
  schemaType,
  previewComponent: PreviewComponent
}: ChangeProps): React.ReactElement {
  const containerClassName = className ? `${styles.root} ${className}` : styles.root
  const {fromValue, toValue, action} = diff
  const annotation = getAnnotationAtPath(diff, path || [])
  const color = useAnnotationColor(annotation)
  const colorStyle = color ? {background: color.background, color: color.text} : {}
  const description = `${getChangeVerb(diff)} by`

  if (action === 'unchanged') {
    return <PreviewComponent value={toValue} schemaType={schemaType} />
  }

  const from = hasValue(fromValue) ? (
    <DiffAnnotationTooltip
      as="del"
      className={styles.remove}
      annotation={annotation}
      style={colorStyle}
      description={description}
    >
      <PreviewComponent value={fromValue} schemaType={schemaType} />
    </DiffAnnotationTooltip>
  ) : (
    undefined
  )

  const to = hasValue(toValue) ? (
    <DiffAnnotationTooltip
      as="ins"
      className={styles.add}
      annotation={annotation}
      style={colorStyle}
      description={description}
    >
      <PreviewComponent value={toValue} schemaType={schemaType} />
    </DiffAnnotationTooltip>
  ) : (
    undefined
  )

  return (
    <div className={containerClassName}>
      <ChangeLayout from={from} to={to} layout={layout} />
    </div>
  )
}

function hasValue(value: unknown) {
  return value !== null && typeof value !== 'undefined' && value !== ''
}
