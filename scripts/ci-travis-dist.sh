#!/bin/bash
set -exv

echo "==> ci-travis-run.sh - OS $TRAVIS_OS_NAME"

if [[ "$TRAVIS_OS_NAME" == "osx" ]]; then
  npm run dist
elif [[ "$TRAVIS_OS_NAME" == "linux" ]]; then
  docker-compose run --rm dist
fi



