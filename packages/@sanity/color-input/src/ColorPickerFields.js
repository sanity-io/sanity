/* eslint-disable no-param-reassign, complexity, react/prop-types */

import React from 'react'
import color from 'react-color/lib/helpers/color'
import {EditableInput} from 'react-color/lib/components/common'
import styles from './ColorPickerFields.css'

const inputStyles = {
  input: {
    width: '80%',
    padding: '4px 10% 3px',
    border: 'none',
    boxShadow: 'inset 0 0 0 1px #ccc',
    fontSize: '11px',
  },
  label: {
    display: 'block',
    textAlign: 'center',
    fontSize: '11px',
    color: '#222',
    paddingTop: '3px',
    paddingBottom: '4px',
    textTransform: 'capitalize',
  },
}

export const ColorPickerFields = ({onChange, rgb, hsl, hex, disableAlpha}) => {
  const handleChange = (data, e) => {
    if (data.hex) {
      color.isValidHex(data.hex) &&
        onChange(
          {
            hex: data.hex,
            source: 'hex',
          },
          e
        )
    } else if (data.r || data.g || data.b) {
      onChange(
        {
          r: data.r || rgb.r,
          g: data.g || rgb.g,
          b: data.b || rgb.b,
          a: rgb.a,
          source: 'rgb',
        },
        e
      )
    } else if (data.a) {
      if (data.a < 0) {
        data.a = 0
      } else if (data.a > 100) {
        data.a = 100
      }

      data.a /= 100
      onChange(
        {
          h: hsl.h,
          s: hsl.s,
          l: hsl.l,
          a: data.a,
          source: 'rgb',
        },
        e
      )
    }
  }

  return (
    <div className={styles.fields}>
      <div className={styles.double}>
        <EditableInput
          style={inputStyles}
          label="hex"
          value={hex.replace('#', '')}
          onChange={handleChange}
        />
      </div>
      <div className={styles.single}>
        <EditableInput
          style={inputStyles}
          label="r"
          value={rgb.r}
          onChange={handleChange}
          dragLabel="true"
          dragMax="255"
        />
      </div>
      <div className={styles.single}>
        <EditableInput
          style={inputStyles}
          label="g"
          value={rgb.g}
          onChange={handleChange}
          dragLabel="true"
          dragMax="255"
        />
      </div>
      <div className={styles.single}>
        <EditableInput
          style={inputStyles}
          label="b"
          value={rgb.b}
          onChange={handleChange}
          dragLabel="true"
          dragMax="255"
        />
      </div>
      {!disableAlpha && (
        <div className={styles.alpha}>
          <EditableInput
            style={inputStyles}
            label="a"
            value={Math.round(rgb.a * 100)}
            onChange={handleChange}
            dragLabel="true"
            dragMax="100"
          />
        </div>
      )}
    </div>
  )
}

export default ColorPickerFields
