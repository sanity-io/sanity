import React from 'react'
import PropTypes from 'prop-types'
import {Portal} from '../utilities/Portal'
import SnackbarItem from './SnackbarItem'

export default class SnackbarProvider extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired
  }

  static childContextTypes = {
    addToSnackQueue: PropTypes.func
  }

  constructor(props, context) {
    super(props, context)
    this.state = {
      activeSnacks: []
    }
  }

  maxStack = 3
  snackQueue = []

  get offsets() {
    const {activeSnacks} = this.state
    return activeSnacks.map((snack, index) => {
      const {view: viewOffset, snackbar: snackbarOffset} = {view: 10, snackbar: 12}
      let offset = viewOffset
      while (activeSnacks[index - 1]) {
        const snackHeight = activeSnacks[index - 1].height || 60
        offset += snackHeight + snackbarOffset
        index -= 1
      }
      return offset
    })
  }

  /*
   Set a height for the snackbar to stack them correctly
  */
  handleSetHeight = (id, height) => {
    this.setState(({activeSnacks}) => ({
      activeSnacks: activeSnacks.map(snack => (snack.id === id ? {...snack, height} : {...snack}))
    }))
  }

  addToSnackQueue = contextSnack => {
    const {activeSnacks} = this.state

    const newSnack = {
      id: new Date().getTime() + Math.floor(Math.random()),
      isOpen: true,
      ...contextSnack
    }

    if (newSnack.preventDuplicate) {
      const isInQueue = this.snackQueue.findIndex(snack => snack.kind === newSnack.kind) > -1
      const isInActive = activeSnacks.findIndex(snack => snack.kind === newSnack.kind) > -1

      if (isInQueue || isInActive) {
        return null
      }
    }
    this.snackQueue.push(newSnack)
    this.handleMaxSnackDisplay()
    return newSnack.id
  }

  /*
    Handle how snacks should be processed depending on
    max snack stack
  */
  handleMaxSnackDisplay = () => {
    const {activeSnacks} = this.state
    if (activeSnacks.length >= this.maxStack) {
      this.handleDismissOldestSnack()
    }
    this.processSnackQueue()
  }

  /*
    Make the next snack in the queue active
    by adding it to activeSnacks
  */
  processSnackQueue = () => {
    if (this.snackQueue.length > 0) {
      const newSnack = this.snackQueue.shift()
      this.setState(({activeSnacks}) => ({
        activeSnacks: [...activeSnacks, newSnack]
      }))
    }
  }

  /*
    Handle the dismissal of the oldest snack
    when the max stack of snacks has been reached
    according to persist status
  */
  handleDismissOldestSnack = () => {
    const {activeSnacks} = this.state

    let ignorePersistStatus
    let snackHasBeenRemoved

    const persistedSnackCount = activeSnacks.reduce(
      (count, current) => count + (current.isOpen && current.isPersisted ? 1 : 0),
      0
    )

    if (persistedSnackCount === this.maxStack) {
      ignorePersistStatus = true
    }
    // Find the snack to hide
    activeSnacks
      .filter(snack => snack.isOpen === true)
      .forEach(snack => {
        if (!snackHasBeenRemoved && (!snack.isPersisted || ignorePersistStatus)) {
          snackHasBeenRemoved = true
          this.handleDismissSnack(snack.id)
        }
      })
  }

  /*
    Dismiss the snack from the view, 
    then call to remove it from activeSnacks in order to
    transition it out
  */
  handleDismissSnack = id => {
    let transitionDuration
    this.setState(
      ({activeSnacks}) => ({
        activeSnacks: activeSnacks.map(snack => {
          if (snack.id === id) {
            transitionDuration = snack.transitionDuration ? snack.transitionDuration : 200
            return {...snack, isOpen: false}
          }
          return {...snack}
        })
      }),
      () => this.handleRemoveSnack(id, transitionDuration)
    )
  }

  /*
    Remove the snack from the state
    The removal is delayed in order to transition the snack out first
  */
  handleRemoveSnack = (id, transitionDuration) => {
    this._removeTimer = setTimeout(() => {
      this.setState(({activeSnacks}) => ({
        activeSnacks: activeSnacks.filter(snack => snack.id !== id)
      }))
    }, transitionDuration)
  }

  componentWillUnmount() {
    clearTimeout(this._removeTimer)
  }

  getChildContext = () => ({
    addToSnackQueue: this.addToSnackQueue
  })

  render() {
    const {activeSnacks} = this.state
    const {children} = this.props
    return (
      <div>
        {children}
        <Portal>
          <div role="region" aria-label="notifications">
            {activeSnacks.map((snack, index) => (
              <SnackbarItem
                key={snack.id}
                {...snack}
                offset={this.offsets[index]}
                onDismiss={id => this.handleDismissSnack(id)}
                onSetHeight={this.handleSetHeight}
              />
            ))}
          </div>
        </Portal>
      </div>
    )
  }
}
