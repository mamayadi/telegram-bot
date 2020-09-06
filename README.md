# Telegram Bot

*Telegram Bot for trading alert using Stochastic RSI indicator and Binance exchange*

## To use this bot
http://t.me/medTradingBot

*This bot is currently not active*

### Run on dev environment
First of all change [.env.example](https://github.com/mamayadi/telegram-bot/blob/master/.env.example) to [.env](https://github.com/mamayadi/telegram-bot/blob/master/.env)
```
npm i
npm run start:dev
```
### Run on prod environment
```
npm i
npm run build
```
To serve on production
```
npm start
```
### Run on docker environment
To build container
```
sh entrypoint.sh create-env
```
To enter container
```
sh entrypoint.sh start
```
To stop container
```
sh entrypoint.sh stop-env
```





