import React, {forwardRef} from 'react'

/**
 * @beta
 * @hidden
 */
export const SendIcon = forwardRef(function Icon(
  props: React.SVGProps<SVGSVGElement>,
  ref: React.Ref<SVGSVGElement>,
) {
  return (
    <svg
      data-sanity-icon="send"
      fill="none"
      height="1em"
      ref={ref}
      viewBox="0 0 25 25"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        clipRule="evenodd"
        d="M21.1602 12.5L7.16016 19.5V14.8765L13.6656 12.4989L7.16016 9.97149L7.16016 5.5L21.1602 12.5Z"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </svg>
  )
})
