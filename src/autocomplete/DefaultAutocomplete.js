import React, {PropTypes} from 'react'
import DefaultTextField from 'component:@sanity/components/textfields/default'
import styles from 'style:@sanity/components/autocomplete/default'
import List from 'component:@sanity/components/lists/default'

export default class DefaultAutocomplete extends React.Component {
  static propTypes = {
    label: PropTypes.func.isRequired,
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

  handleSelect(id) {
    this.setState({
      value: this.props.suggestions[id].title,
      isOpen: false
    })
  }

  render() {
    const {suggestions} = this.state.suggestions || this.props

    return (
      <div className={`${this.state.isOpen ? styles.opened : styles.closed}`}>
        <DefaultTextField {...this.props} value={this.state.value} onKeyPress={this.handleKeyPress} />

        <div className={styles.suggestionsContainer}>
          <List items={suggestions} className={styles.suggestions} onSelect={this.handleSelect} />
        </div>

      </div>
    )
  }
}
