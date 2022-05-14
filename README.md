# 사용법
## API KEY 가져오기
1. https://developer.riotgames.com/ 리그 오브 레전드 개발자 API 사이트로 이동 
2. 로그인 한 이후에 API_KEY 발급
3. 해당 API_KEY를 server env 파일에 저장

## MySQL 시작하기
1. db 폴더 안에 data 폴더 만들기
2. docker-mysql 경로에서 docker-compose up -d

## API Server 시작하기
1. docker-mysql/server 경로에서 node app.js 시작
2. localhost:3000/summoners/by-name/{검색을 원하는 닉네임 입력, 중괄호 빼기}
3. 터미널에 로그 찍힘

## Env

./db/.env

LC_ALL=C.UTF-8
TZ=Asia/Seoul
MYSQL_HOST={Your host}
MYSQL_PORT={Your port}
MYSQL_ROOT_PASSWORD={Your root password}
MYSQL_DATABASE={Your database}
MYSQL_USER={Your user name}
MYSQL_PASSWORD={Your password}

./server/.env

API_KEY={Your api key}

MYSQL_HOST={Your host}
MYSQL_PORT={Your port}
MYSQL_ROOT_PASSWORD={Your root password}
MYSQL_DATABASE={Your database}
MYSQL_USER={Your user name}
MYSQL_PASSWORD={Your password}
