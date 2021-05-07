import React, {useEffect, useState} from 'react'
import {MenuButton, Button, Menu, MenuItem, MenuDivider, Layer} from '@sanity/ui'
import {CircleIcon, CheckmarkCircleIcon} from '@sanity/icons'
import {metricsStudioClient} from './metricsClient'
import {deployment} from '../../../metrics-studio/schemas/deployment'

function fetchBuildHistory() {
  return metricsStudioClient.fetch(
    '*[_type=="branch"] | order(updatedAt desc) | {_id, name, "latestDeployment": *[_type == "deployment" && references(^._id)][0]}'
  )
}

function getDeploymentStatusColor(deployment: any) {
  if (!deployment) {
    return 'transparent'
  }
  if (deployment.status === 'pending') {
    return '#ccc970'
  }
  if (deployment.status === 'completed') {
    return '#70cc70'
  }
  return '#e53935'
}

export function BuildSwitcher() {
  const [branches, setBranches] = useState([])
  useEffect(() => {
    fetchBuildHistory().then((result) => {
      setBranches(result)
    })
  }, [])

  // const selected = branches.find
  const isLocal = LOCAL_HOSTS.includes(document.location.hostname)

  const currentBranch = branches.find(
    (branch) => branch.latestDeployment?.url === document.location.hostname
  )
  console.log(branches)

  return (
    <MenuButton
      button={
        <Button
          type="button"
          mode="bleed"
          text={isLocal ? <>Localhost</> : <>{currentBranch?.name || 'unknown branch'}</>}
        />
      }
      id="menu-button-example"
      portal
      menu={
        <Menu>
          {branches.map((branch) => {
            return (
              <MenuItem
                icon={() => <CircleIcon fill={getDeploymentStatusColor(branch.latestDeployment)} />}
                key={branch.name}
                onClick={() =>
                  (document.location.href = `https://${branch.latestDeployment.url}${document.location.pathname}`)
                }
                text={<>{branch.name}</>}
              />
            )
          })}
        </Menu>
      }
    />
  )
}
