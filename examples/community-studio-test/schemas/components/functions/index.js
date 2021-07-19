import userStore from 'part:@sanity/base/user'
import client from 'part:@sanity/base/client'

export const getCurrentUser = () => {
  return new Promise(function(res, rej) {
    userStore.currentUser.subscribe(event => {
      client.fetch(`*[_type == "person" && sanityId == $userId]`,
      { userId: event.user.id }).then(result => {
        res(result[0])
      })
    })
  })
}
