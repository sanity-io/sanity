import classNames from 'classnames'
import styles from 'part:@sanity/components/buttons/default-style'
import Spinner from 'part:@sanity/components/loading/spinner'
import React from 'react'
import {ButtonComponent, ButtonProps} from './types'

interface ButtonComponentOpts {
  displayName: string
  defaultProps?: Record<string, unknown>
}

export interface ButtonState {
  focusSetFromOutside: boolean
}

export default function createButtonLike(
  as: ButtonComponent | 'button' | 'a',
  {displayName, defaultProps = {}}: ButtonComponentOpts
) {
  const Component = as as ButtonComponent

  // @todo: refactor to functional component
  return class ButtonLike extends React.Component<ButtonProps, ButtonState> {
    static displayName =
      displayName ||
      `ButtonLike(${
        typeof Component === 'string' ? Component : Component.displayName || Component.name
      })`

    static defaultProps = defaultProps

    _element: HTMLButtonElement | null = null

    state = {
      focusSetFromOutside: false,
    }

    focus() {
      if (this._element) {
        this.setState({focusSetFromOutside: true})
        this._element.focus()
      }
    }

    setRootElement = (el: HTMLButtonElement | null) => {
      this._element = el
    }

    handleBlur = (event: React.FocusEvent<HTMLButtonElement>) => {
      if (this.props.onBlur) {
        this.props.onBlur(event)
      }
    }

    handleInnerBlur = () => {
      this.setState({focusSetFromOutside: false})
    }

    // eslint-disable-next-line complexity
    render() {
      const {
        kind,
        inverted,
        color,
        icon: Icon,
        iconStatus,
        loading,
        className: classNameProp,
        children,
        disabled,
        padding = 'medium',
        bleed,
        selected,
        size,
        tone,
        ...restProps
      } = this.props

      const className = classNames(
        classNameProp,
        styles.root,
        kind && styles[kind],
        styles[`padding_${padding}`],
        inverted && styles.inverted,
        color && styles[`color__${color}`],
        size && styles[`size__${size}`],
        bleed && styles.bleed,
        disabled && styles.disabled,
        selected && styles.selected,
        loading && styles.loading
      )

      return (
        <Component
          {...restProps}
          className={className}
          data-icon-status={iconStatus}
          data-tone={tone}
          disabled={disabled || loading}
          ref={this.setRootElement}
          tabIndex={0}
          onBlur={this.handleBlur}
        >
          {/*
            To avoid visually annoying "tab-focus-styling" when clicking,
            we catch the focus styling with tabIndex -1.
            However, to avoid onBlur being called on an focused button (when focues from outside),
            we need to check that the focus is not set from outside. (with .focus() )
          */}
          <span
            className={styles.inner}
            tabIndex={this.state.focusSetFromOutside ? undefined : -1}
            onBlur={this.handleInnerBlur}
          >
            <span className={styles.content}>
              {loading && (
                <span className={styles.spinner}>
                  <Spinner inline />
                </span>
              )}

              {Icon && (
                <div className={styles.icon}>
                  <Icon />
                  {iconStatus && <span className={styles.iconStatus} />}
                </div>
              )}

              {children && <span className={styles.text}>{children}</span>}
            </span>
          </span>
        </Component>
      )
    }
  }
}
