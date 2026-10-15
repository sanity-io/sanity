// Stands in for `defineLocalesResources` from `sanity`, which returns the strings as is
function defineLocalesResources<T>(_namespace: string, strings: T): T {
  return strings
}

export default defineLocalesResources('comments', {
  'compose.placeholder': 'Write a comment',
  'v2.only': 'Only in comments v2',
})
