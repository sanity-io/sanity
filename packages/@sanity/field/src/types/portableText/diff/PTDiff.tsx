import React, {useMemo} from 'react'

import {DiffComponent, ObjectDiff, ObjectSchemaType} from '../../../diff'
import PortableText from './components/PortableText'
import {createPortableTextDiff} from './helpers'

import styles from './PTDiff.css'

export const PTDiff: DiffComponent<ObjectDiff> = function PTDiff({
  diff,
  schemaType,
}: {
  diff: ObjectDiff
  schemaType: ObjectSchemaType
}) {
  const ptDiff = useMemo(() => createPortableTextDiff(diff, schemaType), [diff, schemaType])
  const portableTextDiff = useMemo(() => <PortableText diff={ptDiff} schemaType={schemaType} />, [
    ptDiff,
    schemaType,
  ])
  const classNames = [styles.root, styles[diff.action]].join(' ')
  return <div className={classNames}>{portableTextDiff}</div>
}
