import React from 'react'
import styles from './styles/PathSegments.css'

export const Type = ({children}) => (
  <span className={styles.type}>{children}</span>
)
export const Name = ({children}) => (
  <span className={styles.name}>{children}</span>
)
export const Static = ({children}) => (
  <span className={styles.staticPathSegment}>{children}</span>
)
