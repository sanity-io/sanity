/* eslint-disable complexity */

import {Modifier} from '@popperjs/core'
import classNames from 'classnames'
import React from 'react'
import ArrowKeyNavigation from 'boundless-arrow-key-navigation/build'
import styles from 'part:@sanity/components/selects/style-style'
import ArrowIcon from 'part:@sanity/base/angle-down-icon'
import CheckmarkIcon from 'part:@sanity/base/check-icon'
import {List} from 'part:@sanity/components/lists/default'
import Poppable from 'part:@sanity/components/utilities/poppable'

export interface StyleSelectItem {
  key?: string
  title?: string
  active?: boolean
}

interface StyleSelectProps {
  placeholder?: string
  disabled?: boolean
  onChange: (item: StyleSelectItem) => void
  onOpen: () => void
  onClose: () => void
  value?: StyleSelectItem[]
  renderItem: (item: StyleSelectItem) => React.ReactNode
  className?: string
  items: StyleSelectItem[]
  padding?: 'large' | 'default' | 'small' | 'none'
  transparent?: boolean
}

const modifiers = [
  {
    name: 'preventOverflow',
    options: {
      rootBoundary: 'viewport',
      padding: 0,
    },
  },
  {
    name: 'offset',
    options: {
      offset: [0, 0],
    },
  },
  {
    name: 'flip',
    options: {
      enabled: false,
    },
  },
  {
    name: 'maxHeight',
    enabled: true,
    phase: 'beforeWrite',
    requires: ['computeStyles'],
    fn(params) {
      const {state} = params
      const refElement = state.scrollParents.reference[0]
      if (refElement && (refElement as Node).nodeType === Node.ELEMENT_NODE) {
        const offsetHeight = (refElement as HTMLElement).offsetHeight
        state.styles.popper.maxHeight = `${offsetHeight - 3 * 16}px`
      }
    },
  } as Modifier<'maxHeight', any>,
]

const StyleSelectList = React.forwardRef(
  (props: {children: React.ReactNode}, ref: React.Ref<HTMLUListElement>) => (
    <List className={styles.list} ref={ref}>
      {props.children}
    </List>
  )
)

StyleSelectList.displayName = 'StyleSelectList'

class StyleSelect extends React.PureComponent<StyleSelectProps> {
  static defaultProps = {
    className: '',
    onChange: () => undefined,
    onOpen: () => undefined,
    onClose: () => undefined,
    items: [],
    padding: 'default',
    placeholder: undefined,
    transparent: false,
    value: undefined,
  }

  state = {
    showList: false,
  }

  buttonElement = React.createRef<HTMLButtonElement>()
  firstItemElement = React.createRef<HTMLDivElement>()
  keyboardNavigation = false
  menuHasKeyboardFocus = false

  handleItemClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    this.handleSelect(Number(event.currentTarget.dataset.index))
  }

  handleSelect = (index: number) => {
    const item = this.props.items[index]

    if (!item) return

    this.props.onChange(item)
    this.handleCloseList()
    this.keyboardNavigation = false
  }

  handleOpenList = () => {
    if (this.props.disabled) {
      return
    }

    this.setState({showList: true}, () => {
      this.menuHasKeyboardFocus = true
      this.keyboardNavigation = true

      if (this.firstItemElement.current) {
        this.firstItemElement.current.focus()
      }

      this.props.onOpen()
    })
  }

  handleCloseList = () => {
    if (this.buttonElement.current) {
      this.buttonElement.current.focus()
    }

    this.setState({showList: false}, () => {
      this.props.onClose()
    })
  }

  handleButtonClick = (event) => {
    if (this.state.showList) {
      this.handleCloseList()
    } else {
      this.handleOpenList()
    }

    this.keyboardNavigation = event.detail == 0
  }

  handleButtonKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key == 'Enter') {
      this.handleOpenList()
    }
  }

  handleButtonBlur = () => {
    if (this.state.showList && !this.menuHasKeyboardFocus && this.keyboardNavigation) {
      this.handleCloseList()
    }
  }

  handleMenuBlur = () => {
    this.menuHasKeyboardFocus = false
    if (this.buttonElement.current) {
      this.buttonElement.current.focus()
    }
    this.handleCloseList()
  }

  handleItemKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      event.stopPropagation()
      this.handleSelect(Number(event.currentTarget.dataset.index))
    }
  }

  render() {
    const {
      disabled,
      value,
      items,
      className: classNameProp,
      padding,
      placeholder,
      renderItem,
      transparent,
    } = this.props

    const {showList} = this.state
    const className = classNames(
      classNameProp,
      styles.root,
      transparent && styles.transparent,
      padding && styles[`padding_${padding}`]
    )

    return (
      <div
        className={className}
        onClick={this.handleButtonClick}
        onBlur={this.handleButtonBlur}
        onKeyPress={this.handleButtonKeyDown}
        tabIndex={0}
      >
        <button
          className={styles.button}
          disabled={disabled}
          ref={this.buttonElement}
          type="button"
        >
          <div className={styles.buttonInner}>
            <span className={styles.title}>
              {value && value.length > 1 && 'Multiple'}
              {value && value.length == 1 && value[0].title}
              {!value && placeholder}
            </span>
            <span className={styles.arrow}>
              <ArrowIcon />
            </span>
          </div>
        </button>

        {showList && (
          <Poppable
            onEscape={this.handleCloseList}
            modifiers={modifiers}
            onClickOutside={this.handleCloseList}
            popperClassName={styles.popper}
          >
            <>
              <ArrowKeyNavigation component={StyleSelectList}>
                {items.map((item, index) => {
                  const isSemiSelected = value && value.length > 1 && value.includes(item)
                  const isSelected = value && value.length === 1 && value[0].key == item.key
                  const _classNames = `
                    ${isSelected ? styles.itemSelected : styles.item}
                    ${isSemiSelected ? styles.itemSemiSelected : ''}
                  `

                  return (
                    <li key={`${item.key}_${String(index)}`}>
                      <div
                        className={_classNames}
                        data-index={index}
                        onClick={this.handleItemClick}
                        onKeyPress={this.handleItemKeyPress}
                        ref={index === 0 ? this.firstItemElement : undefined}
                        title={item.title}
                      >
                        <div className={styles.itemContent}>{renderItem(item)}</div>
                        <div className={styles.itemIcon}>
                          {(isSelected || isSemiSelected) && <CheckmarkIcon />}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ArrowKeyNavigation>
              <div tabIndex={0} onFocus={this.handleMenuBlur} />
            </>
          </Poppable>
        )}
      </div>
    )
  }
}

export default StyleSelect
