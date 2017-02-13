/* eslint-disable import/no-extraneous-dependencies */
import React, {PropTypes} from 'react'
import TagInput from 'part:@sanity/components/tags/textfield'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import DefaultList from 'part:@sanity/components/lists/default'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import {get, uniqueId} from 'lodash'
import styles from './styles/ArrayOfStrings.css'
import Button from 'part:@sanity/components/buttons/default'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import TrashIcon from 'part:@sanity/base/trash-icon'

function move(arr, from, to) {
  const copy = arr.slice()
  const val = copy[from]
  copy.splice(from, 1)
  copy.splice(to, 0, val)
  return copy
}

export default class ArrayOfStrings extends React.PureComponent {
  static propTypes = {
    type: FormBuilderPropTypes.type,
    value: PropTypes.arrayOf(PropTypes.string),
    level: PropTypes.number,
    onChange: PropTypes.func,
    description: PropTypes.string,
    focus: PropTypes.bool
  }

  static contextTypes = {
    formBuilder: PropTypes.object
  }

  state = {
    hasFocus: this.props.focus
  }

  handleRemoveItem = index => {
    const nextVal = this.props.value.slice()
    nextVal.splice(index, 1)
    this.props.onChange({
      patch: {
        type: 'set',
        value: nextVal
      }
    })
  }

  handleFocus = () => {
    this.setState({
      hasFocus: true
    })
  }

  handleBlur = () => {
    this.setState({
      hasFocus: false
    })
  }

  handleAddString = string => {
    const {value, onChange} = this.props

    onChange({
      patch: {
        type: 'set', value: (value || []).concat(string)
      }
    })
  }

  handleAddBtnClick = () => {
    this.handleAddString('')
  }

  handleInputChange = event => {
    const {value, onChange} = this.props
    const i = event.target.getAttribute('data-index')

    const nextValue = value.slice()
    nextValue[i] = event.target.value

    onChange({
      patch: {
        type: 'set', value: nextValue
      }
    })
  }

  handleRemove = event => {
    const index = event.currentTarget.getAttribute('data-index')
    const {value, onChange} = this.props

    const nextValue = value.slice()

    nextValue.splice(index, 1)

    onChange({
      patch: {
        type: 'set', value: nextValue
      }
    })
  }

  handleMove = event => {
    const {value, onChange} = this.props
    const {oldIndex, newIndex} = event
    onChange({
      patch: {
        type: 'set', value: move(value, oldIndex, newIndex)
      }
    })
  }

  renderItem = item => {
    const id = uniqueId('ArrayStringInput')
    return (
      <div className={styles.item}>
        <label className={styles.inputLabel} htmlFor={id}>Value</label>
        <DefaultTextInput
          value={item.value}
          className={styles.input}
          onChange={this.handleInputChange}
          onFocus={this.handleInputFocus}
          data-index={item.index}
          id={id}
        />
        <Button
          kind="simple"
          className={styles.deleteButton}
          color="danger"
          icon={TrashIcon}
          title="Delete"
          data-index={item.index}
          onClick={this.handleRemove}
          onMouseDown={this.handleMouseDown}
        />
      </div>
    )
  }

  renderList(value) {
    const {type} = this.props
    const sortable = get(type, 'options.sortable') !== false
    const items = value.map((item, i) => {
      return {title: item, value: item, index: i}
    })

    return (
      <DefaultList
        items={items}
        renderItem={this.renderItem}
        onSelect={this.handleItemEdit}
        sortable={sortable}
        onSortEnd={this.handleMove}
        useDragHandle
        decoration="divider"
        focusedItem={this.state.lastEditedItem}
      />
    )
  }

  render() {
    const {type, value, level, description} = this.props
    const {hasFocus} = this.state

    if (get(type, 'options.layout') === 'tags') {
      return (
        <TagInput
          label={type.title}
          level={level}
          description={description}
          tags={value || []}
          onRemoveTag={this.handleRemoveItem}
          onAddTag={this.handleAddString}
          focus={hasFocus}
        />
      )
    }

    return (
      <Fieldset legend={type.title} description={type.description} level={level}>
        <div className={styles.root}>
          {
            value && value.length > 0 && (
              <div className={styles.list}>
                {this.renderList(value)}
              </div>
            )
          }
          <div className={styles.functions}>
            <Button onClick={this.handleAddBtnClick} className={styles.addButton} color="primary">
              Add
            </Button>
          </div>
        </div>
      </Fieldset>
    )
  }
}
