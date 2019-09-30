const Config = require('./config');
const bot = new (require('node-telegram-bot-api'))(Config.Telegram.Token, { polling: true });

new (require('twitter'))(Config.Twitter).stream('statuses/filter', { follow: Config.Twitter.Users.join(', ') }, stream => {
	stream.on('data', tweet => Config.Twitter.Users.includes(tweet.user.id_str) && bot.sendMessage(Config.Telegram.ChatId, `${tweet.display_text_range ? tweet.text.substring(...tweet.display_text_range) : tweet.text} ― ${tweet.user.name}(@${tweet.user.screen_name})\n\n${new Date(Number(tweet.timestamp_ms)).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' })}\nhttps://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`));
	stream.on('error', e => console.error(e));
});
