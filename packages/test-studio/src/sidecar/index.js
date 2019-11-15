// Add this to sanity.json if you want confetti in the sidecar
// {
//   "implements": "part:@sanity/default-layout/sidecar",
//   "path": "src/sidecar/index.js"
// },

/* eslint-disable react/no-multi-comp */
import React from 'react'
import ToggleSidecarButton from 'react-icons/lib/ti/weather-snow'
import Confetti from 'react-confetti'

export function SidecarLayout() {
  return <Confetti numberOfPieces={400} opacity={0.7} />
}

export function SidecarToggleButtonIcon() {
  return <ToggleSidecarButton />
}
