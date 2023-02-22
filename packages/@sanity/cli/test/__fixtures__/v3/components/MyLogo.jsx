import React from 'react'
import styles from './MyLogo.module.css'

// Since bundles are compressed and symbols obfuscated,
// use an uncommon symbol taht we can use to find the string in tests
const mode = `⏧ ${process.env.SANITY_STUDIO_MODE}`

// For testing environment variables from dotenv (.env) _and_ regular env vars
const fromDotEnv = process.env.SANITY_STUDIO_FROM_DOTENV || 'notset'
const fromActualEnv = process.env.SANITY_STUDIO_FROM_ACTUAL_ENV || 'notset'

/**
 * Test that we can import CSS modules and that they get bundled
 *
 * @internal
 */
export function MyLogo() {
  return (
    <div
      className={styles.logo}
      data-env-from-dot-env={fromDotEnv}
      data-env-from-actual-env={fromActualEnv}
    >
      {mode}
    </div>
  )
}
