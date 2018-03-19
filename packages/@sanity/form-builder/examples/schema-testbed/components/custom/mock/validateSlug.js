export default function(slug) {
  if (slug === 'foobar') {
    return Promise.resolve("'foobar' is already taken ya!")
  }
  return Promise.resolve()
}
