const { Bot } = require('grammy');
require('dotenv').config();
const bot = new Bot(process.env.BOT_TOKEN);
const fs = require('fs');
const cheerio = require('cheerio');
const axios = require('axios');

bot.command("start", async (ctx) => {
    var tag;

    // Bazı kullanıcılar username taglarına sahip değil.
    // hasOwnProperty(), `username` değerini kontrol eder; true veya false döner.
    if (ctx.from.hasOwnProperty("username")) {
        // Kullanıcı herhangi bir tag'a sahipse;
        tag = ctx.from.username
    } else {
        // Kullanıcı tag'a sahip değilse veya görünmüyorsa;
        tag = false
    }

    // Tag sahibi olmayanlar için `ctx.from.first_name` bağlantısı "tg://settings" olarak gönderilir.
    // Tag sahibi olanlar için `ctx.from.first_name` bağlantısı "https://t.me/tag" olarak gönderilir.
    var isim_mesaj = tag == false ? "[" + ctx.from.first_name + "](tg://settings)" : "[" + ctx.from.first_name + "](https://t.me/" + tag + ")! \n\n"
    await ctx.reply(
        "Nöbetçi Noter Bot'a Hoşgeldin, " +
        isim_mesaj + 
        "Ben, [Bu Kişi](https://t.me/bpercent) tarafından Nöbetçi Noterleri hızlıca bulabilmen için geliştirilmiş bir botum." +
        "Bot'un kullanımı hakkında bilgi almak için lütfen /help komutunu kullanın.", {
            parse_mode: "Markdown",
        }
    );
    
    var data;
    /**
     * [
     *  {
     *    name: "Kullanıcı İsmi": string,
     *    id: "Kullanıcı ID": number
     *  }
     * ]
     */
    try {
        // Text formatı yerine JSON formatı seçildi.
        data = require("./users.json")
    } catch {
        console.error("Cannot Found Users JSON File, Creating New JSON Bin..")
        // Herhangi bir kayıtlı veritabanı yok ise, yeni bir JSON dosyası oluşturulur.
        fs.writeFileSync("./users.json", JSON.stringify([], null, 2))
        data = require("./users.json")
        // Tekrardan data: any değişkeni yeni oluşturulan JSON dosyası olarak atanır.
    } finally {
        var ids = []
        data.map((Element) => {
            ids.push(Element.id)
            // Veritabanına kayıtlı olan tüm ID'ler yeni bir değişkene atanır.
        })
        if (ids.includes(ctx.from.id)) {
            // Yeni atanan değişken içinde kullanıcı ID'si yer alırsa hiçbirşey yapmadan fonksiyon buradan kapatılır.
            return;
        } else {
            data.push({
                name: ctx.from.first_name,
                id: ctx.from.id
            })
            // Değişken içerisinde ID'si bulunmayan yeni kayıtlı kullanıcıların ilk isimleri ve ID'leri kayıt edilir.
            fs.writeFileSync("./users.json", JSON.stringify(data, null, 2))
            // Kayıt edilen veriler yazdırılır.
            bot.api.sendMessage(
                process.env.LOG_CHAT_ID, 
                "Kullanıcı: " + ctx.from.first_name + "(`" + ctx.from.id + "`)\n" +
                "Botu başlattı, onu veritabanına kaydettim."
            );
            // Bot sahibine bilgilendirme mesajı gönderilir.
        }
    }
});

// Help Komutu
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
        }).join('\n'), {
            parse_mode: "Markdown",
        }
    );
})

// Noter Komutu
bot.command("noter", async (ctx) => {
    if (ctx.message.hasOwnProperty("text")) {
        // Bazı mesajlar (Video, Fotoğraf vs.) 'text' değerine sahip değildir.
        // Bunu kontrol etmek amacıyla tekrardan `hasOwnProperty()` kullanılır.
        if (ctx.message.text !== null || ctx.message.text !== undefined) {
            // 'text' Değeri yer alsa bile bazı durumlarda `null` veya `undefined` değerini alabilir.
            // Bu durumun önüne geçmek için bu olasılık kontrol edilmelidir.
            var msg = ctx.message.text;
            try {
                var il = msg.split(" ")[1];
                // Komutlar birleşik bir şekilde yazılıdğı zaman (/noterankara) bölünmüş mesajın array dizini tek elemanlı olur.
                // "/noterankara".split(" ") < ["/noterankara"] >
            } catch {
                // Yukarıda yapılan işlem hata verdiğinde komutun birleşik yazıldığını anlıyoruz.
                // Bunun önüne geçmek için ise, "/noter" kelimesini ortadan kaldırmamız gerekiyor.
                var il = msg.replace("/noter", "")
            }
            try {
                var response = await axios({
                    url: "https://nobetcinoter.com/" + il + "-nobetci-noter",
                    method: "get"
                })
            } catch {
                return await ctx.reply(
                    "İlinizde Nöbetçi Noter Yok veya Böyle Bir İl Yok!"
                );
                // Dönen response "axios_error" olarak Error() gönderir. Bunun sonucunda fonksiyon durdurulur ve işlem kapatılır.
                // Bunun önüne geçmek için catch kullanmamız yeterlidir.
            }
            const $ = cheerio.load(response.data);
            const isim = $('.noterad').first().text();
            const adres = $('.noteradres').first().text();
 
            // Noter adı ve adresi cheerio kullanılarak alınır.
            if (isim.length > 0) {
                await ctx.reply(
                    "*" + il.toUpperCase() + " İlinde Nöbetçi Noter Bulundu!*\n\n" + 
                    "*Noter Adı:* " + isim.trim().replace('                                        ', ' ') + "\n\n" +
                    "*Noter Adresi: *" + adres, {
                        parse_mode: "Markdown",
                    }
                );
                bot.api.sendMessage(
                    process.env.LOG_CHAT_ID, 
                    "Kullanıcı: " + ctx.from.first_name + "(`" + ctx.from.id + "`)\n" +
                    "Noter aramasi yaptı, sonucu gönderdim."
                ); 
            } else {
                 await ctx.reply("İl veya Nöbetçi Noter Bulunamadı!");
            }
        } else {
            return await ctx.reply(
                "Lütfen Metin Mesajı Gönderin!"
            )
        }
    } else {
        return await ctx.reply(
            "Lütfen Metin Mesajı Gönderin!"
        )
    }
});

// Beni en mutlu edebilecek komut :)
bot.command("donate", async (ctx) => {
    await ctx.reply(
        "Beni geliştiren kişiye bağış yapmak için Papara No: `2023853094`\n\n" + 
        "Tesekkur ederim :)", {
            parse_mode: "Markdown",
        }
    );
})

try {
    bot.start();
} catch (error) {
    console.log(error)
}
