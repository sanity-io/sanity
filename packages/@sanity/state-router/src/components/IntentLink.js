import React, {PropTypes} from 'react'
import omit from 'lodash/omit'
import Link from './Link'

export default class IntentLink extends React.Component {
  static propTypes = {
    intent: PropTypes.string.isRequired,
    params: PropTypes.object
  }

  static contextTypes = {
    __internalRouter: PropTypes.object
  }

  render() {
    const {intent, params} = this.props

    const url = this.context.__internalRouter.resolveIntentLink(intent, params)
    const rest = omit(this.props, 'intent', 'params')
    return <Link href={url} {...rest} />
  }
}
