// Core fieldbuilders. May be extended and overidden by prop.formBuilderFields to FormBuilder.

export default {
  string: require('./fields/String'),
  text: require('./fields/Text'),
  list: require('./fields/list/List'),
  boolean: require('./fields/Boolean'),
  latlon: require('./fields/LatLon'),
  dateInterval: require('./fields/DateInterval'),
  date: require('./fields/Date'),
  slug: require('./fields/Slug'),
  time: require('./fields/Time'),
  dateTime: require('./fields/DateTime'),
  image: require('./fields/image/Image'),
  file: require('./fields/File'),
  attachments: require('./fields/File'),
  richtext: require('./fields/RichText'),
  category: require('./fields/Category'),
  reference: require('./fields/reference/Reference'),
  number: require('./fields/Number'),
  email: require('./fields/Email'),
  url: require('./fields/Url'),
  tags: require('./fields/Tags')
}
