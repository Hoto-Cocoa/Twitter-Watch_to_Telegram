const config = require('./config');
const Twitter = require('twitter');
const TelegramBot = require('node-telegram-bot-api');

const client = new Twitter(config.tweetConfig);
const token = config.teleToken;
const chatId = config.teleChatId;
const bot = new TelegramBot(token, {polling: true});


client.stream('statuses/filter', {follow: config.tweetUser'},  function(stream) {
	stream.on('data', function(tweet) {
		console.log(tweet);
		bot.sendMessage(chatId, "Tweet Posted : " + tweet.text);
	});

	stream.on('error', function(error) {
		console.log(error);
	});
});