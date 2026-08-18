/* THIS FILE IS TEMPORARY - IMPORT FROM @SANITY/ICONS WHEN AVAILABLE */

import {type RefAttributes, type SVGProps} from 'react'

/**
 * @public
 */
export function RhombusOutlinedIcon(props: SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>) {
  const {ref, ...rest} = props
  return (
    <svg
      data-sanity-icon="rhombus-outlined"
      width="1em"
      height="1em"
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      {...rest}
    >
      <path
        d="M12.6093 7.89167C12.6342 7.89773 12.6593 7.90569 12.6835 7.91609L12.7538 7.95417L12.7607 7.95906L12.7665 7.96394L12.8154 8.00398L12.8212 8.00788L12.8261 8.01374L16.9863 12.1739C17.0078 12.1955 17.0284 12.2189 17.0458 12.2452C17.08 12.2968 17.102 12.3542 17.1132 12.4122C17.1244 12.4702 17.1244 12.53 17.1132 12.588C17.102 12.6459 17.0797 12.7026 17.0458 12.754C17.0283 12.7805 17.0079 12.8046 16.9863 12.8262L12.8261 16.9864C12.6457 17.1666 12.3541 17.1667 12.1738 16.9864L8.0136 12.8262C7.83335 12.6459 7.83335 12.3543 8.0136 12.1739L12.1738 8.01374C12.2923 7.89524 12.4585 7.85506 12.6093 7.89167ZM8.99211 12.4991L12.4999 16.0069L16.0068 12.4991L12.4999 8.99226L8.99211 12.4991Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={0.3}
      />
    </svg>
  )
}

export {RhombusOutlinedIcon as default}
