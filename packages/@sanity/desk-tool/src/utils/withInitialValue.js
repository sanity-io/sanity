import React from 'react'
import PropTypes from 'prop-types'
import {from} from 'rxjs'
import schema from 'part:@sanity/base/schema'
import shallowEquals from 'shallow-equals'
import ErrorPane from '../pane/ErrorPane'
import LoadingPane from '../pane/LoadingPane'
import DocumentSnapshots from '../components/DocumentSnapshots'
import BrokenReferences from '../components/BrokenReferences'
import {
  templateExists,
  getTemplateById,
  getTemplatesBySchemaType,
  resolveInitialValue
} from '@sanity/base/initial-value-templates'

async function resolveInitialValueWithParameters(template, parameters) {
  if (!template) {
    return undefined
  }

  if (!templateExists(template)) {
    // eslint-disable-next-line no-console
    console.warn('Template "%s" not defined, using empty initial value', template)
    return undefined
  }

  const value = await resolveInitialValue(getTemplateById(template), parameters)
  return value
}

// Resolves the initial value for a given template, if possible
export default function withInitialValue(Pane) {
  return class WithInitialValue extends React.PureComponent {
    static displayName = `WithInitialValue(${Pane.displayName || Pane.name})`

    static propTypes = {
      options: PropTypes.shape({
        id: PropTypes.string,
        type: PropTypes.string,
        template: PropTypes.string,
        templateParameters: PropTypes.object // eslint-disable-line react/forbid-prop-types
      }).isRequired,
      urlParameters: PropTypes.shape({
        template: PropTypes.string
      })
    }

    static defaultProps = {
      urlParameters: {}
    }

    constructor(props) {
      super(props)

      const {template: definedTemplate} = props.options
      const {template: urlTemplate, ...urlParameters} = props.urlParameters

      if (urlTemplate && definedTemplate && definedTemplate !== urlTemplate) {
        // eslint-disable-next-line no-console
        console.warn(
          `Conflicting templates: URL says "${urlParameters.template}", structure node says "${definedTemplate}". Using "${definedTemplate}".`
        )
      }

      const {templateName, parameters} = this.resolveTemplateAndParams()
      const shouldResolve = Boolean(templateName)
      this.state = {isResolving: shouldResolve}

      if (shouldResolve) {
        this.resolveInitialValue(templateName, parameters)
      }
    }

    componentDidUpdate(prevProps) {
      if (
        prevProps.options.template !== this.props.options.template ||
        !shallowEquals(prevProps.options.templateParameters, this.props.options.templateParameters)
      ) {
        const {templateName, parameters} = this.resolveTemplateAndParams()
        if (templateName) {
          this.resolveInitialValue(templateName, parameters)
        }
      }
    }

    resolveTemplateAndParams() {
      const {template: urlTemplate, ...urlParameters} = this.props.urlParameters
      const {options = {}} = this.props
      const template = options.template || urlTemplate
      const typeTemplates = getTemplatesBySchemaType(options.type)

      const parameters = {...options.templateParameters, ...urlParameters}
      let templateName = template

      // If we have not specified a specific template, and we only have a single
      // template available for a schema type, use it
      if (!template && typeTemplates.length === 1) {
        templateName = typeTemplates[0].id
      }

      return {templateName, parameters}
    }

    resolveInitialValue(templateName, parameters) {
      this.subscription = from(
        resolveInitialValueWithParameters(templateName, parameters)
      ).subscribe(
        initialValue => {
          this.setState({isResolving: false, initialValue})
        },
        resolveError => {
          /* eslint-disable no-console */
          console.group('Failed to resolve initial value')
          console.error(resolveError)
          console.error('Template ID: %s', templateName)
          console.error('Parameters: %o', parameters || {})
          console.groupEnd()
          /* eslint-enable no-console */

          this.setState({isResolving: false, resolveError})
        }
      )
    }

    componentWillUnmount() {
      if (this.subscription) {
        this.subscription.unsubscribe()
      }
    }

    render() {
      const {options} = this.props
      const {id, type} = options
      if (!id || !type) {
        return <Pane {...this.props} initialValue={this.state.initialValue} />
      }

      const {resolveError} = this.state
      if (resolveError) {
        return (
          <ErrorPane>
            <h2>Failed to resolve initial value</h2>
            <p>Check developer console for details</p>
          </ErrorPane>
        )
      }

      return (
        <DocumentSnapshots id={id} paths={['_createdAt']}>
          {({draft, published}) => {
            const exists = Boolean(draft || published)
            if (exists) {
              // Wrap in broken references component to prevent "reload"
              // when going from missing document to a document that exists
              return (
                <BrokenReferences document={{}} type={this.props.options.type} schema={schema}>
                  <Pane {...this.props} />
                </BrokenReferences>
              )
            }

            const {isResolving, initialValue} = this.state
            const title =
              options && options.type && `New ${schema.get(options.type).title || options.type}`

            return isResolving ? (
              <LoadingPane {...this.props} title={title} message="Resolving initial value…" />
            ) : (
              <BrokenReferences
                document={initialValue}
                type={this.props.options.type}
                schema={schema}
              >
                <Pane {...this.props} initialValue={initialValue} />
              </BrokenReferences>
            )
          }}
        </DocumentSnapshots>
      )
    }
  }
}
