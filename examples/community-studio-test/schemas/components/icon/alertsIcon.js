import React, { useState } from 'react'
import Icon from './'
import { getCurrentUser } from '../functions'
import userStore from 'part:@sanity/base/user'
import client from 'part:@sanity/base/client'

class AlertsIcon extends React.Component {
  state = {
    tickets: -1
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  componentDidMount() {
    const today = new Date()
    const weekAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000))
    const dayAgo = new Date(today.getTime() - (24 * 60 * 60 * 1000))
    const weekTimestamp = (weekAgo.getTime()/1000|0).toString()
    const dayTimestamp = (dayAgo.getTime()/1000|0).toString()

    getCurrentUser()
    .then(user => {
      const slackId = user.slackId ? user.slackId : ''
      const query = `*[
        _type == $type &&
        thread[-1].timestamp > $weekTimestamp && (
          (
            status == "open" &&
            (
              thread[].content match $slackId ||
              (
                !defined(thread[1]) &&
                thread[0].timestamp < $dayTimestamp
              )
            )
          ) || (
            status == "resolved" &&
            thread[-2].timestamp < $weekTimestamp
          )
        )
      ]`

      const params = { type: 'ticket', weekTimestamp, dayTimestamp, slackId }
      client.fetch(query, params).then(tickets => {
        this.setState({
          tickets: tickets.length
        })
      })

      this.subscription = client.listen(query, params, {includeResult: false})
        .subscribe(update => {
          if (update.transition == 'appear') {
            this.setState({
              tickets: this.state.tickets + 1
            })
          }
          if (update.transition == 'disappear') {
            this.setState({
              tickets: this.state.tickets - 1
            })
          }
      })
    })
  }

  unsubscribe() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }
  render() {
    return (
      <Icon emoji="⏰" badge={this.state.tickets} alert />
    )
  }
}

export default AlertsIcon
