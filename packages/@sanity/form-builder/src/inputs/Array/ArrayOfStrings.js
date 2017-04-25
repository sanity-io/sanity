import PropTypes from 'prop-types'
// @flow weak
/* eslint-disable import/no-extraneous-dependencies */
import React from 'react'
import {get, uniqueId} from 'lodash'
import TagInput from 'part:@sanity/components/tags/textfield'
import DefaultList from 'part:@sanity/components/lists/default'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import Button from 'part:@sanity/components/buttons/default'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import TrashIcon from 'part:@sanity/base/trash-icon'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import styles from './styles/ArrayOfStrings.css'
import PatchEvent, {set, unset} from '../../PatchEvent'

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
    hasFocus: PropTypes.bool
  }

  static contextTypes = {
    formBuilder: PropTypes.object
  }

  state = {
    hasFocus: this.props.hasFocus
  }

  set(nextValue : string[]) {
    const patch = nextValue.length === 0 ? unset() : set(nextValue)
    this.props.onChange(PatchEvent.from(patch))
  }

  setAt(index : number, nextItemValue : string) {
    this.set(this.props.value.map((item, i) => (i === index ? nextItemValue : item)))
  }

  removeAt(index : number) {
    this.set(this.props.value.filter((_, i) => i !== index))
  }

  append(value : string) {
    this.set((this.props.value || []).concat(value))
  }

  handleRemoveItem = (index : number) => {
    this.removeAt(index)
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

  handleAddItem = item => {
    this.append(item)
  }

  handleAddBtnClick = () => {
    this.append('')
  }

  handleInputChange = event => {
    const {target} = event
    this.setAt(Number(target.getAttribute('data-index')), target.value)
  }

  handleRemove = event => {
    this.removeAt(Number(event.currentTarget.getAttribute('data-index')))
  }

  handleMove = event => {
    const {value} = this.props
    const {oldIndex, newIndex} = event
    this.set(move(value, oldIndex, newIndex))
  }

  renderItem = item => {
    const id = uniqueId('ArrayStringInput')
    return (
      <div className={styles.item}>
        <label className={styles.inputLabel} htmlFor={id}>Value</label>
        <DefaultTextInput
          value={item.value}
          onChange={this.handleInputChange}
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
          onAddTag={this.handleAddItem}
          hasFocus={hasFocus}
        />
      )
    }

    return (
      <Fieldset legend={type.title} description={type.description} level={level} transparent>
        <div className={styles.root}>
          {
            value && value.length > 0 && (
              <div className={styles.list}>
                {this.renderList(value)}
              </div>
            )
          }
          <div className={styles.functions}>
            <Button onClick={this.handleAddBtnClick} className={styles.addButton}>
              Add
            </Button>
          </div>
        </div>
      </Fieldset>
    )
  }
}
