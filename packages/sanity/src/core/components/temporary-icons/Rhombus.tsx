/* THIS FILE IS TEMPORARY - IMPORT FROM @SANITY/ICONS WHEN AVAILABLE */

import {type RefAttributes, type SVGProps} from 'react'

export function RhombusIcon(props: SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>) {
  const {ref, ...rest} = props
  return (
    <svg
      data-sanity-icon="rhombus"
      width="1em"
      height="1em"
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      {...rest}
    >
      <path
        d="M12.8677 8.70769C12.6646 8.50462 12.3354 8.50462 12.1323 8.70769L8.70769 12.1323C8.50462 12.3354 8.50462 12.6646 8.70769 12.8677L12.1323 16.2923C12.3354 16.4954 12.6646 16.4954 12.8677 16.2923L16.2923 12.8677C16.4954 12.6646 16.4954 12.3354 16.2923 12.1323L12.8677 8.70769Z"
        fill="currentColor"
      />
    </svg>
  )
}
