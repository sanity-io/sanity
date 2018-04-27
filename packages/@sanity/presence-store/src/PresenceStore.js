/* global window */

import Observable from '@sanity/observable/minimal'
import UUID from '@sanity/uuid'
import deepEqual from 'deep-equal'

const RESEND_REPORT_INTERVAL = 15000
const STATE_TIMEOUT_INTERVAL = RESEND_REPORT_INTERVAL * 2

function hashKeyForState(identity, session) {
  return `${identity}__${session}`
}

export default class PresenceStore {
  constructor(connection, channel) {
    this.connection = connection
    this.unsubscribeListener = this.connection.listen().subscribe(this.handleMessage).unsubscribe
    this.myState = {}
    this.states = new Map()
    this.timestamps = new Map()
    this.resendReportTimer = null
    this.changeReportDebounceTimer = null
    this.performPurgeTimer = setInterval(this.performPurge, 2000)
    this.sessionId = UUID()
    this.requestRollCall()

    // List of functions that will be called with presence change notifications
    this.subscriberCallbacks = []
  }

  // Close Presence Store, should be called when window closes
  close() {
    this.connection.sendBeacon({type: 'disconnect', session: this.sessionId})
    this.unsubscribeListener()
    clearTimeout(this.resendReportTimer)
    clearInterval(this.performPurgeTimer)
    clearTimeout(this.changeReportDebounceTimer)
  }

  // The observable that all subscribers will use to track state changes
  presence = new Observable(observer => {
    // Send initial state
    observer.next(this.getStateReport())

    // Set up subscription to track subsequent changes
    const reporter = value => {
      observer.next(value)
    }
    this.subscriberCallbacks.push(reporter)

    // Create and return unsubscriber
    const unsubscribe = () => {
      this.subscriberCallbacks = this.subscriberCallbacks.filter(cb => cb != reporter)
    }
    return unsubscribe
  })

  // Call this to report this clients state
  reportMyState(state) {
    this.myState = state
    this.sendMyState()
  }

  // Updates state for a client based on an incoming state message
  updateClientState(msg) {
    // Construct next state object
    const state = {identity: msg.i, ...msg.m}
    delete state.type

    // The cache key for this state
    const key = hashKeyForState(msg.i, msg.m.session)

    // Only update state if state is actually changed
    if (!deepEqual(state, this.states.get(key))) {
      this.states.set(key, state)
      this.handleRemoteChange()
    }

    // Update timestamp for this cache key
    this.timestamps.set(key, Date.now())
  }

  handleMessage = msg => {
    // Ignore messages from ourselves
    if (msg.m.session == this.sessionId) {
      return
    }
    switch (msg.m.type) {
      case 'state': {
        this.updateClientState(msg)
        return
      }
      case 'rollCall':
        this.sendMyState()
        break
      case 'disconnect':
        this.states.delete(hashKeyForState(msg.i, msg.m.session))
        this.handleRemoteChange()
        break
      default:
    }
  }

  // Purge state objects for clients that have not reported for STATE_TIMEOUT_INTERVAL millis
  performPurge = () => {
    const now = Date.now()
    Array.from(this.states.keys()).forEach(key => {
      const age = now - this.timestamps.get(key)
      if (age > STATE_TIMEOUT_INTERVAL) {
        this.states.delete(key)
        this.timestamps.delete(key)
        this.handleRemoteChange()
      }
    })
  }

  // Called whenever the remote states change
  handleRemoteChange() {
    // Reports changes with a slight debounce
    clearTimeout(this.changeReportDebounceTimer)
    this.changeReportDebounceTimer = setTimeout(this.reportChangesToAllSubscribers, 250)
  }

  getStateReport() {
    return Array.from(this.states.keys())
      .sort()
      .map(key => this.states.get(key))
  }

  reportChangesToAllSubscribers = () => {
    const report = this.getStateReport()
    this.subscriberCallbacks.forEach(cb => cb(report))
  }

  sendMyState() {
    clearTimeout(this.resendReportTimer)
    this.send('state', this.myState)
    this.resendReportTimer = setTimeout(() => {
      this.sendMyState()
    }, RESEND_REPORT_INTERVAL)
  }

  requestRollCall() {
    this.send('rollCall', {})
  }

  send(msgType, msg) {
    return this.connection.send({
      type: msgType,
      session: this.sessionId,
      ...msg
    })
  }
}
