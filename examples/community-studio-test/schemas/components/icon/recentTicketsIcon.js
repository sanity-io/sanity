import React, { useState } from 'react'
import Icon from './'
import client from 'part:@sanity/base/client'

class RecentTicketsIcon extends React.Component {
  state = {
    tickets: -1
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  componentDidMount() {
    const today = new Date()
    const date = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000))
    const timestamp = (date.getTime()/1000|0).toString()
    const query = `*[_type == "ticket" && thread[0].timestamp > $timestamp]`
    const params = { timestamp }
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
  }

  unsubscribe() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }
  render() {
    return (
      <Icon emoji="🗓️" badge={this.state.tickets} />
    )
  }
}

export default RecentTicketsIcon
