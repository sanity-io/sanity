#!/bin/bash
set -u

# Deploy test studio
cd /drone/src/github.com/sanity-io/sanity/packages/backstop-test-studio
SANITY_AUTH_TOKEN=${BACKSTOP_AUTH_TOKEN} /drone/src/github.com/sanity-io/sanity/packages/@sanity/cli/bin/sanity deploy
sleep 10
# Do the visual backstop test
cd /drone/src/github.com/sanity-io/sanity
npm run test:backstop
export test_exit_code=$?
# Copy the result to the studio if error
echo $test_exit_code
if [ $test_exit_code -ne 0 ]; then
  cp -R /drone/src/github.com/sanity-io/sanity/backstop_data /drone/src/github.com/sanity-io/sanity/packages/backstop-test-studio/static/.
  cd /drone/src/github.com/sanity-io/sanity/packages/backstop-test-studio
  SANITY_AUTH_TOKEN=${BACKSTOP_AUTH_TOKEN} /drone/src/github.com/sanity-io/sanity/packages/@sanity/cli/bin/sanity deploy
  echo "### VISUAL TEST FAILED ### Go to https://backstop.sanity.studio/static/backstop_data/htmlReport/index.html to view diff"
  # Notify the design team
  curl -sSf -XPOST "$SLACK_WEBHOOK" --data-urlencode 'payload={
    "channel": "#design-issues",
    "username": "Backstop tester",
    "text": "Visual issues. '"<$DRONE_BUILD_LINK|$DRONE_REPO_NAME #$DRONE_BUILD_NUMBER> ($DRONE_BRANCH) by $DRONE_COMMIT_AUTHOR: <$DRONE_COMMIT_LINK|#${DRONE_COMMIT:0:7}>"' Go to https://backstop.sanity.studio/static/backstop_data/htmlReport/index.html to view diff"
  }'
fi

exit $test_exit_code