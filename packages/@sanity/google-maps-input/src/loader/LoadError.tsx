import * as React from 'react'
import styles from './LoadError.css'

type Props = {error: Error; isAuthError: false} | {isAuthError: true}

export function LoadError(props: Props) {
  return (
    <div className={styles.card}>
      <header className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Google Maps failed to load</h2>
      </header>

      <div className={styles.cardContent}>
        {props.isAuthError ? (
          <AuthError />
        ) : (
          <>
            <h3>Error details:</h3>
            <pre>
              <code>{props.error?.message}</code>
            </pre>
          </>
        )}
      </div>
    </div>
  )
}

function AuthError() {
  return (
    <>
      <p>The error appears to be related to authentication</p>
      <p>Common causes include:</p>
      <ul>
        <li>Incorrect API key</li>
        <li>Referer not allowed</li>
        <li>Missing authentication scope</li>
      </ul>
      <p>Check the browser developer tools for more information.</p>
    </>
  )
}
