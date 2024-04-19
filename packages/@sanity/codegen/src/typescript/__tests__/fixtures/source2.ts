import groq from 'groq'

const postQuery = groq`*[_type == "author"]`

console.log(postQuery)
