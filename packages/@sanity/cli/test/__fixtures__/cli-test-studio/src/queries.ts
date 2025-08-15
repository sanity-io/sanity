import groq from 'groq'

export const PAGE_QUERY = groq`*[_type == "page" && slug.current == $slug][0]`
