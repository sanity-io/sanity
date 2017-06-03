import PropTypes from 'prop-types'
import React from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import styles from './styles/ItemPreview.css'
import Preview from '../../Preview'
import Button from 'part:@sanity/components/buttons/default'
import TrashIcon from 'part:@sanity/base/trash-icon'
import {resolveTypeName} from '../../utils/resolveType'
import InvalidValue from '../InvalidValue'

export default class Item extends React.PureComponent {
  static propTypes = {
    type: FormBuilderPropTypes.type.isRequired,
    // note: type here is the *array* type
    value: PropTypes.any,
    onRemove: PropTypes.func,
    onChange: PropTypes.func,
    onStartEdit: PropTypes.func,
    layout: PropTypes.oneOf(['media', 'default'])
  };

  handleRemove = event => {
    event.stopPropagation()
    event.preventDefault()
    const {value, onRemove} = this.props
    onRemove(value)
  }

  handleMouseDown(event) {
    event.stopPropagation()
  }

  renderInvalid() {
    const {type, value} = this.props

    const actualType = resolveTypeName(value)
    const validTypes = type.of.map(ofType => ofType.name)
    return (
      <InvalidValue
        actualType={actualType}
        validTypes={validTypes}
        onChange={this.handleChange}
        value={value}
      />
    )
  }

  getMemberType(item) {
    const {type} = this.props
    return type.of.find(memberType => memberType.name === item._type)
  }

  handleChange = patchEvent => {
    this.props.onChange(patchEvent, this.props.value)
  }

  handleClick = () => {
    this.props.onStartEdit(this.props.value)
  }
  render() {
    const {value, layout, type} = this.props

    const memberType = this.getMemberType(value)
    if (!memberType) {
      return this.renderInvalid()
    }
    return (
      <div className={`${styles.root} ${styles[layout]}`}>
        <div className={styles.functions}>
          {!type.readOnly && <Button
            kind="simple"
            className={styles.deleteButton}
            color="danger"
            icon={TrashIcon}
            title="Delete"
            onClick={this.handleRemove}
            onMouseDown={this.handleMouseDown}
          />}
        </div>
        <div className={styles.content} onClick={this.handleClick}>
          <Preview layout={layout} value={value} type={memberType} />
        </div>
      </div>
    )
  }
}
