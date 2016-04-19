#!/bin/sh
set -exv

echo "==> ci-travis.sh - OS $TRAVIS_OS_NAME"

if [[ "$TRAVIS_OS_NAME" == "osx" ]]; then

  brew update
  brew install git-lfs
  git lfs pull
  gem install --no-rdoc --no-ri fpm
  nvm install $NODE_VERSION

  npm install npm -g
  npm prune
  npm install

elif [[ "$TRAVIS_OS_NAME" == "linux" ]]; then

  sudo rm /usr/local/bin/docker-compose || echo "No previous docker-compose installed"
  curl -L https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-`uname -s`-`uname -m` > docker-compose
  chmod +x docker-compose
  sudo mv docker-compose /usr/local/bin

fi



