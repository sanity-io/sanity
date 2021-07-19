import React, { useState } from 'react'
import Icon from './'
import { getCurrentUser } from '../functions'
import userStore from 'part:@sanity/base/user'
import client from 'part:@sanity/base/client'

class OpenTicketsIcon extends React.Component {
  state = {
    tickets: -1
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  componentDidMount() {
    getCurrentUser()
    .then(user => {
      const query = `*[_type == "ticket" && status == "open" && assigned._ref == $userId]`
      const params = { userId: user._id }
      const getOpenTickets = () => {
        client.fetch(query, params).then(tickets => {
          this.setState({
            tickets: tickets.length
          })
        })
      }
      getOpenTickets()
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
      <Icon emoji="⏳" badge={this.state.tickets} />
    )
  }
}

export default OpenTicketsIcon
