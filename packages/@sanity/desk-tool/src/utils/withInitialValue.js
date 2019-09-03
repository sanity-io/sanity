import React from 'react'
import PropTypes from 'prop-types'
import {from} from 'rxjs'
import DefaultPane from 'part:@sanity/components/panes/default'
import CreateDocumentList from 'part:@sanity/components/lists/create-document'
import schema from 'part:@sanity/base/schema'
import shallowEquals from 'shallow-equals'
import ErrorPane from '../pane/ErrorPane'
import LoadingPane from '../pane/LoadingPane'
import DocumentSnapshots from '../components/DocumentSnapshots'
import BrokenReferences from '../components/BrokenReferences'
import styles from './styles/withInitialValue.css'
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
      parameters: PropTypes.object, // eslint-disable-line react/forbid-prop-types
      options: PropTypes.shape({
        id: PropTypes.string,
        type: PropTypes.string,
        template: PropTypes.string
      }).isRequired,
      initialValueTemplates: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          parameters: PropTypes.object
        })
      ),
      urlParameters: PropTypes.shape({
        template: PropTypes.string
      })
    }

    static defaultProps = {
      parameters: undefined,
      initialValueTemplates: undefined,
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

      const {templateChoices, templateName, parameters} = this.resolveTemplateChoices()
      const shouldResolve = Boolean(templateName)
      this.state = {isResolving: shouldResolve, templateChoices}

      if (shouldResolve) {
        this.resolveInitialValue(templateName, parameters)
      }
    }

    componentDidUpdate(prevProps) {
      if (
        prevProps.options.template !== this.props.options.template ||
        !shallowEquals(prevProps.parameters, this.props.parameters)
      ) {
        const {templateName, parameters} = this.resolveTemplateChoices()
        if (templateName) {
          this.resolveInitialValue(templateName, parameters)
        }
      }
    }

    resolveTemplateChoices() {
      const {template: urlTemplate, ...urlParameters} = this.props.urlParameters
      const {options, initialValueTemplates} = this.props
      const template = options.template || urlTemplate
      const type = options.type

      let parameters = {...this.props.parameters, ...urlParameters}
      let templateName = template
      let templateChoices

      if (!template && initialValueTemplates) {
        templateChoices = initialValueTemplates.map(spec => {
          const tpl = getTemplateById(spec.id)
          const schemaType = schema.get(tpl.schemaType)
          return {
            ...tpl,
            typeTitle: schemaType.title,
            icon: tpl.icon || schemaType.title,
            parameters: spec.parameters
          }
        })
      } else if (!template) {
        templateChoices = getTemplatesBySchemaType(type)
          .filter(tpl => !tpl.parameters || !tpl.parameters.length)
          .map(tpl => ({
            ...tpl,
            typeTitle: type.title,
            icon: tpl.icon || type.icon
          }))
      }

      // If we have not specified a specific template, and we only have a single
      // template available for a schema type, use it
      if (!template && templateChoices && templateChoices.length === 1) {
        templateName = templateChoices[0].id
        parameters = {...templateChoices[0].parameters, ...parameters}
        templateChoices = null
      }

      return {templateChoices, templateName, parameters}
    }

    resolveInitialValue(templateName, parameters) {
      this.subscription = from(
        resolveInitialValueWithParameters(templateName, parameters)
      ).subscribe(
        initialValue => {
          this.setState({isResolving: false, initialValue, templateChoices: null})
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
              return <Pane {...this.props} />
            }

            const {isResolving, initialValue, templateChoices} = this.state
            const title =
              options && options.type && `New ${schema.get(options.type).title || options.type}`

            if (templateChoices && templateChoices.length > 0) {
              return (
                <DefaultPane {...this.props} title={title}>
                  <div className={styles.root}>
                    <CreateDocumentList
                      items={templateChoices.map(choice => ({
                        ...choice,
                        title:
                          choice.title === schema.get(choice.schemaType).title
                            ? 'Default'
                            : choice.title,
                        icon: choice.icon || schema.get(choice.schemaType).icon,
                        key: choice.id,
                        params: {
                          template: choice.id
                        }
                      }))}
                    />
                  </div>
                </DefaultPane>
              )
            }

            return isResolving ? (
              <LoadingPane {...this.props} title={title} message="Resolving initial value…" />
            ) : (
              <BrokenReferences document={initialValue}>
                <Pane {...this.props} initialValue={initialValue} />
              </BrokenReferences>
            )
          }}
        </DocumentSnapshots>
      )
    }
  }
}
