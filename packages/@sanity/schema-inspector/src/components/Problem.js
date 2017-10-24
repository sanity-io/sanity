// @flow
import React from 'react'
import generateHelpUrl from '@sanity/generate-help-url'
import styles from './styles/Problem.css'

type Props = {
  path: string[],
  problems: Array<any>
}

const SEVERITY_SYMBOLS = {
  error: '🚫',
  warning: '⚠️'
}

export default function Problem(props: Props) {
  const {problem} = props
  return (
    <div className={styles[problem.severity]}>
      {problem.message}
      .{' '}
      {problem.helpId && (
        <a href={generateHelpUrl(problem.helpId)}>Read more</a>
      )}
    </div>
  )
}
