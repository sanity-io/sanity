import React from 'react'
import DefaultPane from 'part:@sanity/components/panes/default'
import styles from './styles/EmptyListPane.css'

export default function EmptyListPane(props) {
  return (
    <DefaultPane title="Empty schema" isScrollable={false} staticContent="&nbsp;">
      <div className={styles.root}>
        <div className={styles.message}>
          Your{' '}
          <a
            title="Schema documentation"
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.sanity.io/docs/content-studio/the-schema"
          >
            schema
          </a>{' '}
          does not contain any document types. If it did, those types would be listed here.
        </div>
      </div>
    </DefaultPane>
  )
}
