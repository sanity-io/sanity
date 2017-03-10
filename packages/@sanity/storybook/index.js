const storyBook = require('@kadira/storybook')
const sortByName = (storyA, storyB) => (storyB.name || '').localeCompare(storyA.name || '')
const registerStoryKind = storyBook.storiesOf

const declaredStories = []

module.exports = Object.assign({}, storyBook, {
  storiesOf: (...args) => {
    const kind = {name: args[0], kind: args, decorators: [], stories: []}
    declaredStories.push(kind)

    const api = {
      add: (...story) => {
        kind.stories.push(story)
        return api
      },

      addDecorator: (...decorator) => {
        kind.decorators.push(decorator)
        return api
      }
    }

    return api
  },

  sanity: {
    registerDeclaredStories: () => {
      declaredStories.sort(sortByName)
      while (declaredStories.length > 0) {
        const story = declaredStories.pop()
        const kind = registerStoryKind(...story.kind)
        story.decorators.forEach(dec => kind.addDecorator(...dec))
        story.stories.forEach(stry => kind.add(...stry))
      }
    }
  }
})
