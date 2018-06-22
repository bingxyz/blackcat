const request = require('request')
const cheerio = require('cheerio')
const phantom = require('phantom');

const TelegramBot = require("node-telegram-bot-api")
const token = require('./token').botToken
const bot = new TelegramBot(token, {polling: true})

var options = {
    url: 'https://www.t-cat.com.tw/inquire/trace.aspx',
    method: 'POST',
    headers: {
        'Origin': 'https://www.t-cat.com.tw',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://www.t-cat.com.tw/inquire/trace.aspx',
        'Upgrade-Insecure-Requests': '1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.1 Safari/603.1.30'
    },
    form: {
        '__EVENTTARGET': 'ctl00$ContentPlaceHolder1$btnSend',
        '__EVENTARGUMENT': '',
        '__VIEWSTATE': '5TSYo8pbCkr3++XfSZJrXnCsrU308njJk6pjgSQtYyB2kdLuxz18S0GkTPz7xFP0pTHtricptn9U3KgVJmfsYAaS4EVZA5pWztD+4InL/4m6kFP5PBI93loWwW4sYCDetv7qXQ==',
        '__VIEWSTATEGENERATOR': '9A093EFF',
        '__EVENTVALIDATION': '54usSLB4euwvr0ZOH+8XP9umE4CMN0vC5F6agoJJLxop5b0UJhVHHdHhb//fJNECCRuZtSzY4zpG1aXBLwczauDNIrzNlLZfXj1cyg+k4eMiTchHQvv42NGSUAyv8WdSO7NLuEisyg3QtaHHE1B/9tYCM9iXMOGW9DyqeNfzWum0RJX9Bzbq/3PwlzUY+v9WCFDsxEjVgq4ZH9v4DAXTZqTqn0lRUvX40kSf3ZV0wbqtK5YzrTNqnMbWA5y1kgWk/S1uXjJpCKq+By+OQFLJ83woo5KR3W1PYSR73TMXkXMfZvLoxOyeBydcLHN9rh6+481mWN/d1YVliGhgepcDbSSPpo3RYP5epr09OTWdKyCaiGvQ',
        'q': '站內搜尋',
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
}



function queryPackage(trackNumber) {
    options.form.ctl00$ContentPlaceHolder1$txtQuery1 = trackNumber
    console.log(trackNumber)
    var queryResult = ''
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                // console.log(body)
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
                console.log(error)
                reject()
            }
        })
    }).catch(error=>{console.log(error)})
}

function isNumeric(mixedVar) {
    return true
    for(var i in mixedVar){
        var c = mixedVar.charAt(i)
        if (c < '0' || c > '9')
            return false
    }
    return true
}
function isTrackNumber(trackNumber){
    return isNumeric(trackNumber)
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
        queryPackage(trackNumber).then((result) => {
            console.log(result)
            if(result){
                // const photo = `${__dirname}/capture.png`;
                bot.sendMessage(chatId, result)
                //bot.sendPhoto(chatId, photo)
                console.log(`tell ${msg.from.username} package info of ${trackNumber}`)
            }
            else{
                bot.sendMessage(chatId, 'Cannot get track info!')
                console.log(`tell ${msg.from.username} Cannot get track info!`)
            }
        })
    }
    else{
        bot.sendMessage(chatId, 'Not a valid track number!')
        console.log(`tell ${msg.from.username} : Not a valid track number!`)
    }
});