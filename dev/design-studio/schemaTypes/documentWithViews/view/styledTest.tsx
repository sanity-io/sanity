import {thing} from './styledTest.css'

export function StyledTestView() {
  return (
    <div className={thing} key="test">
      Styled with <code>vanilla-extract</code>
    </div>
  )
}
