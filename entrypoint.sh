green='\033[0;32m'
default='\033[0m'

case $1 in
create-env)
    docker-compose up -d
    break
    ;;
stop-env)
    docker-compose stop
    break
    ;;
start)
    winpty docker exec -it telegram-crypto-bot bash
    break
    ;;
--help)
    echo -e "Welcome to the telegram bot\n
        \t Use: ${green}sh entrypoint create-env${default} to create environment
        \t Use: ${green}sh entrypoint stop-env${default} to stop environment
        \t Use: ${green}sh entrypoint start${default} to enter the container"
    break
    ;;
esac
