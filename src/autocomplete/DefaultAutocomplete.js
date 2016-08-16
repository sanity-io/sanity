import React, {PropTypes} from 'react'
import FormField from 'component:@sanity/components/formfields/default'
import TextInput from 'component:@sanity/components/textinputs/default'
import styles from 'style:@sanity/components/autocomplete/default'
import List from 'component:@sanity/components/lists/default'

export default class DefaultAutocomplete extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    value: PropTypes.string,
    error: PropTypes.bool,
    onKeyPress: PropTypes.func,
    placeholder: PropTypes.string,
    focus: PropTypes.func,
    showClearButton: PropTypes.bool,
    isOpen: PropTypes.bool,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string
      })
    ),
    suggestions: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string
      })
    )
  }

  static defaultProps = {
    value: '',
    suggestions: []
  }

  constructor(props, context) {
    super(props, context)
    this.handleSelect = this.handleSelect.bind(this)
    this.handleKeyPress = this.handleKeyPress.bind(this)
    this.state = {
      value: this.props.value,
      isOpen: this.props.isOpen
    }
  }

  handleKeyPress() {
    // console.log('press')
  }

  handleSelect(item) {
    // this.props.onSelect(item)
  }

  render() {
    const {suggestions, label} = this.state.suggestions || this.props

    return (
      <FormField className={`${this.state.isOpen ? styles.opened : styles.closed}`} label={label}>
        <div className={styles.input}>
          <TextInput {...this.props} value={this.state.value} onKeyPress={this.handleKeyPress} className={styles.textField} />
        </div>
        <div className={styles.suggestionsContainer}>
          <List items={suggestions} className={styles.suggestions} onSelect={this.handleSelect} />
        </div>

      </FormField>
    )
  }
}
