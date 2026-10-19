// Ported from the Storybook Variants 2.0 exploration (sanity-labs/sanity-studio-storybook, branch
// explorations/variants-2-0, commit 9748ea43e0, lib/explorations/variants-2-0/icons/VersionsIcon.tsx).
// Only the imports differ from the original (they point at this monorepo and ./types).
import {forwardRef, type SVGProps} from 'react'

/**
 * The `versions` icon from the Studio Patterns library (three offset cards, a stack seen from the
 * side). `@sanity/icons` has no matching glyph (`StackCompact` is a list of lines), so it is drawn
 * here from the Figma outline. The library draws it on a 21px grid; the path is scaled to the 25px
 * grid every `@sanity/icons` icon uses, so it sizes like the rest (`width` and `height` are 1em
 * and the colour is `currentColor`). Remove this file when the glyph ships in `@sanity/icons`.
 */
export const VersionsIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  function VersionsIcon(props, ref) {
    return (
      <svg
        data-sanity-icon="versions"
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
          d="M17.221 4.11719C17.4994 4.11719 17.7247 4.34251 17.7247 4.62086V16.3809C17.7247 16.6592 17.4994 16.8845 17.221 16.8845H8.82102C8.54266 16.8845 8.31734 16.6592 8.31734 16.3809V15.2045H6.30102C6.02266 15.2045 5.79734 14.9792 5.79734 14.7009V13.5245H3.78102C3.50266 13.5245 3.27734 13.2992 3.27734 13.0209V7.98086C3.27734 7.70251 3.50266 7.47719 3.78102 7.47719H5.79734V6.30086C5.79734 6.02251 6.02266 5.79719 6.30102 5.79719H8.31734V4.62086C8.31734 4.34251 8.54266 4.11719 8.82102 4.11719H17.221ZM9.32469 15.8772H16.7173V5.12453H9.32469V15.8772ZM6.80469 14.1972H8.31734V6.80453H6.80469V14.1972ZM4.28469 12.5172H5.79734V8.48453H4.28469V12.5172Z"
          fill="currentColor"
          fillRule="evenodd"
          transform="scale(1.190476)"
        />
      </svg>
    )
  },
)
VersionsIcon.displayName = 'VersionsIcon'
