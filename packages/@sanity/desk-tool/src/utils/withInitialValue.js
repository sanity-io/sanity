import React from 'react'
import PropTypes from 'prop-types'
import {from} from 'rxjs'
import LoadingPane from '../pane/LoadingPane'
import {templateExists, getTemplateById, resolveInitialValue} from '@sanity/base/initial-values'

// Resolves the initial value for a given template, if possible
export default function withInitialValue(Pane) {
  return class WithInitialValue extends React.PureComponent {
    static displayName = `WithInitialValue(${Pane.displayName || Pane.name})`

    static propTypes = {
      parameters: PropTypes.object, // eslint-disable-line react/forbid-prop-types
      options: PropTypes.shape({
        template: PropTypes.string
      }).isRequired
    }

    static defaultProps = {
      parameters: undefined
    }

    constructor(props) {
      super(props)

      const shouldResolve = Boolean(this.props.options.template)

      this.state = {isResolving: shouldResolve}

      if (shouldResolve) {
        this.subscription = from(this.resolveInitialValue()).subscribe(initialValue => {
          this.setState({isResolving: false, initialValue})
        })
      }
    }

    componentWillUnmount() {
      if (this.subscription) {
        this.subscription.unsubscribe()
      }
    }

    resolveInitialValue() {
      const {parameters} = this.props
      const {template} = this.props.options
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
      const {isResolving, initialValue} = this.state
      return isResolving ? (
        <LoadingPane {...this.props} message="Resolving initial value…" />
      ) : (
        <Pane {...this.props} initialValue={initialValue} />
      )
    }
  }
}
