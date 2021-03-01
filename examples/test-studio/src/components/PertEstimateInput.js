import React from 'react'
import PropTypes from 'prop-types'
import {PatchEvent, set, unset, setIfMissing} from 'part:@sanity/form-builder/patch-event'
import './PertEstimate.css?raw' // eslint-disable-line

const calculateEstimate = (estimates) => {
  const {optimistic, nominal, pessimistic} = estimates || {}
  if (!optimistic || !nominal || !pessimistic) {
    return {optimistic, nominal, pessimistic, calculated: null}
  }

  // µ = (O + (4 * N) + P) / 6
  const calculated = Number(((optimistic + 4 * nominal + pessimistic) / 6).toFixed(2))
  return {optimistic, nominal, pessimistic, calculated}
}

export default class PertEstimateInput extends React.Component {
  static propTypes = {
    value: PropTypes.object,
    type: PropTypes.object,
    onChange: PropTypes.func,
  }

  handleChange = (field, event) => {
    const {type, onChange} = this.props
    const value = Object.assign({}, this.props.value || {}, {
      [field.name]: event.target.valueAsNumber,
    })
    const {calculated} = calculateEstimate(value)

    onChange(
      PatchEvent.from(
        setIfMissing({_type: type.name}),
        set(event.target.valueAsNumber, [field.name]),
        calculated ? set(calculated, ['calculated']) : unset(['calculated'])
      )
    )
  }

  render() {
    const {value, type} = this.props
    return (
      <div className="pert-global">
        <h3>{type.title}</h3>
        <p>{type.description}</p>
        <table>
          <tbody>
            {type.fields
              .filter((field) => !field.type.readOnly)
              .map((field) => (
                <tr key={field.name}>
                  <td>{field.type.title}</td>
                  <td>
                    <input
                      type="number"
                      value={(value && value[field.name]) || ''}
                      placeholder={type.placeholder}
                      onChange={(event) => this.handleChange(field, event)}
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {value && value.calculated && <p>PERT-estimate: {value.calculated}</p>}
      </div>
    )
  }
}
