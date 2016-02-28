import React from 'react'
import ControlledValue from '../../../mixins/ControlledValue'
import ItemEditor from './ItemEditor'
import ItemEditorWrapper from './ItemEditorWrapper'
import Item from './Item'
import isPlainObject from 'lodash.isplainobject'
import Sortable from '../../../../widgets/inputs/Sortable'
import _t from '../../../../lib/translate'._t
import cx from 'classnames'
import Button from '../../../../widgets/Button'
import FieldErrors from '../../FieldErrors'
import update from 'react-addons-update'

function stringify(obj) {
  return Object.keys(obj).reduce((str, key) => {
    return str + ';' + key + '/' + obj[key]
  }, '')
}

// THIS IS AN UGLY HACK:
// We need richer type information, instead of passing around strings
function normalizeType(type) {
  if (!type) {
    return type
  }
  if (isPlainObject(type)) {
    return type
  }
  return {name: type}
}

function getItemType(item) {
  return isPlainObject(item) ? item.type : typeof item
}


const PropTypes = React.PropTypes
export default React.createClass({
  displayName: 'List',

  propTypes: {
    schema: PropTypes.object,
    field: PropTypes.shape({
      of: PropTypes.arrayOf( // todo: fix this mess by re-using propTypes of field
        PropTypes.oneOfType([
          PropTypes.object,
          PropTypes.arrayOf(PropTypes.object),
          PropTypes.string
        ])
      ).isRequired
    }),
    fieldBuilders: PropTypes.object,
    fieldPreviews: PropTypes.object,
    document: PropTypes.object,
    validateDocument: PropTypes.func
  },

  mixins: [ControlledValue],

  getInitialState() {
    return {
      validation: {},
      editItem: null,
      errors: []
    }
  },

  handleAddItemAt(position) {
    const types = this.getItemTypes()

    const type = types.length === 1 ? types[0] : null // null means the user has to choose

    this.setState({
      editItem: {
        type: type && normalizeType(type),
        add: true,
        value: null,
        position: position
      }
    })
  },

  handleSelectEditType(type) {
    this.setState(update(this.state, {
      editItem: {type: {$set: type}}
    }))
  },

  handleItemEditChange(newValue) {
    this.setState(update(this.state, {
      editItem: {value: {$set: newValue}}
    }))
  },

  isValidItem(item) {
    // Validate document style items through the outer validateDocument func.
    // They should not be allowed to be added if fields are requried etc.
    // TODO: refactor this when we got a better validation system.
    if (this.props.schema[item.type.name] && this.props.validateDocument) {
      const fields = this.props.schema[item.type.name].attributes
      const validation = this.props.validateDocument(fields, item.value)
      this.setState({validation: validation})
      return !Object.keys(validation).some(key => {
        return validation[key] && validation[key].length > 0
      })
    } else {
      // For more simple items just check if we got a value.
      return item.value
    }
  },

  handleItemEditOk() {
    const {editItem} = this.state
    if (!editItem.value) {
      this.setState({errors: [{message: _t('formBuilder.fields.list.itemIsEmptyError')}]})
      return
    }
    if (!this.isValidItem(editItem)) {
      return
    }

    if (editItem.add) {
      // primitive types
      if (!['string', 'date', 'number', 'richtext'].includes(editItem.type.name)) {
        editItem.value.type = editItem.type.name
      }
      this.addItemAt(editItem.position, editItem.value)
    }
    else {
      this.setItemAt(editItem.position, editItem.value)
    }
    this.setState({editItem: null, validation: {}, errors: []})
  },

  update(spec) {
    const items = this._getValue() || []
    this._setValue(update(items, spec))
  },

  removeItemAt(position) {
    this.update({
      $splice: [[position, 1]]
    })
  },

  addItemAt(position, item) {
    this.update({
      $splice: [[position, 0, item]]
    })
  },

  setItemAt(position, item) {
    this.update({
      $splice: [[position, 1, item]]
    })
  },

  handleItemEditCancel() {
    this.setState({editItem: null})
  },

  handleEdit(position, item) {
    const itemType = this.getItemTypes().find(type => {
      if (item.type === 'reference') {
        return type.name === 'reference' && type.to === item.to
      }
      return type.name == getItemType(item)
    })
    this.setState({
      editItem: {
        position: position,
        type: itemType,
        value: item,
        add: false
      }
    })
  },

  handleRemove(position, item) {
    this.removeItemAt(position)
  },

  handleSorted(newArray) {
    this._setValue(newArray)
  },

  getItemTypes() {
    // todo: fix this mess
    const of = this.props.field.of

    return arrayIfy(isPlainObject(of) ? of.type : of).map(normalizeType)

    function arrayIfy(val) {
      return Array.isArray(val) ? val : [val]
    }
  },

  renderAddButton(position) {
    const classes = cx({
      positive: true,
      button: true,
      'insert-button': true
    })

    const handleItemAdd = () => {
      this.handleAddItemAt(position)
    }
    return (
      <Button
        onClick={handleItemAdd}
        type="button" className={classes}
        title={_t('formBuilder.fields.list.addNewItemButtonHelp')}>
        <i className="ion-plus"></i>{' '}<span>{_t('formBuilder.fields.list.addNewItemButton')}</span>
      </Button>
    )
  },

  renderSelectType() {
    const types = this.getItemTypes()
    const {schema} = this.props
    return types.map(type => {
      const handleSelectEditType = () => this.handleSelectEditType(type)
      return (
        <Button
          key={stringify(type)}
          onClick={handleSelectEditType}
          type="button" title={_t('formBuilder.fields.list.addTypeToList', null, {type: getDisplayNameOfType(type)})}>
          <i className="ion-plus"/>{' '}<span>{getDisplayNameOfType(type)}</span>
        </Button>
      )
    })
    function getDisplayNameOfType(type) {
      if (type.name === 'reference') {
        const refType = schema[type.to]
        return refType.displayName
      }
      return schema[type.name] ? schema[type.name].displayName : type.name
    }
  },

  renderItemForm() {
    const {editItem} = this.state
    if (!editItem) {
      return null
    }

    if (!editItem.type) {
      return (
        <ItemEditorWrapper
          onCancel={this.handleItemEditCancel}
          title={_t('formBuilder.fields.list.selectType')}
          >
          <div className="form-list-item-editor__choose-type">
            {this.renderSelectType()}
          </div>
        </ItemEditorWrapper>
      )
    }

    const {fieldBuilders, schema, fieldPreviews, document} = this.props

    return (
      <ItemEditorWrapper
        onCancel={this.handleItemEditCancel}
        title={_t('formBuilder.fields.list.' + (editItem.add ? 'addItemHeader' : 'editItemHeader'))}
        >

        <ItemEditor
          value={editItem.value}
          type={editItem.type}
          fieldBuilders={fieldBuilders}
          schema={schema}
          document={document}
          validation={this.state.validation}
          fieldPreviews={fieldPreviews}
          onChange={this.handleItemEditChange}
          onOk={this.handleItemEditOk}
          onCancel={this.handleItemEditCancel}
          onLock={this.props.onLock}
          onRelease={this.props.onRelease}
        />
        <FieldErrors errors={this.state.errors}/>
      </ItemEditorWrapper>
    )
  },

  renderSeparator(item, index, {before, after, first, last}) {
    const {editItem} = this.state
    const isEditedItem = editItem && index == editItem.position

    if (isEditedItem && before) {
      return this.renderItemForm()
    }

    if (before || last) {
      const position = before ? index : index + 1
      const handleItemAdd = () => {
        this.handleAddItemAt(position)
      }
      return (
        <div className="form-list__separator">
          <a
            onClick={handleItemAdd}
            type="button"
            className="form-list__separator-button"
            title="Add a new item to the list">
            <i className="ion-ios-plus-empty"></i>
          </a>
        </div>
      )
    }
  },

  renderItem(item, index, {dragged, draggedOver}) {

    const {editItem} = this.state
    const isEditedItem = editItem && index == editItem.position

    if (isEditedItem && !editItem.add) {
      return null
    }

    const handleEditItem = () => {
      this.handleEdit(index, item)
    }
    const handleRemoveItem = () => {
      this.handleRemove(index, item)
    }
    return (
      <div className="form-list__sortable-item">
        <div className="form-list__drag-handle">
          <i></i>
        </div>
        <div className="form-list__item">
          <div className="form-list__item-content">
            <Item schema={this.props.schema}
              type={getItemType(item)}
              item={item}
              fieldBuilders={this.props.fieldBuilders}
              fieldPreviews={this.props.fieldPreviews}
            />
          </div>
          <div className="form-list__item-functions">
            <div
              onClick={handleEditItem}
              className="form-list__item-function form-list__item-function--edit">
              {_t('common.edit')}
            </div>
            <div
              onClick={handleRemoveItem}
              className="form-list__item-function form-list__item-function--delete">
              {_t('common.delete')}
            </div>
          </div>
        </div>
      </div>
    )
  },

  renderListItems(items) {
    return (
      <div>
        <div className="form-list__list form-list__list--sortable">
          <Sortable
            value={items}
            onChange={this.handleSorted}
            renderItem={this.renderItem}
            renderSeparator={this.renderSeparator}
            />
        </div>
      </div>
    )
  },

  render() {
    const items = this._getValue() || []
    const {field} = this.props
    const {editItem} = this.state
    return (
      <div className="form-builder__field form-builder__list">
        <label className="form-builder__label">{field.title}</label>
        {
          field.description && <div className='form-builder__help-text'>{field.description}</div>
        }
        <div className='form-builder__item form-list form-list--list'>
          {this.renderListItems(items)}
          {editItem && editItem.position == items.length && this.renderItemForm()}
          {!editItem && this.renderAddButton(items.length)}
        </div>
      </div>
    )
  }
})
