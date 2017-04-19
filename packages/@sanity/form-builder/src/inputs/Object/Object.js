//@flow weak
import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import RenderField from './RenderField'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import PatchEvent, {unset, setIfMissing} from '../../PatchEvent'
import MemberValue from '../../Member'
import isEmpty from '../../utils/isEmpty'

export default class ObjectInput extends React.PureComponent {
  static displayName = 'Object'

  static propTypes = {
    type: FormBuilderPropTypes.type,
    validation: PropTypes.shape(FormBuilderPropTypes.validation),
    value: PropTypes.object,
    hasFocus: PropTypes.bool,
    onChange: PropTypes.func,
    onEnter: PropTypes.func,
    level: PropTypes.number
  };

  static defaultProps = {
    onChange() {},
    onEnter() {},
    level: 0
  };

  handleBlur() {
    const {onChange, value} = this.props
    if (isEmpty(value)) {
      onChange(PatchEvent.from(unset()))
    }
  }

  handleFieldChange = (fieldEvent : PatchEvent, field) => {
    const {onChange, type, level} = this.props

    let event = fieldEvent.prefixAll(field.name)

    if (level > 0) {
      event = event.prepend(setIfMissing(type.name === 'object' ? {} : {_type: type.name}))
    }
    onChange(event)
  }

  handleFieldEnter = (event, field) => {
    this.props.onEnter(field)
  }

  renderField(field, level, index) {
    // todo: reiterate how we deal with incrementing levels

    const {value, hasFocus, validation} = this.props
    const fieldValidation = validation && validation.fields[field.name]

    const fieldValue = value && value[field.name]

    return (
      <MemberValue path={field.name}>
        <RenderField
          key={field.name}
          hasFocus={hasFocus && index === 0}
          field={field}
          value={fieldValue}
          onChange={this.handleFieldChange}
          onEnter={this.handleFieldEnter}
          validation={fieldValidation}
          level={level}
        />
      </MemberValue>
    )
  }

  renderFieldset(fieldset, level, index) {
    const columns = fieldset.options && fieldset.options.columns
    const collapsable = fieldset.options && fieldset.options.collapsable
    return (
      <Fieldset
        key={fieldset.name}
        legend={fieldset.title}
        description={fieldset.description}
        level={level}
        columns={columns}
        collapsable={collapsable}
      >
        {fieldset.fields.map((field, fieldIndex) => {
          return this.renderField(field, level + 1, index + fieldIndex)
        })}
      </Fieldset>
    )
  }

  getRenderedFields(type, level) {
    if (!type.fieldsets) {
      return (type.fields || []).map((field, i) => this.renderField(field, level === 0 ? level : level + 1, i))
    }

    return type.fieldsets.map((fieldset, i) => {
      return fieldset.single
        ? this.renderField(fieldset.field, level === 0 ? level : level + 1, i)
        : this.renderFieldset(fieldset, level, i)
    })

  }
  render() {

    const {type, level} = this.props

    const renderedFields = this.getRenderedFields(type, level)

    if (level === 0) {
      return <div>{renderedFields}</div>
    }

    const columns = type.options && type.options.columns
    const collapsable = type.options && type.options.collapsable

    return (
      <Fieldset
        level={level}
        legend={type.title}
        description={type.description}
        columns={columns}
        collapsable={collapsable}
      >
        {renderedFields}
      </Fieldset>
    )
  }
}
