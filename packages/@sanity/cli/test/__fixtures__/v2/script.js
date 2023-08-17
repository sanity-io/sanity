/* eslint-disable import/no-unresolved, no-console */
// Tests that `sanity exec` in v2 can import parts, and use a preconfigured client
import client from 'part:@sanity/base/client'

client
  .withConfig({apiVersion: '2022-09-09'})
  .users.getById('me')
  .then(
    (user) => console.log(JSON.stringify({user, env: process.env}, null, 2)),
    (err) => console.error(err),
  )
