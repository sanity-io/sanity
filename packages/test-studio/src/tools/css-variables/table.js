import classNames from 'classnames'
import React, {useState} from 'react'
import Button from 'part:@sanity/components/buttons/default'

import styles from './table.css'

export function CSSVariablesTable({name, vars}) {
  const [showDeprecated, setShowDeprecated] = useState(false)
  const deprecatedLength = vars.filter(item => item.deprecated).length

  return (
    <section className={styles.root}>
      <header className={styles.header}>
        <div className={styles.name}>{name}</div>
        {deprecatedLength > 0 && (
          <div className={styles.actions}>
            <Button
              bleed
              color="white"
              type="button"
              onClick={() => setShowDeprecated(val => !val)}
            >
              Toggle {deprecatedLength} deprecated
            </Button>
          </div>
        )}
      </header>

      <div className={styles.content}>
        {vars
          .filter(item => (showDeprecated ? true : !item.deprecated))
          .map(item => (
            <div
              className={classNames(styles.row, item.deprecated && styles.deprecated)}
              data-name={item.name}
              data-type={item.type}
              key={item.name}
            >
              <div className={styles.varValue}>
                <div />
              </div>
              <div className={styles.varName}>{item.name}</div>
              <div className={styles.varContent} />
            </div>
          ))}
      </div>
    </section>
  )
}
