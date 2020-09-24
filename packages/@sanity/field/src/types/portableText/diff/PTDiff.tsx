import React, {useMemo} from 'react'

import {DiffComponent, ObjectDiff, ObjectSchemaType} from '../../../diff'
import PortableText from './components/PortableText'
import {createPortableTextDiff} from './helpers'

import styles from './PTDiff.css'

export const PTDiff: DiffComponent<ObjectDiff> = function PTDiff({
  diff,
  schemaType
}: {
  diff: ObjectDiff
  schemaType: ObjectSchemaType
}) {
  const ptDiff = createPortableTextDiff(diff, schemaType)
  const portableTextDiff = useMemo(() => {
    if (ptDiff) {
      return <PortableText diff={ptDiff} schemaType={schemaType} />
    }
    return null
  }, [ptDiff, schemaType])
  const classNames = [styles.root, styles[diff.action]].join(' ')
  return <div className={classNames}>{portableTextDiff}</div>
}
