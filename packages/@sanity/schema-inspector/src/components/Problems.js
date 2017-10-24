// @flow
import React from 'react'
import Problem from './Problem'
import styles from './styles/Problems.css'

type Props = {
  path: string[],
  problems: Array<any>
}

export default class Problems extends React.Component<Props> {
  render() {
    const {problems, children, getPath} = this.props

    if (problems.length === 0) {
      return <div>{children}</div>
    }
    return (
      <div>
        <h4>{getPath().map(path => <span> › {path}</span>)}</h4>
        <ul className={styles.list}>
          {problems.map(problem => (
            <li className={styles[`listItem_${problem.severity}`]}>
              <Problem problem={problem} getPath={getPath} />
            </li>
          ))}
        </ul>
        {children}
      </div>
    )
  }
}
