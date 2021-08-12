///<reference types="@sanity/types/parts" />

/* eslint-disable id-length */
import React, {PureComponent} from 'react'
import PropTypes from 'prop-types'
import {PatchEvent, patches} from 'part:@sanity/form-builder'
import {debounce} from 'lodash'
import {Button} from '@sanity/ui'
import {AddIcon} from '@sanity/icons'
import {FormField} from '@sanity/base/components'
import ColorPicker from './ColorPicker'

const {set, unset, setIfMissing} = patches

const DEFAULT_COLOR = {
  hex: '#24a3e3',
  hsl: {h: 200, s: 0.7732, l: 0.5156, a: 1},
  hsv: {h: 200, s: 0.8414, v: 0.8901, a: 1},
  rgb: {r: 46, g: 163, b: 227, a: 1},
  source: 'hex',
}

export default class ColorInput extends PureComponent {
  focusRef = React.createRef()
  static propTypes = {
    type: PropTypes.shape({
      name: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string,
      fields: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string.isRequired,
        })
      ),
    }).isRequired,
    onChange: PropTypes.func.isRequired,
    readOnly: PropTypes.bool,
    value: PropTypes.shape({
      hex: PropTypes.string,
      alpha: PropTypes.number,
    }),
  }

  focus() {
    // todo: make the ColorPicker component support .focus()
    if (this.focusRef.current && this.focusRef.current.focus) {
      this.focusRef.current.focus()
    }
  }

  emitSetColor = (nextColor) => {
    const {onChange, type} = this.props

    const fieldPatches = type.fields
      .filter((field) => field.name in nextColor)
      .map((field) => {
        const nextFieldValue = nextColor[field.name]
        const isObject = field.type.jsonType === 'object'
        return set(
          isObject ? Object.assign({_type: field.type.name}, nextFieldValue) : nextFieldValue,
          [field.name]
        )
      })

    onChange(
      PatchEvent.from([
        setIfMissing({_type: type.name}),
        set(type.name, ['_type']),
        set(nextColor.rgb.a, ['alpha']),
        ...fieldPatches,
      ])
    )
  }

  // The color picker emits onChange events continuously while the user is sliding the
  // hue/saturation/alpha selectors. This debounces the event to avoid excessive patches
  handleColorChange = debounce(this.emitSetColor, 100)

  handleCreateColor = () => {
    this.emitSetColor(DEFAULT_COLOR)
  }

  handleUnset = () => {
    this.props.onChange(PatchEvent.from(unset()))
  }

  render() {
    const {type, readOnly, value, level} = this.props
    return (
      <FormField title={type.title} description={type.description} level={level}>
        {value ? (
          <ColorPicker
            ref={this.focusRef}
            color={value.hsl || value.hex}
            readOnly={readOnly || type.readOnly}
            onChange={this.handleColorChange}
            disableAlpha={type.options && type.options.disableAlpha}
            onUnset={this.handleUnset}
          />
        ) : (
          <Button
            icon={AddIcon}
            mode="ghost"
            text="Create color"
            ref={this.focusRef}
            disabled={Boolean(readOnly)}
            onClick={this.handleCreateColor}
          />
        )}
      </FormField>
    )
  }
}
