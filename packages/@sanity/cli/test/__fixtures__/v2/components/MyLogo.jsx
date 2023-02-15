import React from 'react'
import styles from './MyLogo.module.css'

const fromDotEnv = process.env.SANITY_STUDIO_FROM_DOTENV || 'notset'

// Test that we can import CSS modules and that they get bundled
export function MyLogo() {
  return (
    <div data-from-dot-env={fromDotEnv} className={styles.logo}>
      Hello
    </div>
  )
}
