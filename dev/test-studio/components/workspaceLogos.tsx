import React from 'react'
import {useColorScheme} from 'sanity'

export const VercelLogo = () => {
  const {scheme} = useColorScheme()
  const fill = scheme === 'dark' ? '#fff' : '#000'

  return (
    <svg
      width="1155"
      height="1000"
      viewBox="0 0 1155 1000"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{padding: 4, boxSizing: 'border-box'}}
    >
      <path d="M577.344 0L1154.69 1000H0L577.344 0Z" fill={fill} />
    </svg>
  )
}

export const GoogleLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="512px" width="512px" viewBox="0 0 512 512">
    <path fill="#4285f4" d="M386 400c45-42 65-112 53-179H260v74h102c-4 24-18 44-38 57z" />
    <path fill="#34a853" d="M90 341a192 192 0 0 0 296 59l-62-48c-53 35-141 22-171-60z" />
    <path fill="#fbbc02" d="M153 292c-8-25-8-48 0-73l-63-49c-23 46-30 111 0 171z" />
    <path fill="#ea4335" d="M153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55z" />
  </svg>
)

export const TailwindLogo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 54 33"
    style={{padding: 4, boxSizing: 'border-box'}}
  >
    <g clipPath="url(#prefix__clip0)">
      <path
        fill="#38bdf8"
        fillRule="evenodd"
        d="M27 0c-7.2 0-11.7 3.6-13.5 10.8 2.7-3.6 5.85-4.95 9.45-4.05 2.054.513 3.522 2.004 5.147 3.653C30.744 13.09 33.808 16.2 40.5 16.2c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.513-3.522-2.004-5.147-3.653C36.756 3.11 33.692 0 27 0zM13.5 16.2C6.3 16.2 1.8 19.8 0 27c2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C17.244 29.29 20.308 32.4 27 32.4c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.513-3.522-2.004-5.147-3.653C23.256 19.31 20.192 16.2 13.5 16.2z"
        clipRule="evenodd"
      />
    </g>
    <defs>
      <clipPath id="prefix__clip0">
        <path d="M0 0h54v32.4H0z" />
      </clipPath>
    </defs>
  </svg>
)
