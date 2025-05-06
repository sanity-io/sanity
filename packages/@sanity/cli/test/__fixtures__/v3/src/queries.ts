import groq, {defineProjection} from 'groq'

export const PAGE_QUERY = groq`*[_type == "page" && slug.current == $slug][0]`
export const PERSON_PROJECTION = defineProjection('{name, "slugValue": slug.current}')
