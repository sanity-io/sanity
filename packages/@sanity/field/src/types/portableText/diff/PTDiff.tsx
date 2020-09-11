import React, {useMemo} from 'react'

import {DiffComponent, ObjectDiff, ObjectSchemaType} from '../../../diff'
import Block from './components/Block'
import {createChildMap, prepareDiffForPortableText} from './helpers'

import styles from './PTDiff.css'

export const PTDiff: DiffComponent<ObjectDiff> = function PTDiff({
  diff,
  schemaType
}: {
  diff: ObjectDiff
  schemaType: ObjectSchemaType
}) {
  const _diff = prepareDiffForPortableText(diff)
  const childMap = useMemo(() => createChildMap(_diff, schemaType), [diff])
  const portableTextDiff = useMemo(() => <Block diff={_diff} childMap={childMap} />, [diff])
  const classNames = [styles.root, styles[_diff.action]].join(' ')
  return <div className={classNames}>{portableTextDiff}</div>
}
