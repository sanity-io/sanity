/* eslint-disable id-length */
import React, {PureComponent} from 'react'
import Button from 'part:@sanity/components/buttons/default'
import PropTypes from 'prop-types'
import {PatchEvent, patches} from 'part:@sanity/form-builder'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import ColorPicker from './ColorPicker'

const {set, unset} = patches

export default class ColorInput extends PureComponent {
  static propTypes = {
    type: PropTypes.shape({
      name: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string,
      fields: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string.isRequired
        })
      )
    }).isRequired,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.shape({
      hex: PropTypes.string,
      alpha: PropTypes.number
    })
  }

  static defaultProps = {
    value: undefined
  }

  state = {
    value: this.props.value
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
    const {onChange, type} = this.props

    if (!color) {
      // eslint-disable-next-line no-console
      console.error('Color missing')
    }

    const fields = Object.keys(color)
      .map(key => type.fields.find(field => field.name === key))
      .filter(Boolean)

    onChange(
      PatchEvent.from([
        set(type.name, ['_type']),
        set(color.rgb.a, ['alpha']),
        ...fields.map(field => {
          const isObject = field.type.jsonType === 'object'
          const fieldValue = isObject
            ? Object.assign({_type: field.type.name}, color[field.name])
            : color[field.name]

          return set(fieldValue, [field.name])
        })
      ])
    )
  }

  handleUnset = () => {
    const {onChange} = this.props

    this.setState({
      value: undefined
    })

    onChange(PatchEvent.from(unset()))
  }

  handleCreateColor = () => {
    const {onChange, type} = this.props

    const value = {
      _type: type.name,
      alpha: type.options && type.options.disableAlpha ? undefined : 1,
      hex: '#24a3e3',
      hsl: {_type: 'hslaColor', h: 200, s: 0.7732, l: 0.5156, a: 1},
      hsv: {_type: 'hsvaColor', h: 200, s: 0.8414, v: 0.8901, a: 1},
      rgb: {_type: 'rgbaColor', r: 46, g: 163, b: 227, a: 1},
      source: 'hex'
    }

    onChange(PatchEvent.from(set(value)))
  }

  render() {
    const {type} = this.props
    const {value} = this.state

    return (
      <Fieldset legend={type.title} description={type.description}>
        {!value && (
          <div>
            <Button inverted onClick={this.handleCreateColor}>
              Create color
            </Button>
          </div>
        )}
        {value && (
          <ColorPicker
            color={value.hsl || value.hex}
            onChange={this.handleColorChange}
            onChangeComplete={this.handleColorChangeComplete}
            disableAlpha={type.options && type.options.disableAlpha}
            onUnset={this.handleUnset}
          />
        )}
      </Fieldset>
    )
  }
}
