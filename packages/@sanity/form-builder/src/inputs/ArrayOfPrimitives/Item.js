import PropTypes from 'prop-types'
import React from 'react'
import {FormBuilderInput} from '../../FormBuilderInput'
import styles from './styles/Item.css'
import Button from 'part:@sanity/components/buttons/default'
import TrashIcon from 'part:@sanity/base/trash-icon'

import PatchEvent, {set, unset} from '../../PatchEvent'
import getEmptyValue from './getEmptyValue'

import {createDragHandle} from 'part:@sanity/components/lists/sortable'
import DragBarsIcon from 'part:@sanity/base/bars-icon'

const DragHandle = createDragHandle(() => <span className={styles.dragHandle}><DragBarsIcon /></span>)

export default class Item extends React.PureComponent {
  static propTypes = {
    type: PropTypes.object.isRequired,
    onChange: PropTypes.func,
    index: PropTypes.number
  }

  handleRemove = event => {
    const {index, onChange} = this.props
    onChange(PatchEvent.from(unset([index])))
  }

  handleChange = (patchEvent: PatchEvent) => {
    const {onChange, type, index} = this.props
    onChange(PatchEvent.from(patchEvent.patches.map(patch => (
      // Map direct unset patches to empty value instead in order to not *remove* elements as the user clears out the value
      (patch.path.length === 0 && patch.type === 'unset')
        ? set(getEmptyValue(type))
        : patch
    ))).prefixAll(index))
  }

  handleClick = () => {
    this.setState({edit: true})
  }

  handleBlur = () => {
    this.setState({edit: false})
  }

  handleKeyPress = event => {
    if (event.key === 'Enter' || event.keyCode === 27) {
      this.setState({edit: false})
    }
  }

  render() {
    const {value, level, type, sortable} = this.props
    return (
      <div className={styles.root}>
        {sortable && <DragHandle className={styles.dragHandle}/>}
        <div onClick={this.handleClick} className={styles.input}>
          <FormBuilderInput
            value={value}
            type={type}
            onChange={this.handleChange}
            onKeyPress={this.handleKeyPress}
            onBlur={this.handleBlur}
            level={level}
          />
        </div>
        <Button
          kind="simple"
          className={styles.deleteButton}
          color="danger"
          icon={TrashIcon}
          title="Delete"
          onClick={this.handleRemove}
        />
      </div>
    )
  }
}
