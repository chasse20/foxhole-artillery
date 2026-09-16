#!/usr/bin/env bash
set -euo pipefail

registry="${DOCKER_REGISTRY:-chasse20}"
image="${IMAGE_NAME:-foxhole-artillery}"
tag="${IMAGE_TAG:-latest}"
local_image="${image}:${tag}"
remote_image="${registry}/${image}:${tag}"

docker build -f Dockerfile -t "$local_image" .
docker tag "$local_image" "$remote_image"
docker login
docker push "$remote_image"
