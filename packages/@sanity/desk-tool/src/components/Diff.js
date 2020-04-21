/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/jsx-filename-extension */
/* eslint-disable react/forbid-prop-types */
/* eslint-disable react/no-array-index-key */

/**
 *
 *
 *
 *
 *
 *
 *
 * HEADSUP: This is not in use, but keep for later reference
 *
 *
 *
 *
 *
 *
 *
 */
import PropTypes from 'prop-types'
import React from 'react'
import {diffJson} from 'diff'
import styles from './Diff.css'

function getDiffStatKey(part) {
  if (part.added) {
    return 'added'
  }
  if (part.removed) {
    return 'removed'
  }
  return 'neutral'
}

export default class Diff extends React.PureComponent {
  static defaultProps = {
    inputA: '',
    inputB: ''
  }

  static propTypes = {
    inputA: PropTypes.object,
    inputB: PropTypes.object
  }

  render() {
    const diff = diffJson(this.props.inputA, this.props.inputB)
    return (
      <pre>
        {diff.map((part, index) => (
          <span key={index} className={styles[getDiffStatKey(part)]}>
            {part.value}
          </span>
        ))}
      </pre>
    )
  }
}
