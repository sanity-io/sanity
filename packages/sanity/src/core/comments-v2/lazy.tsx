import {createLazyComponent} from '../components/lazy/createLazyComponent'

// See ../comments/lazy.tsx: keeps the comments store and UI out of the entry's static graph.
export const CommentsProvider = createLazyComponent(() =>
  import('./context/comments/CommentsProvider').then((module) => module.CommentsProvider),
)
