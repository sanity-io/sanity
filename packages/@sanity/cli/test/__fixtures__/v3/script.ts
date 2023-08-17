/* eslint-disable no-console */
// Tests that `sanity exec` in v3 can import the CLI client
import {getCliClient} from 'sanity/cli'

getCliClient()
  .withConfig({apiVersion: '2022-09-09'})
  .users.getById('me')
  .then(
    (user) => console.log(JSON.stringify({user, env: process.env}, null, 2)),
    (err) => console.error(err),
  )
