//@flow weak
import React, {PropTypes} from 'react'
import humanizeList from 'humanize-list'

import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import Button from 'part:@sanity/components/buttons/default'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import EditItemPopOver from 'part:@sanity/components/edititem/popover'
import EditItemFold from 'part:@sanity/components/edititem/fold'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'

import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import ValueForm from './ValueForm'
import ItemPreview from './ItemPreview'
import styles from './styles/Any.css'
import PatchEvent, {unset, set} from '../../PatchEvent'

function hasKeys(object, exclude = []) {
  for (const key in object) {
    if (!exclude.includes(key)) {
      return true
    }
  }
  return false
}

function isEmpty(value) {
  return value === undefined || !hasKeys(value, ['_type'])
}

function createProtoValue(type) {
  return {
    _type: type.name
  }
}

export default class AnyInput extends React.Component {
  static displayName = 'Any'

  static propTypes = {
    type: FormBuilderPropTypes.type,
    value: PropTypes.any,
    level: PropTypes.number,
    onChange: PropTypes.func
  }

  static defaultProps = {
    onChange() {}
  }

  state = {
    addItemField: null,
    isEditing: false
  }

  handleSetBtnClick = () => {
    const {type} = this.props
    if (type.of.length > 1) {
      this.setState({selectType: true})
      return
    }

    const item = createProtoValue(type.of[0])

    this.set(item)

    this.setState({
      selectType: false,
      isEditing: true
    })
  }

  set(nextValue) {
    const {onChange} = this.props
    onChange(PatchEvent.from(set(nextValue)))
  }

  unset() {
    const {onChange} = this.props
    onChange(PatchEvent.from(unset()))
  }

  handleClose = () => {
    const {value} = this.props
    if (isEmpty(value)) {
      this.unset(value)
    }
    this.setState({
      isEditing: false
    })
  }

  handleDropDownAction = menuItem => {
    const item = createProtoValue(menuItem.type)
    this.setState({isEditing: true})
    this.set(item)
  }

  removeItem() {
    const {onChange} = this.props
    onChange(PatchEvent.from(unset()))
  }

  renderSelectType() {
    const {type, value} = this.props

    const items = type.of.map((memberDef, i) => {
      return {
        title: memberDef.title || memberDef.type.name,
        index: `action${i}`,
        type: memberDef
      }
    })

    return (
      <DropDownButton items={items} color="primary" onAction={this.handleDropDownAction}>
        {value ? 'Replace with' : 'Select type'}
      </DropDownButton>
    )
  }

  handleChange = (event: PatchEvent) => {
    const {onChange} = this.props
    onChange(event)
  }

  handleEditValue = () => {
    this.setState({
      isEditing: true
    })
  }

  handleEnter = () => {
    this.setState({isEditing: false})
  }

  renderEditValueForm() {
    const {type, value} = this.props
    const memberType = this.getMemberType(value)

    // Reset level if a full screen modal
    const level = (type.options && type.options.editModal === 'fullscreen') ? 1 : this.props.level + 1

    const content = (
      <ValueForm
        focus
        type={memberType}
        level={level}
        value={value}
        onChange={this.handleChange}
        onEnter={this.handleEnter}
        onRemove={this.handleClearValue}
      />
    )

    if (type.options && type.options.editModal == 'fullscreen') {
      return (
        <FullscreenDialog title={memberType.title} onClose={this.handleClose} isOpen>
          {content}
        </FullscreenDialog>
      )
    }

    if (type.options && type.options.editModal == 'fold') {
      return (
        <EditItemFold title={memberType.title} onClose={this.handleClose}>
          {content}
        </EditItemFold>
      )
    }

    return (
      <EditItemPopOver title={memberType.title} onClose={this.handleClose}>
        {content}
      </EditItemPopOver>
    )
  }

  getMemberType(value) {
    const {type} = this.props
    return type.of.find(memberType => memberType.name === value._type)
  }

  handleClearValue = () => {
    this.unset()
    this.setState({isEditing: false})
  }

  renderValue = () => {
    const {type, value} = this.props
    const {isEditing} = this.state
    const itemType = this.getMemberType(value)

    if (!itemType) {
      return (
        <div className={styles.warning}>
          <h3>Warning</h3>
          <div>This field has an invalid type:
            <pre>{value._type}</pre>
          </div>
          <div>The only allowed item types are:
            <pre>{humanizeList(type.of.map(ofType => ofType.name))}</pre>
          </div>
          <Button type="button" onMouseUp={this.handleClearValue}>Remove</Button>
        </div>
      )
    }

    const isRelative = type.options && type.options.editModal === 'fold'

    return (
      <div style={{position: 'relative'}} onClick={this.handleEditValue}>
        <ItemPreview
          type={itemType}
          value={value}
          onRemove={this.handleClearValue}
        />
        {isEditing && (
          <div className={isRelative ? styles.popupAnchorRelative : styles.popupAnchor}>
            {this.renderEditValueForm()}
          </div>
        )}
      </div>
    )
  }

  render() {
    const {type, level, value} = this.props

    const polymorphic = this.props.type.of.length > 1
    return (
      <Fieldset legend={type.title} description={type.description} level={level} transparent>
        <div className={styles.root}>
          {
            value && (
              <div className={styles.item}>
                {this.renderValue()}
              </div>
            )
          }
          <div className={styles.functions}>
            {polymorphic
              ? this.renderSelectType()
              : (
                <Button onClick={this.handleSetBtnClick}>
                  Set
                </Button>
              )}
          </div>
        </div>
      </Fieldset>
    )
  }
}
