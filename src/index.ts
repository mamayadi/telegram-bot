import dotenv from 'dotenv';
import path from 'path';
import { Telegraf } from 'telegraf';
import { TelegrafContext } from 'telegraf/typings/context';
import {
  default as Binance,
  CandleChartResult,
  CandleChartInterval,
} from 'binance-api-node';

import { StochasticRSI as SRSI, RSI } from 'technicalindicators';
import { IncomingMessage } from 'telegraf/typings/telegram-types';

const result = dotenv.config({ path: path.join(__dirname, '../.env') });

if (result.error) {
  throw result.error;
}
// Authenticated client, can make signed calls
const client2 = Binance({
  apiKey: process.env.API_KEY || '',
  apiSecret: process.env.API_SECRET || '',
  getTime: () => Date.now(),
});
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');
bot.start((ctx) =>
  ctx.reply(
    `This is a bot alert for trading based on the Stochastic RSI and binance exchange. 
    You can use /watch "paire you want to watch, eg: ETHBTC" "Candle age, eg: 30m".
    To stop you can use /stop "paire you entred before"`
  )
);
bot.help((ctx) => ctx.reply('Send me a sticker'));
bot.command('watch', (ctx) => loopMessage(ctx));
bot.launch();

async function getData(paire: string, period: CandleChartInterval) {
  const data = await client2.candles({ symbol: paire, interval: period });
  if (data) {
    const prices: number[] = [];
    data.forEach((value: CandleChartResult) => {
      prices.push(Number(value.close));
    });
    const rsiOutput = RSI.calculate({ period: 14, values: prices });

    const stochasticOutput = SRSI.calculate({
      values: rsiOutput,
      rsiPeriod: 14,
      stochasticPeriod: 14,
      kPeriod: 3,
      dPeriod: 3,
    });
    for (let index = 5; index > 0; index--) {
      console.log(stochasticOutput[stochasticOutput.length - index]);
    }
    console.log('********************');
    return {
      ...stochasticOutput[stochasticOutput.length - 1],
      price: prices[prices.length - 1],
    };
  }
  return null;
}

async function getMessage(context: TelegrafContext) {
  const cmd = ((context.message as IncomingMessage).text as string).split(' ');
  const paire = cmd[1].trim().toUpperCase();
  const period: any = cmd[2].trim();
  if (Object.values(CandleChartInterval).includes(period)) {
    const data = await getData(paire, period as CandleChartInterval);
    const status = { buyPrice: 0, buy: false, sellPrice: 0, sell: false };
    if (data) {
      if (data.k > data.d && data.k < 20 && !status.buy) {
        status.buyPrice = data.price;
        status.buy = true;
        context.reply('Buy signal for ' + paire + ' at price: ' + data.price);
      } else if (data.k < data.d && data.k > 75 && status.buy) {
        status.sell = true;
        status.buy = false;
        status.sellPrice = data.price;
        context.reply(
          'Sell Signal for ' +
            paire +
            ' at price: ' +
            data.price +
            ' with profit: ' +
            profit(status.buyPrice, status.sellPrice) +
            '%'
        );
        status.sell = false;
        status.buyPrice = 0;
        status.sellPrice = 0;
      } else if (data.k < data.d && data.k < 75 && status.buy) {
        status.sell = true;
        status.buy = false;
        status.sellPrice = data.price;
        context.reply(
          'This is stop loss signal for ' +
            paire +
            ' at price: ' +
            data.price +
            ' with profit: ' +
            profit(status.buyPrice, status.sellPrice) +
            '%'
        );
        status.sell = false;
        status.buyPrice = 0;
        status.sellPrice = 0;
      }
    }
  } else {
    context.reply(
      `Second parameter should be: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M`
    );
  }
}

function loopMessage(context: TelegrafContext): void {
  const cmd = ((context.message as IncomingMessage).text as string).split(' ');
  const paire = cmd[1].trim().toUpperCase();
  context.reply('I am watching ' + paire);
  getMessage(context);
  const loop = setInterval(() => {
    getMessage(context);
  }, 10 * 60 * 1000);
  bot.command('stop', (ctx) => {
    const stopCmd = ((ctx.message as IncomingMessage).text as string).split(
      ' '
    );
    const stopPaire = stopCmd[1].trim().toUpperCase();
    if (paire === stopPaire) {
      clearInterval(loop);
      ctx.reply('Stop watching ' + stopPaire);
    }
  });
}

function profit(buyPrice: number, sellPrice: number): number {
  return Number(((sellPrice * 100) / buyPrice - 100).toFixed(2));
}
