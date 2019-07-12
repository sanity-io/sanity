import React from 'react'
import PropTypes from 'prop-types'
import SnackbarItem from './SnackbarItem'

export default class SnackbarProvider extends React.Component {
  static propTypes = {
    maxStack: PropTypes.number,
    preventDuplicate: PropTypes.bool,
    options: PropTypes.object,
    transitionDuration: PropTypes.number,
    children: PropTypes.node.isRequired
  }

  static defaultProps = {
    maxStack: 3,
    transitionDuration: 200,
    preventDuplicate: false
  }

  static childContextTypes = {
    addToSnackQueue: PropTypes.func,
    handleDismissSnack: PropTypes.func
  }

  constructor(props, context) {
    super(props, context)
    this.state = {
      activeSnacks: []
    }
  }

  snackQueue = []

  get offsets() {
    const {activeSnacks} = this.state
    return activeSnacks.map((snack, index) => {
      const {view: viewOffset, snackbar: snackbarOffset} = {view: 5, snackbar: 12}
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

  /* 
    Generate mock snacks of random kinds
    for test purposes only
  */
  generateSnack = () => {
    const kinds = [
      {
        kind: 'danger',
        icon: '❌'
      },
      {
        kind: 'info',
        icon: '👀'
      },
      {
        kind: 'warning',
        icon: '⚠️'
      },
      {
        kind: 'error',
        icon: '👎'
      },
      {
        kind: 'success',
        icon: '🎉'
      }
    ]
    const randomKind = kinds[Math.floor(Math.random() * 4)]
    const randomPersist = Math.random() >= 0.5
    const id = new Date().getTime() + Math.floor(Math.random())
    const an = randomKind.kind === 'info' || randomKind.kind === 'error'
    return {
      id: id,
      message: `This is ${an ? 'an' : 'a'} ${randomKind.kind} message.`,
      kind: randomKind.kind,
      icon: randomKind.icon,
      isOpen: true
      // setFocus: true
    }
  }

  addToSnackQueue = contextSnack => {
    const {preventDuplicate} = this.props
    const {activeSnacks} = this.state

    const newSnack = {
      id: new Date().getTime() + Math.floor(Math.random()),
      isOpen: true,
      ...contextSnack
    }

    if (preventDuplicate) {
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
    const {maxStack} = this.props
    if (activeSnacks.length >= maxStack) {
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
    const {maxStack} = this.props

    let ignorePersistStatus
    let snackHasBeenRemoved

    const persistedSnackCount = activeSnacks.reduce(
      (count, current) => count + (current.isOpen && current.isPersisted ? 1 : 0),
      0
    )

    if (persistedSnackCount === maxStack) {
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
    this.setState(
      ({activeSnacks}) => ({
        activeSnacks: activeSnacks.map(snack =>
          snack.id === id ? {...snack, isOpen: false} : {...snack}
        )
      }),
      () => this.handleRemoveSnack(id)
    )
  }

  /*
    Remove the snack from the state
    The removal is delayed in order to transition the snack out first
  */
  handleRemoveSnack = id => {
    setTimeout(() => {
      this.setState(({activeSnacks}) => ({
        activeSnacks: activeSnacks.filter(snack => snack.id !== id)
      }))
    }, this.props.transitionDuration)
  }

  getChildContext = () => ({
    addToSnackQueue: this.addToSnackQueue,
    handleDismissSnack: this.handleDismissSnack
  })

  render() {
    const {activeSnacks} = this.state
    const {children, transitionDuration} = this.props
    return (
      <div>
        {children}
        {activeSnacks.map((snack, index) => (
          <SnackbarItem
            key={snack.id}
            {...snack}
            tabIndex={activeSnacks.length - index}
            offset={this.offsets[index]}
            onDismiss={id => this.handleDismissSnack(id)}
            transitionDuration={transitionDuration}
            onSetHeight={this.handleSetHeight}
          />
        ))}
      </div>
    )
  }
}
