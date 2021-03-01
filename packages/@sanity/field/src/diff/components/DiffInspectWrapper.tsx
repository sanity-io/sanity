import React, {useCallback, useEffect, useRef, useState} from 'react'
import {pathToString} from '../../paths'
import {FieldChangeNode} from '../../types'
import styles from './DiffInspectWrapper.css'

interface Props {
  children: React.ReactNode
  change: FieldChangeNode
  className: string
}

export function DiffInspectWrapper({children, className, change}: Props): React.ReactElement {
  const isHovering = useRef(false)
  const [isInspecting, setIsInspecting] = useState(false)

  const toggleInspect = useCallback(() => setIsInspecting((state) => !state), [setIsInspecting])
  const handleMouseEnter = useCallback(() => (isHovering.current = true), [])
  const handleMouseLeave = useCallback(() => (isHovering.current = false), [isHovering])

  useEffect(() => {
    function onKeyDown(evt: KeyboardEvent) {
      const {metaKey, key} = evt
      if (metaKey && key === 'i' && isHovering.current) {
        toggleInspect()
      }
    }

    window.addEventListener('keydown', onKeyDown, false)
    return () => window.removeEventListener('keydown', onKeyDown, false)
  }, [toggleInspect])

  return (
    <div className={className} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {isInspecting ? <DiffInspector change={change} /> : children}
    </div>
  )
}

function DiffInspector({change}: {change: FieldChangeNode}): React.ReactElement | null {
  return (
    <>
      <div className={styles.meta}>
        {printMeta({
          path: pathToString(change.path),
          fromIndex: change.itemDiff?.fromIndex,
          toIndex: change.itemDiff?.toIndex,
          hasMoved: change.itemDiff?.hasMoved,
          action: change.diff.action,
          isChanged: change.diff.isChanged,
        })}
      </div>
      <pre className={styles.fromJson}>{jsonify(change.diff.fromValue)}</pre>
      <div className={styles.arrow}>↓</div>
      <pre className={styles.toJson}>{jsonify(change.diff.toValue)}</pre>
    </>
  )
}

function jsonify(value: unknown) {
  if (typeof value === 'undefined') {
    return 'undefined'
  }

  return JSON.stringify(value, null, 2)
}

function printMeta(keys: Record<string, unknown>) {
  const lines: string[] = []
  Object.entries(keys).forEach(([key, value]) => {
    if (typeof value !== 'undefined' && value !== null) {
      lines.push(`${key}: ${value}`)
    }
  })

  return lines.join('\n')
}
