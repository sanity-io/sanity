import React, {PureComponent} from 'react'
import PropTypes from 'prop-types'
import PatchEvent, {set, merge} from '@sanity/form-builder/PatchEvent'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import ColorPicker from './ColorPicker'

export default class ColorInput extends PureComponent {

  static propTypes = {
    type: PropTypes.shape({
      name: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string,
      fields: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired
      }))
    }).isRequired,
    onChange: PropTypes.func,
    value: PropTypes.shape({
      hex: PropTypes.string,
      alpha: PropTypes.number
    })
  }

  state = {
    value: this.props.value || {hex: '#000000'}
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.value) {
      this.setState({
        value: nextProps.value
      })
    }
  }

  handleColorChange = color => {
    this.setState({value: color})
  }

  handleColorChangeComplete = (color, event) => {
    const {onChange} = this.props

    if (!color) {
      console.error('Color missing') //eslint-disable-line
    }

    color._type = 'color'
    color.alpha = color.rgb.a

    onChange(PatchEvent.from(
      Object.keys(color).map(key => set(color[key], [key]))
    ))
  }

  render() {
    const {type} = this.props
    const {value} = this.state
    return (
      <Fieldset legend={type.title} description={type.description}>
        <ColorPicker
          color={value.hsl || value.hex}
          onChange={this.handleColorChange}
          onChangeComplete={this.handleColorChangeComplete}
          disableAlpha={type.options && type.options.disableAlpha}
        />
      </Fieldset>
    )
  }
}
