import React from 'react'
import PropTypes from 'prop-types'
import {ColorWrap, Checkboard, Saturation, Hue, Alpha} from 'react-color/lib/components/common'
import ColorPickerFields from './ColorPickerFields'
import s from './ColorPicker.css'

class ColorPicker extends React.PureComponent {
  static propTypes = {
    hex: PropTypes.string,
    hsl: PropTypes.object,
    hsv: PropTypes.object,
    rgb: PropTypes.object,
    onChange: PropTypes.func,
    disableAlpha: PropTypes.bool,
    renderers: PropTypes.func
  }

  render() {
    const {hex, rgb, hsl, hsv, renderers, onChange, disableAlpha} = this.props
    return (
      <div>
        <div className={s.saturation}>
          <Saturation
            is="Saturation"
            hsl={hsl}
            hsv={hsv}
            onChange={onChange}
          />
        </div>
        <div className={s.hue}>
          <Hue
            is="Hue"
            hsl={hsl}
            onChange={onChange}
            style={{
              radius: '2px',
              shadow: 'inset 0 0 0 1px rgba(0,0,0,.15), inset 0 0 4px rgba(0,0,0,.25)',
            }}
          />
        </div>
        {
          !disableAlpha && (
            <div className={s.alpha}>
              <Alpha
                is="Alpha"
                rgb={rgb}
                hsl={hsl}
                renderers={renderers}
                onChange={onChange}
                style={{
                  radius: '2px',
                  shadow: 'inset 0 0 0 1px rgba(0,0,0,.15), inset 0 0 4px rgba(0,0,0,.25)'
                }}
              />
            </div>
          )
        }
        <div className={s.controls}>
          <div className={s.preview}>
            <div className={s.checkboard}>
              <Checkboard />
            </div>
            <div
              className={s.color}
              style={{backgroundColor: `rgba(${rgb.r},${rgb.g},${rgb.b},${rgb.a})`}}
            />
          </div>
          <div className={s.fields}>
            <ColorPickerFields
              rgb={rgb}
              hsl={hsl}
              hex={hex}
              onChange={onChange}
              disableAlpha={disableAlpha}
            />
          </div>
        </div>
      </div>
    )
  }
}

ColorPicker.defaultProps = {
  disableAlpha: false
}

export default ColorWrap(ColorPicker)
