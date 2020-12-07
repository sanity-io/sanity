import {Portal} from '@sanity/ui'
import React from 'react'
import PropTypes from 'prop-types'
import SnackbarItem from './SnackbarItem'
import {SnackbarItemType} from './types'

interface SnackbarProviderProps {
  children: React.ReactNode
}

interface State {
  activeSnacks: SnackbarItemType[]
}

// This determines (in pixels) how far from the bottom of the screen
// the lowest of the snackbars will be placed:
const SNACKBAR_MARGIN_BOTTOM = 76

export default class SnackbarProvider extends React.Component<SnackbarProviderProps, State> {
  static childContextTypes = {
    addToSnackQueue: PropTypes.func,
    handleDismissSnack: PropTypes.func,
    updateSnack: PropTypes.func,
  }

  state: State = {
    activeSnacks: [],
  }

  maxStack = 3
  snackQueue: SnackbarItemType[] = []

  _removeTimer?: number

  get offsets() {
    const {activeSnacks} = this.state
    return activeSnacks.map((snack, index) => {
      const {view: viewOffset, snackbar: snackbarOffset} = {
        view: SNACKBAR_MARGIN_BOTTOM,
        snackbar: 12,
      }
      let offset = viewOffset
      let i = index
      while (activeSnacks[i - 1]) {
        const snackHeight = activeSnacks[i - 1].height || 60
        offset += snackHeight + snackbarOffset
        i -= 1
      }
      return offset
    })
  }

  /*
   Set a height for the snackbar to stack them correctly
  */
  handleSetHeight = (id: number, height: number) => {
    this.setState(({activeSnacks}) => ({
      activeSnacks: activeSnacks.map((snack) =>
        snack.id === id ? {...snack, height} : {...snack}
      ),
    }))
  }

  addToSnackQueue = (contextSnack: SnackbarItemType) => {
    const {activeSnacks} = this.state

    const newSnack: SnackbarItemType = {
      ...contextSnack,
      id: new Date().getTime() + Math.floor(Math.random() * 10000),
      isOpen: true,
    }

    if (!newSnack.allowDuplicateSnackbarType) {
      const isInQueue = this.snackQueue.findIndex((snack) => snack.kind === newSnack.kind) > -1
      const isInActive = activeSnacks.findIndex((snack) => snack.kind === newSnack.kind) > -1

      if (isInQueue || isInActive) {
        return null
      }
    }
    this.snackQueue.push(newSnack)
    this.handleMaxSnackDisplay()
    return newSnack.id
  }

  updateSnack = (snackId, contextSnack) => {
    const indexInQueue = this.snackQueue.findIndex((snack) => snack.id === snackId)
    if (indexInQueue > -1) {
      this.snackQueue[indexInQueue] = {...this.snackQueue[indexInQueue], ...contextSnack}
    } else {
      this.setState(({activeSnacks}) => ({
        activeSnacks: activeSnacks.map((snack) =>
          snack.id === snackId ? {...snack, ...contextSnack} : snack
        ),
      }))
    }
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

      if (newSnack) {
        this.setState(({activeSnacks}) => ({
          activeSnacks: [...activeSnacks, newSnack],
        }))
      }
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
      .filter((snack) => snack.isOpen === true)
      .forEach((snack) => {
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
  handleDismissSnack = (id: number | string) => {
    this.setState(
      ({activeSnacks}) => ({
        activeSnacks: activeSnacks.map((snack) => {
          if (snack.id === id) return {...snack, isOpen: false}
          return {...snack}
        }),
      }),
      () => this.handleRemoveSnack(id)
    )
  }

  /*
    Remove the snack from the state
    The removal is delayed in order to transition the snack out first
  */
  handleRemoveSnack = (id: number | string) => {
    this._removeTimer = setTimeout(() => {
      this.setState(({activeSnacks}) => ({
        activeSnacks: activeSnacks.filter((snack) => snack.id !== id),
      }))
    }, 200)
  }

  componentWillUnmount() {
    if (this._removeTimer) {
      clearTimeout(this._removeTimer)
      this._removeTimer = undefined
    }
  }

  getChildContext = () => ({
    addToSnackQueue: this.addToSnackQueue,
    handleDismissSnack: this.handleDismissSnack,
    updateSnack: this.updateSnack,
  })

  render() {
    const {activeSnacks} = this.state
    const {children} = this.props
    return (
      <>
        {children}
        <Portal>
          <div role="region" aria-label="notifications" tabIndex={-1}>
            {activeSnacks.map((snack, index) => (
              <SnackbarItem
                key={snack.id}
                {...snack}
                offset={this.offsets[index]}
                onDismiss={this.handleDismissSnack}
                onSetHeight={this.handleSetHeight}
              />
            ))}
          </div>
        </Portal>
      </>
    )
  }
}
