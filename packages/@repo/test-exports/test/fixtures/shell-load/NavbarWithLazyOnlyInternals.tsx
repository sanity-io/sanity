import {type NavbarProps} from 'sanity'
import {CommentDisabledIcon} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver/2'

export function NavbarWithLazyOnlyInternals(props: NavbarProps) {
  return (
    <>
      {props.renderDefault(props)}
      <CommentDisabledIcon />
    </>
  )
}
