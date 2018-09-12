import PropTypes from 'prop-types'
import React from 'react'
import FormField from 'part:@sanity/components/formfields/default'
import {setIfMissing} from 'part:@sanity/form-builder/patch-event'
import {withDocument, FormBuilderInput} from 'part:@sanity/form-builder'

export default withDocument(
  class ConditionalField extends React.Component {
    static propTypes = {
      type: PropTypes.shape({
        title: PropTypes.string,
        name: PropTypes.string
      }).isRequired,
      level: PropTypes.number,
      document: PropTypes.object,
      value: PropTypes.shape({
        _type: PropTypes.string
      }),
      onChange: PropTypes.func.isRequired
    }
    firstFieldRef = React.createRef()

    focus() {
      this.firstFieldRef.current.focus()
    }

    handleFieldChange = (field, fieldPatchEvent) => {
      const {onChange, type} = this.props
      onChange(fieldPatchEvent.prefixAll(field.name).prepend(setIfMissing({_type: type.name})))
    }
    renderField(field) {
      const {value} = this.props
      return (
        <FormBuilderInput
          key={field.name}
          type={field.type}
          value={value && value[field.name]}
          onChange={patchEvent => this.handleFieldChange(field, patchEvent)}
        />
      )
    }
    render() {
      const {type, document, level} = this.props
      const [kindField, catField, dogField] = type.fields
      const selectedPetKind = document && document.kind
      return (
        <FormField label={type.title} level={level} description={type.description}>
          {this.renderField(kindField)}
          {selectedPetKind === 'cat' && this.renderField(catField)}
          {selectedPetKind === 'dog' && this.renderField(dogField)}
        </FormField>
      )
    }
  }
)
