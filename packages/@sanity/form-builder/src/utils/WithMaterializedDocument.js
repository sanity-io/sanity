// @flow
import React from 'react'
import type {Node} from 'react'
import type {ObservableI, Subscription} from '../typedefs/observable'

type Props = {
  documentId: string,
  materialize: string => ObservableI<Object>,
  children: Object => null | Node
}

type State = {
  materialized: ?Object
}

export default class WithMaterializedDocument extends React.Component<Props, State> {
  state = {
    materialized: null
  }

  subscription: ?Subscription

  componentDidMount() {
    this.setDocId(this.props.documentId)
  }

  componentWillReceiveProps(nextProps: Props) {
    if (this.props.documentId !== nextProps.documentId) {
      this.setDocId(nextProps.documentId)
    }
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  unsubscribe() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  setDocId(docId: string) {
    this.unsubscribe()
    if (!docId) {
      this.setState({materialized: null})
      return
    }
    this.subscription = this.props
      .materialize(docId)
      .subscribe(materialized => this.setState({materialized}))
  }

  render() {
    const {materialized} = this.state
    const {children} = this.props
    return materialized ? children(materialized) : null
  }
}
