/* THIS FILE IS TEMPORARY - IMPORT FROM @SANITY/ICONS WHEN AVAILABLE */

import {type RefAttributes, type SVGProps} from 'react'

/**
 * @public
 */
export function ClockSmallIcon(props: SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>) {
  const {ref, ...rest} = props
  return (
    <svg
      data-sanity-icon="clock-small"
      width="1em"
      height="1em"
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      {...rest}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.1074 12.248L15.1113 14.252L14.252 15.1113L12.0703 12.9297C11.9565 12.8158 11.8926 12.6614 11.8926 12.5V9.24023H13.1074V12.248Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.5 6.79199C15.6524 6.79203 18.208 9.34762 18.208 12.5C18.208 15.6524 15.6524 18.208 12.5 18.208C9.34762 18.208 6.79203 15.6524 6.79199 12.5C6.79203 9.34762 9.34762 6.79203 12.5 6.79199ZM12.5 8.00781C10.0192 8.00785 8.00785 10.0192 8.00781 12.5C8.00785 14.9808 10.0192 16.9921 12.5 16.9922C14.9808 16.9921 16.9921 14.9808 16.9922 12.5C16.9921 10.0192 14.9808 8.00785 12.5 8.00781Z"
        fill="currentColor"
      />
    </svg>
  )
}

export {ClockSmallIcon as default}
