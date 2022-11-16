const { Bot } = require('grammy');
require('dotenv').config();
const bot = new Bot(process.env.BOT_TOKEN);
const fs = require('fs');
const cheerio = require('cheerio');
const axios = require('axios');


bot.on(':new_chat_members', (ctx) => {
    console.log(ctx.message.chat.id);
    ctx.reply('Hello, I am a bot!');
});

bot.command("start", async (ctx) => {
    await ctx.reply(`Nöbetçi Noter Bot'a Hoşgeldin, [${ctx.from.first_name}](https://t.me/${ctx.from.username})! \n\n` + "Ben, [Bu Kişi](https://t.me/bpercent) tarafından Nöbetçi Noterleri hızlıca bulabilmen için geliştirilmiş bir botum. Bot'un kullanımı hakkında bilgi almak için lütfen /help komutunu kullanın.", {
        parse_mode: "Markdown",
    });

    fs.readFile('users.txt', 'utf8', function (err, data) {
        if (err) throw err;
        if (data.includes(ctx.from.id)) {
            return;
        } else {
            fs.appendFile('users.txt', ctx.from.id + "\n", function (err) {
                if (err) throw err;
                bot.api.sendMessage(process.env.LOG_CHAT_ID, `Kullanici: ${ctx.from.first_name} (${ctx.from.id})\nBotu baslatti, onu veritabanina kaydettim.`);   
            });
        }
    });
});
// Help komutu

bot.command("help", async (ctx) => {
    const commands = [
        { command: '/start', description: 'Botu başlatır.' },
        { command: '/help', description: 'Botun komutlarını gösterir. (Şu anda olduğu gibi 😎)' },
        { command: '/noter', description: 'Nöbetçi Noterleri gösterir.' },
    ]


    await ctx.reply(
        `*Nöbetçi Noter Bot Kullanımı*\n\n` +
        `*Komutlar*\n` +
        commands.map((command) => {
            return `• \`${command.command}\` - ${command.description}`
        }
        ).join('\n')
    , {
        parse_mode: "Markdown",
        });
})



bot.command("noter",  async (ctx) => {
    var msg = ctx.message.text;
    var il = msg.split(" ")[1];

     axios.get(`https://nobetcinoter.com/${il}-nobetci-noter`)
     .then(async function (response) {
        if (response.status == 200) {
           const $ = cheerio.load(response.data);
           const isim = $('.noterad').first().text();
           const adres = $('.noteradres').first().text();

           if (isim.length > 0) {
           await ctx.reply(`*${il.toUpperCase()} İlinde nöbetçi noter bulundu!*\n\n` + `*Noter Adı:* ${isim.trim().replace('                                        ', ' ')}\n\n*Noter Adresi: *${adres}`,
            {
               parse_mode: "Markdown",
            });
            bot.api.sendMessage(process.env.LOG_CHAT_ID, `Kullanici: ${ctx.from.first_name} (${ctx.from.id})\nNoter aramasi yapti, sonucu gonderdim.`); 
           } else {
                await ctx.reply("Il veya Nöbetçi Noter Bulunamadı!");
              }
        }
        else {
            ctx.reply("Hata.");
        }
    })
});

// Beni en mutlu edebilecek komut :)

bot.command("donate", async (ctx) => {
    await ctx.reply("Beni geliştiren kişiye bağış yapmak için Papara No: `2023853094`\n\nTesekkur ederim :)", {
        parse_mode: "Markdown",
    });
})

bot.start();