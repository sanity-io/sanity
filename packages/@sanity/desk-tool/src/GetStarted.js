import React from 'react'
import styles from './styles/GetStarted.css'

const GetStarted = () => {
  return (
    <div className={styles.content}>
      <h1>Get started</h1>
      <p className={styles.lead}>
        Your schema needs a <code>type</code> or two for us to have anything to show here.
      </p>

      <p>
        Read our guide on how to get started with &nbsp;
        <a
          href="https://www.sanity.io/docs/content-studio/the-schema"
          target="_blank"
          rel="noopener noreferrer"
        >
          creating schemas
        </a>.
      </p>
    </div>
  )
}

export default GetStarted
