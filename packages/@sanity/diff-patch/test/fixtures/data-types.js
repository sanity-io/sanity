exports.a = {
  _id: 'die-hard-iii',
  _type: 'movie',
  title: 'Die Hard 3', // String
  rating: 3.14, // Float
  isFeatured: true, // Boolean
  characters: ['John McClane'], // Array
  slug: {current: 'die-hard-iii'}, // Object
  year: 1994 // Integer
}

exports.b = {
  _id: 'die-hard-iii',
  _type: 'movie',
  title: 'Die Hard with a Vengeance', // String
  rating: 4.24, // Float
  isFeatured: false, // Boolean
  characters: ['Simon Gruber'], // Array
  slug: {current: 'die-hard-with-a-vengeance'}, // Object
  year: 1995 // Integer
}

exports.c = {
  _id: 'die-hard-iii',
  _type: 'movie',
  title: ['Die Hard with a Vengeance'], // String => Array
  rating: {current: 4.24}, // Float => Object
  isFeatured: 'yup', // Boolean => String
  characters: {simon: 'Simon Gruber'}, // Array => Object
  slug: 'die-hard-with-a-vengeance', // Object => String
  year: {released: 1995} // Integer => Object
}

exports.d = {
  _id: 'die-hard-iii',
  _type: 'movie',
  title: 'Die Hard 3', // String
  rating: 3.14, // Float
  isFeatured: true, // Boolean
  characters: ['John McClane'], // Array
  slug: ['die-hard-with-a-vengeance'], // Object => Array
  year: 1994 // Integer
}
