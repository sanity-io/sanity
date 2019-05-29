import React from 'react'
import styles from './styles/MissingDocumentTypesMessage.css'

export default function MissingDocumentTypesMessage(props) {
  return (
    <div className={styles.root}>
      <h2>Empty schema</h2>
      <p>
        Your schema does not contain any document types. If it did, those types would be listed
        here.{' '}
        <a
          title="Schema documentation"
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.sanity.io/docs/content-studio/the-schema"
        >
          Read more about how to add schema types
        </a>
        .
      </p>
    </div>
  )
}
