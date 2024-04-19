import groq from 'groq'

export const postQuery = groq`*[_type == "author"]`

console.log(postQuery)
