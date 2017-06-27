import React from 'react'
import PropTypes from 'prop-types'
import PatchEvent, {set, setIfMissing, unset} from '@sanity/form-builder/PatchEvent'
import styles from './LocaleStringInput.css'

export default class LocaleStringInput extends React.Component {
  static propTypes = {
    onChange: PropTypes.func,
    value: PropTypes.object,
    type: PropTypes.shape({
      title: PropTypes.string,
      fields: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        type: PropTypes.shape({
          title: PropTypes.string
        })
      })),
    }),
  }
  static defaultProps = {
    value: {}
  }

  handleFieldChange = event => {
    const {type, onChange} = this.props
    const {value, name} = event.target
    const patches = value === ''
      ? [unset([name])]
      : [
        setIfMissing({_type: type.name}),
        set(value, [name])
      ]
    onChange(PatchEvent.from(patches))
  }

  render() {
    const {type, value} = this.props
    return (
      <div className={styles.root} tabIndex="0">
        <h1>{type.title}</h1>
        {type.fields.map(field => {
          return (
            <div key={field.name}>
              <h2>{field.type.title}</h2>
              <input type="text" name={field.name} value={value[field.name] || ''} onChange={this.handleFieldChange} />
            </div>
          )
        })}
      </div>
    )
  }
}
