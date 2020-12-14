import {ChevronDownIcon} from '@sanity/icons'
import React from 'react'

import styles from './Details.css'

type DetailsProps = {
  isOpen?: boolean
  title?: React.ReactNode
}

type DetailsState = {
  isOpen: any
}

export default class Details extends React.Component<DetailsProps, DetailsState> {
  static defaultProps = {
    title: 'Details',
    isOpen: false,
  }

  constructor(props) {
    super(props)
    this.state = {
      isOpen: props.isOpen,
    }
  }

  handleToggle = () => {
    this.setState((prevState) => ({isOpen: !prevState.isOpen}))
  }

  render() {
    const {title, children} = this.props
    const {isOpen} = this.state

    return (
      <div className={styles.root} data-open={isOpen}>
        <button type="button" className={styles.headerButton} onClick={this.handleToggle}>
          <div className={styles.header}>
            <span className={styles.iconContainer}>
              <ChevronDownIcon />
            </span>
            <span className={styles.summary}>{title}</span>
          </div>
        </button>
        <div className={styles.content}>{children}</div>
      </div>
    )
  }
}
