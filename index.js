const axios = require('axios');
let $ = require('cheerio')
const schedule = require('node-schedule');

const config = require("./config.json")


const find_ticketone_calendar = (element) => {
    if (element.children[0] == undefined) return false

    return element.children[0].data.includes("calendar_content")

}

const check = async () => {
    let response = await axios.get(config.eventUrl);
    let parsedHTML = $.load(response.data)
    let pageScripts = parsedHTML('script').get();
    let eventsDetails = JSON.parse(pageScripts.find(find_ticketone_calendar).children[0].data)

    for (event of eventsDetails.calendar_content.result) {
        //Check if it's available
        if (config.eventsName.indexOf(event.title) > -1) {
            if ((!config.checkForEventPrice || event.priceAvailable) && event.ticketAvailable) {
                console.log(`Tickets are available for ${event.title}`);
                if (config.telegram.notify === true) {
                    let telegram = await axios.get(`https://api.telegram.org/bot${config.telegram.botToken}/sendMessage?chat_id=${config.telegram.chatId}&text=${encodeURIComponent(`TICKET ONE trovati i biglietti\nlink:${config.eventUrl}`)}`)
                }
            }

        }
    }
}

// Check telegram requirements
if(config.telegram.notify === true){
    if(typeof config.telegram.botToken !== 'string' || config.telegram.botToken == "") throw new Error("Telegram notification it's on but no bot token found, check the config.json file")
    if(typeof config.telegram.chatId !== 'number') throw new Error("Telegram notification it's on but no chat Id found, check the config.json file")
}

if (config.scheduler) {
    const job = schedule.scheduleJob(config.scheduler, function () {
        console.log(`Running scheduler ${new Date().toLocaleString()}`);
        check()
    });
    console.log(`Next Schedule in ${job.nextInvocation()}`);
} else {
    check()
}


