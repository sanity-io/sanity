import React from 'react'
import PropTypes from 'prop-types'
import Downshift from 'downshift'
import { nanoid } from 'nanoid'
import matchSorter from 'match-sorter'
import styled from '@emotion/styled'

import client from 'part:@sanity/base/client'
import DefaultLabel from 'part:@sanity/components/labels/default'
import PatchEvent, { set, unset } from 'part:@sanity/form-builder/patch-event'

// The patch function that sets data on the document
const createPatchFrom = value => PatchEvent.from(value === '' ? unset() : set(value))

const BaseMenu = styled('ul')(
  {
    padding: 0,
    marginTop: 0,
    position: 'absolute',
    backgroundColor: 'white',
    width: '100%',
    maxHeight: '20rem',
    overflowY: 'auto',
    overflowX: 'hidden',
    outline: '0',
    transition: 'opacity .1s ease',
    borderRadius: '0 0 .28571429rem .28571429rem',
    boxShadow: '0 2px 3px 0 rgba(34,36,38,.15)',
    borderColor: '#96c8da',
    borderTopWidth: '0',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderStyle: 'solid',
    zIndex: 2
  },
  ({isOpen}) => ({
    border: isOpen ? null : 'none',
  }),
)

const ControllerButton = styled('button')({
  backgroundColor: 'transparent',
  border: 'none',
  position: 'absolute',
  right: 0,
  top: 0,
  cursor: 'pointer',
  width: 47,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  justifyContent: 'center',
  alignItems: 'center',
})

const Item = styled('li')(
  {
    position: 'relative',
    cursor: 'pointer',
    display: 'block',
    border: 'none',
    height: 'auto',
    textAlign: 'left',
    borderTop: 'none',
    lineHeight: '1em',
    color: 'rgba(0,0,0,.87)',
    fontSize: '1rem',
    textTransform: 'none',
    fontWeight: '400',
    boxShadow: 'none',
    padding: '.8rem 1.1rem',
    whiteSpace: 'normal',
    wordWrap: 'normal',
  },
  ({isActive, isSelected}) => {
    const styles = []
    if (isActive) {
      styles.push({
        color: 'rgba(0,0,0,.95)',
        background: 'rgba(0,0,0,.03)',
      })
    }
    if (isSelected) {
      styles.push({
        color: 'rgba(0,0,0,.95)',
        fontWeight: '700',
      })
    }
    return styles
  },
)

const Menu = React.forwardRef((props, ref) => (
  <BaseMenu ref={ref} {...props} />
))

function ArrowIcon({isOpen}) {
  return (
    <svg
      viewBox="0 0 20 20"
      preserveAspectRatio="none"
      width={9}
      fill="transparent"
      stroke="#303030"
      strokeWidth="3px"
      transform={isOpen ? 'rotate(180)' : undefined}
    >
      <path d="M1,6 L10,15 L19,6" />
    </svg>
  )
}

class MultiDownshift extends React.Component {
  state = {
    selectedItems: this.getInitialSelectedItems()
  }

  getInitialSelectedItems() {
    let {
      initialSelectedItems
    } = this.props
    if(initialSelectedItems) {
      initialSelectedItems = initialSelectedItems.map(
        item => ({
          title: item.title,
          value: item.value
        })
      )
    } else {
      initialSelectedItems = []
    }
    return initialSelectedItems
  }

  stateReducer = (state, changes) => {
    switch (changes.type) {
      case Downshift.stateChangeTypes.keyDownEnter:
      case Downshift.stateChangeTypes.clickItem:
        return {
          ...changes,
          highlightedIndex: state.highlightedIndex,
          isOpen: true,
          inputValue: '',
        }
      default:
        return changes
    }
  }

  handleSelection = (selectedItem, downshift) => {
    const callOnChange = () => {
      const {onSelect, onChange} = this.props
      const {selectedItems} = this.state
      if (onSelect) {
        onSelect(selectedItems, this.getStateAndHelpers(downshift))
      }
      if (onChange) {
        onChange(selectedItems, this.getStateAndHelpers(downshift))
      }
    }
    const matchItem = this.state.selectedItems.filter(i => i.value == selectedItem.value)
    if (matchItem.length > 0) {
      this.removeItem(selectedItem, callOnChange)
    } else {
      this.addSelectedItem(selectedItem, callOnChange)
    }
  }

  removeItem = (item, cb) => {
    const {onChange} = this.props
    const {selectedItems} = this.state
    const newSelection = selectedItems.filter(i => i.value !== item.value)
    this.setState(({selectedItems}) => {
      return {
        selectedItems: newSelection,
      }
    }, cb)
    onChange(newSelection)
  }

  addSelectedItem = (item, cb) => {
    const {onChange} = this.props
    const {selectedItems} = this.state
    const newSelection = selectedItems.filter(i => i !== item)
    this.setState(
      ({selectedItems}) => ({
        selectedItems: [...selectedItems, item],
      }),
      cb,
    )
    onChange(newSelection)
  }

  getRemoveButtonProps = ({onClick, item, ...props} = {}) => {
    return {
      onClick: e => {
        // TODO: use something like downshift's composeEventHandlers utility instead
        onClick && onClick(e)
        e.stopPropagation()
        this.removeItem(item)
      },
      ...props,
    }
  }

