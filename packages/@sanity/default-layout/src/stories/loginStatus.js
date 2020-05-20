import {action} from 'part:@sanity/storybook/addons/actions'
import React from 'react'
import LoginStatus from '../navbar/loginStatus/LoginStatus'
import NavBarStyles from '../navbar/NavBar.css'
import DefaultLayoutStyles from '../DefaultLayout.css'

export function LoginStatusStory() {
  return (
    <div className={DefaultLayoutStyles.navBar}>
      <div className={NavBarStyles.root}>
        <div className={NavBarStyles.loginStatus}>
          <LoginStatus
            user={{
              name: 'John Doe',
              profileImage: 'https://randomuser.me/api/portraits/men/12.jpg'
            }}
            onLogout={() => action('onLogout')}
          />
        </div>
      </div>
    </div>
  )
}
