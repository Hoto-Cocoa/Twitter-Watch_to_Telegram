const Config = require('./config');
const bot = new (require('node-telegram-bot-api'))(Config.Telegram.Token, { polling: true });
const twitter = new (require('twitter'))(Config.Twitter);
(async function() {
	let data = [];
	let users = [];
	try {
		data = require('./data.json');
	} catch {
		await require('util').promisify(require('fs').writeFile)('./data.json', '[]');
	}
	for(let d of data) {
		users.push(await twitter.get('users/show', {
			screen_name: d.screen_name
		}));
	}
	if(users.length) twitter.stream('statuses/filter', { follow: (await Promise.all(users)).map(e => e.id_str).join(',') }, async stream => {
		stream.on('data', async tweet => {
			let text = tweet.display_text_range ? tweet.text.substring(...tweet.display_text_range) : tweet.text;
			let user = `${tweet.user.name}(@${tweet.user.screen_name})`;
			let date = new Date(Number(tweet.timestamp_ms)).toLocaleString('ja-JP', {
				timeZone: 'Asia/Tokyo',
				hour12: false,
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				timeZoneName: 'short'
			});
			for(let d of data.filter(e => e.screen_name === tweet.user.screen_name)) {
				let r = await bot.sendMessage(d.chatId, `${text} ― ${user}\n\n${date}\nhttps://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`);
				if(d.needRemoveLatest) {
					let da = {};
					try {
						da = JSON.parse(await require('util').promisify(require('fs').readFile)(`./data/${d.screen_name}_${d.chatId}.json`));
					} catch {
						await require('util').promisify(require('fs').writeFile)(`./data/${d.screen_name}_${d.chatId}.json`, '{}');
					}
					if(da.lastId) {
						try {
							await bot.deleteMessage(d.chatId, da.lastId);
						} catch {}
					}
					await require('util').promisify(require('fs').writeFile)(`./data/${d.screen_name}_${d.chatId}.json`, JSON.stringify({
						lastId: r.message_id
					}));
				}
			}
		});
		stream.on('error', e => console.error(e));
	});
	bot.on('message', async m => {
		if(m.text && m.text.startsWith('private! regtwt ') && m.from.id === Config.Telegram.UserId) {
			let text = m.text.substring('private! regtwt '.length);
			let arguments = text.split(' ');
			let userId = arguments.shift();
			let temp = arguments.shift();
			let needRemoveLatest = temp ? JSON.parse(temp) : false;
			let isNew = true;
			for(let d of data) {
				if(d.screen_name === userId && d.chatId === m.chat.id) {
					if(d.needRemoveLatest === needRemoveLatest) return;
					else {
						d.needRemoveLatest = needRemoveLatest;
						isNew = false;
					}
				}
			}
			if(isNew) {
				data.push({
					screen_name: userId,
					needRemoveLatest,
					chatId: m.chat.id
				});
			}
			await require('util').promisify(require('fs').writeFile)('./data.json', JSON.stringify(data));
			process.exit();
		}
	});
})();
