import groq from 'groq'

type X = 'seont'

const idkMaybeASibling = 'test'

// @sanity-typegen-ignore
export const postQuery = groq`*[_type == "author"]`
