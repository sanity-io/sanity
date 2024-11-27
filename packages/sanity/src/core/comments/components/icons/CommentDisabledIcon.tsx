import {forwardRef, type Ref, type SVGProps} from 'react'

/**
 * @internal
 */
export const CommentDisabledIcon = forwardRef(function Icon(
  props: SVGProps<SVGSVGElement>,
  ref: Ref<SVGSVGElement>,
) {
  return (
    <svg
      data-sanity-icon="comment-disabled"
      width="1em"
      height="1em"
      ref={ref}
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M5.92627 14.5381H7.92627V18.5381L11.9263 14.5381H15.9263C17.0308 14.5381 17.9263 13.6427 17.9263 12.5381V6.53809C17.9263 5.43352 17.0308 4.53809 15.9263 4.53809H5.92627C4.8217 4.53809 3.92627 5.43352 3.92627 6.53809V12.5381C3.92627 13.6427 4.8217 14.5381 5.92627 14.5381Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M2.77256 2.66835C2.54413 2.51319 2.23317 2.57259 2.07802 2.80103L1.40378 3.7937C1.32927 3.9034 1.30139 4.0382 1.32627 4.16845C1.35115 4.29871 1.42676 4.41374 1.53646 4.48825L19.5861 16.7479C19.8146 16.903 20.1255 16.8436 20.2807 16.6152L20.9549 15.6225C21.0294 15.5128 21.0573 15.378 21.0324 15.2478C21.0076 15.1175 20.9319 15.0025 20.8222 14.928L2.77256 2.66835Z"
        fill="currentColor"
        strokeLinejoin="round"
      />
    </svg>
  )
})
