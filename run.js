const request = require('request')
const cheerio = require('cheerio')
const TelegramBot = require("node-telegram-bot-api")
const token = require('./token').botToken
const bot = new TelegramBot(token, {polling: true})

var options = {
    url: 'http://www.t-cat.com.tw/Inquire/Trace.aspx',
    method: 'POST',
    headers: {
        'Origin': 'http://www.t-cat.com.tw',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'http://www.t-cat.com.tw/inquire/International.aspx',
        'Upgrade-Insecure-Requests': '1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.1 Safari/603.1.30'
    },
    form: {
        '__EVENTTARGET': 'ctl00$ContentPlaceHolder1$btnSend',
        '__EVENTARGUMENT': '',
        '__VIEWSTATE': '/wEPDwULLTE2ODAyMTAzNDBkZHngR2yLNdcoB1YXtf+bAIxi/AHF',
        '__VIEWSTATEGENERATOR': '9A093EFF',
        '__EVENTVALIDATION': '/wEWDALXz8K8AwKUhrKJAQL5nJT0BgLes/beDALDytjJAgKo4bq0CAKN+JyfDgLyjv+JBAKHub7IDALsz6CzAgKUhvK7DAK97Mp+etzK3cOKerX3pzYyBL/kZYAJxkM=',
        'q': '站內搜尋',
        'cx': '005475758396817196247:vpg-mgvhr44',
        'cof': 'FORID:11',
        'ie': 'UTF-8',
        'ctl00$ContentPlaceHolder1$txtQuery1': '',
        'ctl00$ContentPlaceHolder1$txtQuery2': '',
        'ctl00$ContentPlaceHolder1$txtQuery3': '',
        'ctl00$ContentPlaceHolder1$txtQuery4': '',
        'ctl00$ContentPlaceHolder1$txtQuery5': '',
        'ctl00$ContentPlaceHolder1$txtQuery6': '',
        'ctl00$ContentPlaceHolder1$txtQuery7': '',
        'ctl00$ContentPlaceHolder1$txtQuery8': '',
        'ctl00$ContentPlaceHolder1$txtQuery9': '',
        'ctl00$ContentPlaceHolder1$txtQuery10': ''
    }
};
function queryPackage(trackNumber) {
    options.form.ctl00$ContentPlaceHolder1$txtQuery1 = trackNumber
    var queryResult = ''
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(body);
                var arr = $('table[class=tablelist]').text()
                if(arr !== ''){
                    var arr = arr.split(/\s+/).filter(String)
                    queryResult   = `${arr[0]}\t: ${arr[4]}\n`+
                                        `${arr[1]}\t: ${arr[5]}\n`+
                                        `${arr[2]}\t: ${arr[6]} ${arr[7]}\n`+
                                        `${arr[3]}\t: ${arr[8]}\n`   
                }
                else{
                    queryResult = 'Cannot get package info!'
                }
                resolve(queryResult)
            }
            else{
                reject()
            }
        })
    })
}
function isNumeric(mixedVar) {
    for(var i in mixedVar){
        var c = mixedVar.charAt(i)
        if (c < '0' || c > '9')
            return false
    }
    return true
}
function isTrackNumber(trackNumber){
    return isNumeric(trackNumber) && trackNumber.length == 12 && trackNumber.charAt(0) == '9'
}

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    var trackNumber = msg.text
    console.log(`from ${msg.from.username} say : ${trackNumber}`)
    const options = {
        // reply_to_message_id: msg.message_id,
        reply_markup: JSON.stringify({
            keyboard: [
                [trackNumber]
            ]
        })
    }
    if(isTrackNumber(trackNumber)){
        bot.sendMessage(chatId, 'Please wait for moments...', options)
        // bot.sendMessage(chatId, '', options)
        console.log(`tell ${msg.from.username} : Please wait for moments...`)
        queryPackage(trackNumber).then((queryResult) => {
            bot.sendMessage(chatId, queryResult)
            console.log(`tell ${msg.from.username} package info of ${trackNumber}`)
        })
    }
    else{
        bot.sendMessage(chatId, 'Not a valid track number!')
        console.log(`tell ${msg.from.username} : Not a valid track number!`)
    }
});