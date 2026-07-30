// TODO: switch to `useEffectEvent` from `react` once
// https://github.com/facebook/react/issues/34818 is fixed in the lowest React
// version we support: on React 19.2 the native hook never sees values past
// the first render when the calling component is wrapped in `forwardRef` or
// `memo`.
export {useEffectEvent} from 'use-effect-event'
