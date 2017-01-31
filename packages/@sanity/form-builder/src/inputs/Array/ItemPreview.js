import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import equals from 'shallow-equals'
import styles from './styles/ItemPreview.css'
import Preview from '../../Preview'
import Button from 'part:@sanity/components/buttons/default'
import TrashIcon from 'part:@sanity/base/trash-icon'

export default class ItemPreview extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.handleRemove = this.handleRemove.bind(this)
  }

  static propTypes = {
    type: FormBuilderPropTypes.type.isRequired,
    value: PropTypes.any,
    onRemove: PropTypes.func,
    view: PropTypes.oneOf(['media', 'default'])
  };

  static contextTypes = {
    formBuilder: PropTypes.object
  };

  shouldComponentUpdate(nextProps) {
    return !equals(nextProps, this.props)
  }

  toggleEdit() {
    // Handle toggle insted of edit
  }

  handleRemove(event) {
    event.stopPropagation()
    event.preventDefault()
    const {value, onRemove} = this.props
    onRemove(value)
  }
  handleMouseDown(event) {
    event.stopPropagation()
  }

  render() {
    const {value, type, view} = this.props
    return (
      <div className={`${styles.root} ${styles[view]}`}>
        <div className={styles.functions}>
          <Button
            kind="simple"
            color="danger"
            icon={TrashIcon}
            title="Delete"
            onClick={this.handleRemove}
            onMouseDown={this.handleMouseDown}
          />
        </div>
        <div className={styles.content}>
          <Preview view={view} value={value.serialize()} type={type} />
        </div>
      </div>
    )
  }
}
