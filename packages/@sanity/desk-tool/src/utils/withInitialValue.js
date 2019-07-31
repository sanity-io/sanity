import React from 'react'
import PropTypes from 'prop-types'
import {from} from 'rxjs'
import DefaultPane from 'part:@sanity/components/panes/default'
import CreateDocumentList from 'part:@sanity/components/lists/create-document'
import LoadingPane from '../pane/LoadingPane'
import DocumentSnapshots from '../components/DocumentSnapshots'
import styles from './styles/withInitialValue.css'
import {
  templateExists,
  getTemplateById,
  getTemplatesBySchemaType,
  resolveInitialValue
} from '@sanity/base/initial-values'

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
      }).isRequired
    }

    static defaultProps = {
      parameters: undefined
    }

    constructor(props) {
      super(props)

      const {options} = props
      const {template, type} = options

      let templateName = template
      let templateChoices = !template && getTemplatesBySchemaType(type)

      // If we have not specified a specific template, and we only have a single
      // template available for a schema type, use it
      if (!template && templateChoices && templateChoices.length === 1) {
        templateName = templateChoices[0].id
        templateChoices = null
      }

      const shouldResolve = Boolean(templateName)
      this.state = {isResolving: shouldResolve, templateChoices}

      if (shouldResolve) {
        this.subscription = from(this.resolveInitialValue(templateName)).subscribe(initialValue => {
          this.setState({isResolving: false, initialValue})
        })
      }
    }

    componentWillUnmount() {
      if (this.subscription) {
        this.subscription.unsubscribe()
      }
    }

    resolveInitialValue(template) {
      const {parameters} = this.props
      if (!template) {
        return Promise.resolve(undefined)
      }

      if (!templateExists(template)) {
        // eslint-disable-next-line no-console
        console.warn('Template "%s" not defined, using empty initial value', template)
        return Promise.resolve(undefined)
      }

      return resolveInitialValue(getTemplateById(template), parameters)
    }

    render() {
      const {options} = this.props
      const {id, type} = options
      if (!id || !type) {
        return <Pane {...this.props} initialValue={this.state.initialValue} />
      }

      return (
        <DocumentSnapshots id={id} paths={['_createdAt']}>
          {({draft, published}) => {
            const exists = Boolean(draft || published)
            if (exists) {
              return <Pane {...this.props} />
            }

            const {isResolving, initialValue, templateChoices} = this.state
            const title = options && options.type && `Creating new ${options.type}`
            if (templateChoices && templateChoices.length > 0) {
              return (
                <DefaultPane title={title}>
                  <div className={styles.root}>
                    <CreateDocumentList
                      items={templateChoices.map(choice => ({
                        ...choice,
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
              <Pane {...this.props} initialValue={initialValue} />
            )
          }}
        </DocumentSnapshots>
      )
    }
  }
}
