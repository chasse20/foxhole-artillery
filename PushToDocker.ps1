#$tempUser = "chasse20"
$tempUser = "registry.example.com"
$tempImage = "foxhole-artillery:latest"
docker build -t $tempImage . 
docker tag $tempImage $tempUser/$tempImage
#docker login
docker push $tempUser/$tempImage