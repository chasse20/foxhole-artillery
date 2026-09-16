$Registry = if ( $env:DOCKER_REGISTRY ) { $env:DOCKER_REGISTRY } else { "chasse20" }
$Image = if ( $env:IMAGE_NAME ) { $env:IMAGE_NAME } else { "foxhole-artillery" }
$Tag = if ( $env:IMAGE_TAG ) { $env:IMAGE_TAG } else { "latest" }

$LocalImage = "${Image}:${Tag}"
$RemoteImage = "${Registry}/${Image}:${Tag}"

docker build -f Dockerfile -t $LocalImage .
docker tag $LocalImage $RemoteImage
docker login
docker push $RemoteImage
