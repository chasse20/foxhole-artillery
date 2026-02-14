#!/usr/bin/env bash
set -euo pipefail

tempUser="chasse20"
#tempUser="registry.example.com"
tempImage="foxhole-artillery:latest"

docker build -f Dockerfile -t "$tempImage" .
docker tag "$tempImage" "$tempUser/$tempImage"
docker login
docker push "$tempUser/$tempImage"