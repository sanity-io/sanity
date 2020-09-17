import React, {useMemo} from 'react'

import {DiffComponent, ObjectDiff, ObjectSchemaType} from '../../../diff'
import Block from './components/Block'
import Experimental from './components/Experimental'
import {createChildMap, prepareDiffForPortableText} from './helpers'

import styles from './PTDiff.css'

export const PTDiff: DiffComponent<ObjectDiff> = function PTDiff({
  diff,
  schemaType
}: {
  diff: ObjectDiff
  schemaType: ObjectSchemaType
}) {
  const [ptDiff, experimentalDiff] = prepareDiffForPortableText(diff, schemaType)
  const childMap = useMemo(() => createChildMap(ptDiff, schemaType), [ptDiff, schemaType])
  const portableTextDiff = useMemo(() => <Block diff={ptDiff} childMap={childMap} />, [
    ptDiff,
    childMap
  ])
  const experimentalPortableTextDiff = useMemo(() => {
    if (experimentalDiff) {
      return (
        <Experimental
          diff={ptDiff}
          childMap={childMap}
          experimentalDiff={experimentalDiff}
          schemaType={schemaType}
        />
      )
    }
    return null
  }, [childMap, experimentalDiff, ptDiff, schemaType])
  const classNames = [styles.root, styles[diff.action]].join(' ')
  return (
    <div className={classNames}>
      {experimentalPortableTextDiff ? experimentalPortableTextDiff : portableTextDiff}
    </div>
  )
}
