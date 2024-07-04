// TODO: Get this file from @sanity/icons

import {forwardRef} from 'react'

/**
 * @public
 */
export const Progress50Icon = forwardRef(function Progress50Icon(
  props: React.SVGProps<SVGSVGElement>,
  ref: React.Ref<SVGSVGElement>,
) {
  return (
    <svg
      data-sanity-icon="progress-50"
      width="1em"
      height="1em"
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      {...props}
    >
      <g id="icon">
        <path
          id="fill+stroke"
          d="M14.78 10.4997C14.78 12.5874 13.0876 14.2797 11 14.2797V6.71973C13.0876 6.71973 14.78 8.41209 14.78 10.4997Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={1.2}
          strokeLinejoin="round"
        />
        <path
          id="stroke"
          d="M11 16.3801C14.2474 16.3801 16.88 13.7476 16.88 10.5001C16.88 7.25268 14.2474 4.62012 11 4.62012C7.75256 4.62012 5.12 7.25268 5.12 10.5001C5.12 13.7476 7.75256 16.3801 11 16.3801Z"
          stroke="currentColor"
          strokeWidth={1.2}
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
})
