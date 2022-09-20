import React, {ComponentProps} from 'react'
import {motion} from 'framer-motion'
import styled, {keyframes} from 'styled-components'

const StyledMotionPath = styled(motion.path)`
  transform-origin: center;
`

type MotionCircleProps = Omit<ComponentProps<typeof motion.circle>, 'd'>
type MotionPathProps = Omit<ComponentProps<typeof motion.path>, 'd'>

const Circle = (props: MotionCircleProps) => (
  <motion.circle fill="none" r="8" cx="12.5" cy="12.5" strokeWidth="1.2" {...props} />
)
const Arrows = (props: MotionPathProps) => (
  <StyledMotionPath
    fill="none"
    d="M14 17.5619L11.5 20.5L14.5 23.0619M11 7.43811L13.5 4.50001L10.5 1.93811"
    {...props}
  />
)
const Checkmark = (props: MotionPathProps) => (
  <motion.path d="M9.5 12.1316L11.7414 14.5L16 10" {...props} />
)
const Edit = (props: MotionPathProps) => (
  <motion.path d="M15 7L18 10M6 19L7 15L17 5L20 8L10 18L6 19Z" {...props} />
)

const rotateAnimation = keyframes`
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
`
const RotateGroup = styled.g`
  transform-origin: center;

  &[data-rotate] {
    animation: ${rotateAnimation} 1s ease-in-out infinite;
  }
`

const root = {
  syncing: {
    scale: 1,
    transition: {
      duration: 0,
    },
  },
  saved: {
    scale: [1, 0.8, 1.2, 0.9, 1.1, 0.95, 1.05, 0.99, 1],
    transition: {
      duration: 0.5,
      delay: 0.2,
    },
  },
  changes: {transition: {duration: 0}},
}

const circle = {
  syncing: {
    strokeDasharray: '0, 0, 23, 3, 23, 3',
    strokeDashoffset: 10,
    opacity: 1,
    transition: {
      duration: 0,
    },
  },
  saved: {
    strokeDasharray: '0, 0, 23, 0, 23, 0',
    strokeDashoffset: 10,
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
  changes: {
    strokeDasharray: '0, 60, 23, 0, 23, 0',
    strokeDashoffset: 0,
    opacity: 0,
    transition: {
      duration: 0.5,
    },
  },
}

const arrows = {
  syncing: {
    opacity: 1,
    transition: {
      duration: 0,
    },
  },
  saved: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
  changes: {
    opacity: 0,
  },
}

const checkmark = {
  syncing: {
    pathLength: 0,
    transition: {duration: 0},
  },
  saved: {
    pathLength: 1,
    transition: {
      delay: 0.4,
      duration: 0.3,
    },
  },
  changes: {
    pathLength: 0,
    transition: {
      duration: 0.2,
    },
  },
}

const edit = {
  syncing: {
    pathLength: 0,
    transition: {duration: 0},
  },
  saved: {
    pathLength: 0,
    transition: {duration: 0},
  },
  changes: {
    pathLength: 1,
    transition: {
      duration: 0.4,
      delay: 0.5,
    },
  },
}

interface AnimatedStatusIconProps {
  status?: 'changes' | 'saved' | 'syncing'
}

export function AnimatedStatusIcon(props: AnimatedStatusIconProps) {
  const {status} = props

  if (!status) {
    return null
  }

  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 25 25"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      data-sanity-icon=""
    >
      <motion.g variants={root} initial={status} animate={status}>
        <RotateGroup data-rotate={status === 'changes' ? undefined : ''}>
          <Arrows variants={arrows} initial={status} animate={status} />
          <Circle variants={circle} initial={status} animate={status} />
        </RotateGroup>
        <Checkmark variants={checkmark} initial={status} animate={status} />
        <Edit variants={edit} initial={status} animate={status} />
      </motion.g>
    </svg>
  )
}
