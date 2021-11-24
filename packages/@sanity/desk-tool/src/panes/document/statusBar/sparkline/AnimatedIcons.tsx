import {motion, useAnimation} from 'framer-motion'
import React, {useEffect, useState} from 'react'
import styled, {keyframes} from 'styled-components'

const rotateAnimation = keyframes`
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
`

const SyncIcon = styled.g`
  transition: opacity 200ms;
  /* animation-name: ${rotateAnimation}; */
  animation-duration: 1000ms;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  transform-origin: 'center';
`

const Root = styled.svg`
  transition: opacity 200ms;
  animation-name: ${({rotate}) => (rotate ? rotateAnimation : 'unset')};
  animation-duration: 1000ms;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  transform-origin: 'center';
`

const Circle = (props) => (
  <motion.circle
    fill="none"
    r="8"
    cx="12.5"
    cy="12.5"
    strokeWidth="1.2"
    style={{transformOrigin: 'center'}}
    animate={props.controls}
  />
)

const Arrows = (props) => (
  <motion.path
    animate={props.controls}
    style={{transformOrigin: 'center'}}
    fill="none"
    d="M14 17.5619L11.5 20.5L14.5 23.0619M11 7.43811L13.5 4.50001L10.5 1.93811"
  />
)

const Checkmark = (props) => (
  <motion.path d="M9.5 12.1316L11.7414 14.5L16 10" animate={props.controls} />
)

const EditIcon = (props) => (
  <motion.path d="M15 7L18 10M6 19L7 15L17 5L20 8L10 18L6 19Z" animate={props.controls} />
)

interface AnimatedIconsProps {
  currentState: 'syncing' | 'synced' | 'changed'
}

export function AnimatedIcons(props: AnimatedIconsProps) {
  const {currentState} = props
  const circleControls = useAnimation()
  const checkmarkControls = useAnimation()
  const arrowsControls = useAnimation()
  const syncIconControls = useAnimation()
  const editIconControls = useAnimation()
  const [rotate, setRotate] = useState(false)

  const startSyncAnimation = async () => {
    // Stop any ongoing animations
    await editIconControls.stop()
    await circleControls.stop()
    await syncIconControls.stop()
    await checkmarkControls.stop()
    await arrowsControls.stop()

    // Reset editIcon, circle, and arrows
    editIconControls.set({
      pathLength: 0,
    })
    circleControls.set({
      scale: 1,
      strokeDasharray: '23, 3',
      strokeDashoffset: '10',
    })
    checkmarkControls.set({
      pathLength: 0,
    })
    arrowsControls.set({
      pathLength: 1,
    })
    checkmarkControls.set({
      pathLength: 0,
    })
    syncIconControls.set({
      opacity: 1,
    })

    // Rotate syncIcon
    setRotate(true)
    // syncIconControls.set({

    // })
    // syncIconControls.start({
    //   rotate: [0, 360],
    //   transition: {
    //     duration: 1,
    //     repeat: Infinity,
    //     type: 'spring',
    //   },
    // })
  }

  const startSyncedAnimation = async () => {
    // Complete circle
    circleControls.start({
      strokeDasharray: '23, 0',
      transition: {duration: 0.5},
    })

    // Remove arrows
    await arrowsControls.start({
      pathLength: 0,
      transition: {duration: 0.5},
    })

    // Stop rotating syncIcon and reset any rotation
    setRotate(false)
    // syncIconControls.stop()
    // syncIconControls.set({
    //   rotate: 0,
    // })

    // Bounce the circle
    circleControls.set({
      scale: 0.8,
    })
    circleControls.start({
      scale: 1,
      transition: {
        type: 'spring',
        bounce: 0.8,
        duration: 1,
      },
    })

    // Draw checkmark
    checkmarkControls.start({
      pathLength: 1,
    })
  }

  const startChangedAnimation = async () => {
    // Remove circle
    await circleControls.set({
      strokeDasharray: '50, 50',
      strokeDashoffset: '50',
    })

    // Remove checkmark
    checkmarkControls.start({
      pathLength: 0,
      transition: {
        ease: 'anticipate',
        duration: 0.5,
      },
    })

    // Erase circle
    await circleControls.start({
      strokeDasharray: '0, 50',
      strokeDashoffset: '0',
      transition: {
        ease: 'anticipate',
        duration: 0.5,
      },
    })

    // Draw in editIcon
    editIconControls.start({
      pathLength: 1,
      transition: {
        duration: 0.5,
      },
    })
  }

  useEffect(() => {
    if (currentState === 'syncing') {
      startSyncAnimation()
      return
    }

    if (currentState === 'synced') {
      startSyncedAnimation()
      return
    }

    if (currentState === 'changed') {
      startChangedAnimation()
      return
    }

    syncIconControls.set({
      opacity: 0,
    })
  }, [currentState])

  return (
    <Root
      width="25"
      height="25"
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth="1.2"
      className="default"
      rotate={rotate}
    >
      <SyncIcon>
        <Circle controls={circleControls} />
        <Arrows controls={arrowsControls} />
        <Checkmark controls={checkmarkControls} />
      </SyncIcon>
      <EditIcon controls={editIconControls} />
    </Root>
  )
}
