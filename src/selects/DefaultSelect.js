import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/selects/default'
import lodash from 'lodash'
import {FaAngleDown} from 'react-icons/lib/fa'

export default class DefaultSelect extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    value: PropTypes.string,
    error: PropTypes.bool,
    onFocus: PropTypes.func,
    showClearButton: PropTypes.bool,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
      })
    ),
  }

  static defaultProps = {
    value: '',
    onChange() {}
  }

  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
    this.handleFocus = this.handleFocus.bind(this)
  }

  handleFocus() {
    this.props.onFocus()
  }

  handleChange(event) {
    console.log('handleChange', event)
    this.props.onChange(this.props.items[event.target.value])
  }

  componentWillMount() {
    this._inputId = lodash.uniqueId('DefaultTextField')
  }

  render() {
    const {label, error, items} = this.props

    const rootClass = error ? styles.error : styles.root

    return (
      <div className={rootClass}>
        {
          label
          && <label
            htmlFor={this._inputId}
            className={`${error ? styles.errorLabel : styles.label}`}
             >
              {label}
          </label>
        }

        <div className={styles.selectContainer}>
          <select className={styles.select} id={this._inputId} onChange={this.handleChange} onFocus={this.handleFocus}>
            {
              items.map((item, i) => {
                return (
                  <option key={i} value={i}>{item.title}</option>
                )
              })
            }
          </select>
          <div className={styles.icon}>
            <FaAngleDown color="inherit" />
          </div>
        </div>
      </div>
    )
  }
}
