# ramshackle-api

## this project is intended as an example of what not to do

* start the project using yarn start
* goto: <http://localhost:8080/get-a-user-by-id?id=1>

## Sonarqube local scanning

```bash
 _____                                   _
/  ___|                                 | |
\ `--.  ___  _ __   __ _ _ __ __ _ _   _| |__   ___
 `--. \/ _ \| '_ \ / _` | '__/ _` | | | | '_ \ / _ \
/\__/ / (_) | | | | (_| | | | (_| | |_| | |_) |  __/
\____/ \___/|_| |_|\__,_|_|  \__, |\__,_|_.__/ \___|
                                | |
                                |_|
```

First start a local sonarqube server

```bash
docker run --rm -d --name sonarqube -p "9000:9000" sonarqube
```

Wait for the sonarqube server to come all the way up.  It is slow.

To make sure its up you can wait for the webpage to load: <http://localhost:9000/about>
You can login if you want (You don't have to).  username: `admin`  password: `admin`

Change the password when you login to something you can remember.

Create a user token: <https://docs.sonarqube.org/latest/user-guide/user-token>

To stop the sonarqube server:

```bash
docker stop sonarqube
```

Next open powershell and navigate to this folder.

To sonarqube scan all of the edge modules

```bash
node ./utils/sonarqube-scan.js <sonarqube_token_goes_here>
```

Sonarqube local scanning notes:

* This will create the sonarqube projects if they are not already created.
* The scan for 7 modules takes about 15 minutes.
* rarely when I was running the scans the sonarsource cli hung and I had to restart docker
