import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../../FormBuilderPropTypes'
import RenderField from './RenderField'
import ObjectContainer from './ObjectContainer'
import Fieldset from '../../Fieldset'
import equals from 'shallow-equals'

export default class Obj extends React.Component {
  static displayName = 'Object'

  static valueContainer = ObjectContainer;

  static propTypes = {
    type: FormBuilderPropTypes.type,
    field: FormBuilderPropTypes.field,
    value: PropTypes.object,
    onChange: PropTypes.func,
    level: PropTypes.number
  };

  static defaultProps = {
    onChange() {},
    level: 0
  };

  static contextTypes = {
    resolveInputComponent: PropTypes.func,
    schema: PropTypes.object
  };

  constructor(props, context) {
    super(props, context)
    this.handleFieldChange = this.handleFieldChange.bind(this)
    this.renderField = this.renderField.bind(this)
  }

  handleFieldChange(event, fieldName) {
    const {onChange} = this.props
    const patch = {[fieldName]: event.patch}
    onChange({patch})
  }

  shouldComponentUpdate(nextProps) {
    return !equals(this.props, nextProps)
  }

  renderField(field, level) {
    const {value} = this.props
    const fieldValue = value && value.getFieldValue(field.name)
    return (
      <RenderField
        key={field.name}
        fieldName={field.name}
        field={field}
        value={fieldValue}
        onChange={this.handleFieldChange}
        level={level}
      />
    )
  }

  renderFieldset(fieldset) {
    const {level} = this.props
    return (
      <Fieldset key={fieldset.name} legend={fieldset.title} level={level}>
        {fieldset.fields.map(field => this.renderField(field, level + 1))}
      </Fieldset>
    )
  }

  renderFieldsets(fieldsets) {
    const {level} = this.props
    return fieldsets.map(fieldset => {
      return fieldset.lonely ? this.renderField(fieldset.field, level) : this.renderFieldset(fieldset)
    })
  }

  render() {
    const {type} = this.props
    return (
      <div>
        {this.renderFieldsets(type.fieldsets)}
      </div>
    )
  }
}
