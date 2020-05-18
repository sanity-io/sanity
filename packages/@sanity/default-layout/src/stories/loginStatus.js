import React from 'react'
import LoginStatus from '../components/LoginStatus'

import NavBarStyles from '../components/styles/NavBar.css'
import DefaultLayoutStyles from '../components/styles/DefaultLayout.css'

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
            onLogout={() => console.log('logout')}
          />
        </div>
      </div>
    </div>
  )
}
