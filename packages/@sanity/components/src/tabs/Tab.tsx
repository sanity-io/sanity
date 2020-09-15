import React from 'react'

import styles from './Tab.css'

interface TabProps {
  'aria-controls': string
  id: string
  icon?: React.ComponentType<Record<string, unknown>>
  isActive?: boolean
  isFocused?: boolean
  label: React.ReactNode
  onClick: () => void
  onFocus?: () => void
}

interface State {
  isDOMFocused: boolean
}

// @todo: refactor to functional component
export default class Tab extends React.PureComponent<TabProps, State> {
  element: HTMLButtonElement | null = null
  focusTimeout?: NodeJS.Timer

  constructor(props: TabProps) {
    super(props)
    this.state = {isDOMFocused: false}
  }

  componentDidUpdate(prevProps: TabProps) {
    if (!prevProps.isFocused && this.props.isFocused) {
      if (!this.state.isDOMFocused) {
        this.focusTimeout = setTimeout(() => {
          if (this.element) this.element.focus()
        }, 0)
      }
    }
  }

  componentWillUnmount() {
    if (this.focusTimeout) {
      clearTimeout(this.focusTimeout)
      this.focusTimeout = undefined
    }
  }

  handleBlur = () => {
    this.setState({isDOMFocused: false})
  }

  handleFocus = () => {
    this.setState({isDOMFocused: true})

    if (this.props.onFocus) {
      this.props.onFocus()
    }
  }

  setElement = (element: HTMLButtonElement | null) => {
    this.element = element
  }

  render() {
    const {icon, id, isActive, label, onClick} = this.props

    return (
      <button
        aria-controls={this.props['aria-controls']}
        aria-selected={isActive ? 'true' : 'false'}
        className={isActive ? styles.isActive : styles.root}
        id={id}
        onClick={onClick}
        onBlur={this.handleBlur}
        onFocus={this.handleFocus}
        ref={this.setElement}
        role="tab"
        tabIndex={isActive ? 0 : -1}
        type="button"
      >
        <div tabIndex={-1}>
          {icon && <span className={styles.icon}>{React.createElement(icon)}</span>}{' '}
          <span className={styles.label}>{label}</span>
        </div>
      </button>
    )
  }
}
