module.exports = groq
groq.displayName = 'graphql'
groq.aliases = []
// keywords = '&& || | [ ] { } ( ) > < == >= <= order path match asc desc references defined'

function groq(Prism) {
  Prism.languages.groq = {
    comment: /\/\/.*/,
    string: {
      pattern: /"(?:\\.|[^\\"\r\n])*"/,
      greedy: true
    },
    number: /(\\$\\W)|((\\$|\\@\\@?)(\\w+))/i,
    boolean: /\b(?:true|false)\b/,
    variable: /\$[_A-Za-z][_0-9A-Za-z]*/i,
    keyword: /\b(?:\*|order|path|match|asc|desc|references|defined)\b/,
    operator: /(\+|-| in | == | < | > | != | >= | <= | && |!| \*{1,2}|\|%)/
  }
}