  getStateAndHelpers(downshift) {
    const {selectedItems} = this.state
    const {getRemoveButtonProps, removeItem} = this
    return {
      getRemoveButtonProps,
      removeItem,
      selectedItems,
      ...downshift,
    }
  }
  render() {
    const {render, children = render, ...props} = this.props
    return (
      <Downshift
        {...props}
        stateReducer={this.stateReducer}
        onChange={this.handleSelection}
        selectedItems={this.getInitialSelectedItems()}
        selectedItem={null}
      >
        {downshift => children(this.getStateAndHelpers(downshift))}
      </Downshift>
    )
  }
}

// The custom input component
class TagPicker extends React.Component {
  state = {tags: []}

  static propTypes = {
    type: PropTypes.shape({
      title: PropTypes.string
    }).isRequired,
    level: PropTypes.number,
    focusPath: PropTypes.array,
    onFocus: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    onBlur: PropTypes.func.isRequired,
  }

  _inputElement = React.createRef()
  input = React.createRef()

  focus() {
    if (this._inputElement.current) {
      this._inputElement.current.focus()
    }
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  componentDidMount() {
    const query = '*[_type == "tagOption" && defined(value)] {title, value} | order(title asc)'
    const getTags = () => {
      client.fetch(query)
      .then(tagOptions => {
        const tags = tagOptions.map(tag => ({
          title: tag.title,
          value: tag.value.current
        }))
        this.setState({tags})
      })
    }
    getTags()
    this.subscription = client.listen(query, '', {includeResult: false})
      .subscribe(update => {
        getTags()
    })
  }

  unsubscribe() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  itemToString = item => (item ? item.title : '')
  handleChange = selectedItems => {
    const {onChange} = this.props
    onChange(
      createPatchFrom(
        selectedItems.map(
          item => ({
            _key: nanoid(),
            _type: 'tag',
            title: item.title,
            value: item.value
          })
        )
      )
    )
  }

  getItems = filter => {
    const {tags} = this.state
    return filter
      ? matchSorter(tags, filter, {
          keys: ['title'],
        })
      : tags
  }

  render() {
    const {
      document,
      level,
      value,
      focusPath,
      onFocus,
      onBlur,
      onChange
    } = this.props

    const { inputComponent, ...type } = this.props.type

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column'
        }}
        >
        <DefaultLabel level={level}>{type.title}</DefaultLabel>
        <MultiDownshift
          initialSelectedItems={value}
          onChange={this.handleChange}
          itemToString={this.itemToString}
          >
          {({
            getInputProps,
            getToggleButtonProps,
            getMenuProps,
            getRemoveButtonProps,
            removeItem,
            onChange,
            isOpen,
            inputValue,
            selectedItems,
            getItemProps,
            highlightedIndex,
            toggleMenu,
            initialSelectedItems
          }) => (
            <div style={{width: '100%', margin: 'auto', position: 'relative'}}>
              <div
                style={{
                  cursor: 'pointer',
                  position: 'relative',
                  borderRadius: '2px',
                  borderTopRadius: 2,
                  borderBottomRightRadius: isOpen ? 0 : 2,
                  borderBottomLeftRadius: isOpen ? 0 : 2,
                  padding: 10,
                  paddingRight: 50,
                  borderColor: '#96c8da',
                  borderTopWidth: 1,
                  borderRightWidth: 1,
                  borderBottomWidth: 1,
                  borderLeftWidth: 1,
                  borderStyle: 'solid',
                }}
                onClick={() => {
                  toggleMenu()
                  !isOpen && this.input.current.focus()
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  {selectedItems.length > 0
                    ? selectedItems.map((item, index) => (
                        <div
                          key={index}
                          style={{
                            margin: 2,
                            paddingTop: 2,
                            paddingBottom: 2,
                            paddingLeft: 8,
                            paddingRight: 8,
                            display: 'inline-block',
                            wordWrap: 'none',
                            backgroundColor: '#ccc',
                            borderRadius: 2,
                          }}
                        >
                          <div
                            style={{
                              display: 'grid',
                              gridGap: 6,
                              gridAutoFlow: 'column',
                              alignItems: 'center',
                            }}
                          >
                            <span>{item.title}</span>
                            <button
                              {...getRemoveButtonProps({item})}
                              style={{
                                cursor: 'pointer',
                                lineHeight: 0.8,
                                border: 'none',
                                backgroundColor: 'transparent',
                                padding: '0',
                                fontSize: '16px',
                              }}
                            >
                              𝘅
                            </button>
                          </div>
                        </div>
                      ))
                    : 'Select a tag'}
                  <input
                    {...getInputProps({
                      ref: this.input,
                      onKeyDown(event) {
                        if (event.key === 'Backspace' && !inputValue) {
                          removeItem(selectedItems[selectedItems.length - 1])
                        }
                      },
                      style: {
                        border: 'none',
                        marginLeft: 6,
                        flex: 1,
                        fontSize: 14,
                        minHeight: 27,
                      }
                      })
                    }
                  />
                </div>
                <ControllerButton
                  {...getToggleButtonProps({
                    // prevents the menu from immediately toggling
                    // closed (due to our custom click handler above).
                    onClick(event) {
                      event.stopPropagation()
                    },
                  })}
                >
                  <ArrowIcon isOpen={isOpen} />
                </ControllerButton>
              </div>
              <Menu {...getMenuProps({isOpen})}>
                {isOpen
                  ? this.getItems(inputValue).map((item, index) => (
                    <Item
                      key={index}
                      {...getItemProps({
                        item,
                        index,
                        isActive: highlightedIndex === index,
                        isSelected: selectedItems.filter(i => i.value == item.value).length > 0,
                      })}
                    >
                      {item.title}
                    </Item>
                  ))
                  : null}
              </Menu>
            </div>
          )}
        </MultiDownshift>
      </div>
    )
  }
}

export default TagPicker
