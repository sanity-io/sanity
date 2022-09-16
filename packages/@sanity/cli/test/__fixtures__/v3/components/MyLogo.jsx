import React from 'react'
import styles from './MyLogo.module.css'

// Test that we can import CSS modules and that they get bundled
export function MyLogo() {
  return <div className={styles.logo}>Hello</div>
}
