import React from 'react'

import {Observable, Subscription} from 'rxjs'

type Props = {
  documentId: string
  materialize: (arg0: string) => Observable<Record<string, any>>
  children: (arg0: any) => null | React.ReactNode
}

type State = {
  materialized: Record<string, any> | null
}

export default class WithMaterializedDocument extends React.Component<Props, State> {
  state = {
    materialized: null,
  }

  subscription: Subscription | null

  componentDidMount() {
    this.setDocId(this.props.documentId)
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
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
      .subscribe((materialized) => this.setState({materialized}))
  }

  render() {
    const {materialized} = this.state
    const {children} = this.props
    return materialized ? children(materialized) : null
  }
}
