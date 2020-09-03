import React from 'react'

import {PortableText} from './PortableText'
import {createChildMap} from './helpers'

import styles from './PTDiff.css'
import {DiffComponent, ObjectDiff} from '../../../diff'

export const PTDiff: DiffComponent<ObjectDiff> = function PTDiff({diff, schemaType}) {
  const childMap = createChildMap(diff, schemaType)
  const isRemoved = diff.action === 'removed'
  const isAdded = diff.action === 'added'
  return (
    <>
      {/* Preview */}
      <div className={styles.root}>
        <PortableText blockDiff={diff} childMap={childMap} />
      </div>

      {/* Summary */}
      <ul className={styles.summary}>
        {isRemoved && <li>Removed portable text block</li>}
        {isAdded && <li>Added portable text block</li>}
        {Object.keys(childMap)
          .map(key => childMap[key])
          .map(mapEntry => {
            return mapEntry.summary.map((line, i) => (
              <li key={`summary-${mapEntry.child._key.concat(i.toString())}`}>{line}</li>
            ))
          })}
      </ul>
    </>
  )
}
