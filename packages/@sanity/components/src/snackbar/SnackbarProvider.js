import React from 'react'
import PropTypes from 'prop-types'
import SnackbarItem from './SnackbarItem'

/*
  TODO:

  Functionality:
  - Add logic for getting height of snack rather than setting a hardcoded one (in get offsets())
  - Context
    - Add children as props, this will be the studio
    - Add children before the snackbar

  Accessibility fixes:
  - aria-role
  - aria-labelledby
  - focus

  Refactoring:
  - Add consistent transitions and timeouts

*/

export default class SnackbarProvider extends React.Component {

  static propTypes = {
    maxStack: PropTypes.number,
    options: PropTypes.object,
    transitionDuration: PropTypes.number,
    children: PropTypes.node.isRequired
  }

  static defaultProps = {
    maxStack: 3,
    transitionDuration: 200
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
    const { activeSnacks } = this.state
    return activeSnacks.map((snack, index) => {
      const { view: viewOffset, snackbar: snackbarOffset } = { view: 5, snackbar: 12 }
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
  handleSetHeight = (key, height) => {
    this.setState(({ activeSnacks }) => ({
      activeSnacks: activeSnacks.map(snack => (
        snack.key === key ? { ...snack, height } : { ...snack }
      ))
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
    const an = randomKind.kind === 'info' ||randomKind.kind === 'error'
    return {
      key: id,
      message: `This is ${an ? 'an' : 'a'} ${ randomKind.kind } message.`,
      kind: randomKind.kind,
      icon: randomKind.icon,
      open: true,
      // persist: randomPersist
    }
  }

  addToSnackQueue = (contextSnack) => {
    const { preventDuplicate } = this.props.options
    const { activeSnacks } = this.state

    const newSnack = {
      key: new Date().getTime() + Math.floor(Math.random()),
      open: true,
      ...contextSnack
    }

    if(preventDuplicate) {
      const isInQueue = this.snackQueue.findIndex(snack => snack.kind === newSnack.kind) > -1
      const isInActive = activeSnacks.findIndex(snack => snack.kind === newSnack.kind) > -1
      
      if (isInQueue || isInActive) {
        console.log('This snack already exists')
        return null
      }
    }
    this.snackQueue.push(newSnack)
    this.handleMaxSnackDisplay()
    return newSnack.key
  }

  /*
    Handle how snacks should be processed depending on
    max snack stack
  */
  handleMaxSnackDisplay = () => {
    const { activeSnacks } = this.state
    const { maxStack } = this.props
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
      this.setState(({ activeSnacks }) => ({
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
    const { activeSnacks } = this.state
    const { maxStack } = this.props

    let ignorePersistStatus
    let snackHasBeenRemoved

    const persistedSnackCount = this.state.activeSnacks.reduce((count, current) => (
      count + (current.open && current.persist ? 1 : 0)
    ), 0)

    if(persistedSnackCount === maxStack) {
      console.log('All current snacks have persist: true. Will proceed to remove oldest one.')
      ignorePersistStatus = true
    }
    // Find the snack to hide
    this.state.activeSnacks
      .filter(snack => snack.open === true)
      .forEach((snack) => {
        if (!snackHasBeenRemoved && (!snack.persist || ignorePersistStatus)) {
          snackHasBeenRemoved = true
          this.handleDismissSnack(snack.key)
        }
      })
  }

  /*
    Dismiss the snack from the view, 
    then call to remove it from activeSnacks in order to
    transition it out
  */
  handleDismissSnack = (key) => {
    this.setState(({ activeSnacks }) => ({
      activeSnacks: activeSnacks.map(snack => (
        snack.key === key
          ? { ...snack, open: false}
          : { ...snack }
      ))
    }), () => this.handleRemoveSnack(key))
  }

  /*
    Remove the snack from the state
    The removal is delayed in order to transition the snack out first
  */
  handleRemoveSnack = (key) => {
    setTimeout(() => {
      this.setState(({ activeSnacks }) => ({
        activeSnacks: activeSnacks.filter(snack => snack.key !== key)
      }))
    }, this.props.transitionDuration)
  }

  getChildContext = () => ({
    addToSnackQueue: this.addToSnackQueue,
    handleDismissSnack: this.handleDismissSnack
  })

  render() {
    const { activeSnacks } = this.state
    const { children, transitionDuration } = this.props
    return (
      <div>
        { children }
        {
          activeSnacks.map((snack, index) => (
            <SnackbarItem
              key={snack.key}
              snack={snack}
              offset={this.offsets[index]}
              onClose={(key) => this.handleDismissSnack(key)}
              transitionDuration={transitionDuration}
              onSetHeight={this.handleSetHeight}
            />
          ))
        }
      </div>
    )
  }
}
