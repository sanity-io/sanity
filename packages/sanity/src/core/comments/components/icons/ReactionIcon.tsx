import {forwardRef, type Ref, type SVGProps} from 'react'

export const ReactionIcon = forwardRef(function Icon(
  props: SVGProps<SVGSVGElement>,
  ref: Ref<SVGSVGElement>,
) {
  return (
    <svg
      data-sanity-icon="add-reaction"
      fill="none"
      height="1em"
      ref={ref}
      viewBox="0 0 25 25"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M10.1044 10.4011L10.1044 10.9972"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="square"
      />
      <path
        d="M14.2393 10.4011L14.2393 10.9972"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="square"
      />
      <path
        d="M7.12128 14.1151C7.70803 15.0226 9.66113 16.8377 11.7735 16.8377C13.8859 16.8377 15.6713 15.0226 16.4257 14.1151"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="square"
      />
      <path
        d="M16.703 6.43905C15.3486 5.36511 13.6357 4.72374 11.773 4.72374C7.38731 4.72374 3.83203 8.27902 3.83203 12.6647C3.83203 17.0503 7.38731 20.6056 11.773 20.6056C16.0995 20.6056 19.618 17.1455 19.712 12.8415"
        stroke="currentColor"
        strokeWidth={1.2}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.1135 9.03425L19.1135 11.4903L20.3135 11.4903L20.3135 9.03425L22.7693 9.03425L22.7693 7.83425L20.3135 7.83425L20.3135 5.37941L19.1135 5.37941L19.1135 7.83425L16.6584 7.83425L16.6584 9.03425L19.1135 9.03425Z"
        fill="currentColor"
      />
    </svg>
  )
})
