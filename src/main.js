const Apify = require('apify');
const _ = require('lodash');

const { utils: { log } } = Apify;

const STORE_NAME = 'KOSIK-CZ-FREE-SLOTS';
const STORE_KEY = 'SLOTS';

const encodeURIParam = (stringParam) => {
    return encodeURI(stringParam.replace(/\s/g, '+'));
};

Apify.main(async () => {
    const { notifyEmail, street, city, zip } = await Apify.getInput();
    const kosikBaseUrl = 'https://www.kosik.cz/api/web/transport/windows';
    const store = await Apify.openKeyValueStore(STORE_NAME);

    const urlToVisit = `${kosikBaseUrl}?street=${encodeURIParam(street)}&city=${encodeURIParam(city)}&zip=${zip.replace(/\s/g, '')}`;
    const requestList = new Apify.RequestList({
        sources: [{ url: urlToVisit }],
    });
    await requestList.initialize();

    const crawler = new Apify.CheerioCrawler({
        requestList,
        maxRequestRetries: 2,
        additionalMimeTypes: [ 'application/json' ],
        handlePageFunction: async ({ request, json }) => {
            log.info(`Processing page ${request.url}...`);

            if (!json.timeslots) throw new Error('Address didn\'t work!');

            const currentFreeSlots = {};
            json.timeslots.forEach(({day, date, times}) => {
                times.forEach(({ occupied, price, hours }, i) => {
                    if (!occupied) {
                        const hours = json.times[i];
                        currentFreeSlots[`${date}_${hours}`] = {
                            day: `${day} ${date}`,
                            hours,
                            price: `${price} Kč`
                        };
                    }
                });
            });

            await Apify.pushData(Object.values(currentFreeSlots));

            const oldSlots = await store.getValue(STORE_KEY) || {};
            await store.setValue(STORE_KEY, currentFreeSlots);

            const newFreeSlots = Object.keys(currentFreeSlots).filter((keySlot) => {
                return !oldSlots[keySlot];
            });
            if (newFreeSlots.length) {
                const slotsTable = Object.values(_.pick(currentFreeSlots, ...newFreeSlots)).map(({ day, hours, price }) => `${day}\t${hours}\t${price}`);
                await Apify.call('apify/send-mail', {
                    to: notifyEmail,
                    subject: 'Změna volných časů dovážek na košík.cz',
                    text: 'Ahoj,\n\n'
                        + `Došlo ke změně časů dovážek na adresu ${street}.\nNové volné časy:\n\n`
                        + slotsTable.join('\n'),
                });
            } else {
                log.info('We didn\'t find new slots.');
            }
        },

        // This function is called if the page processing failed more than maxRequestRetries+1 times.
        handleFailedRequestFunction: async ({ request }) => {
            throw new Error('Crawler failed after 5 retries!');
        },
    });

    // Run the crawler and wait for it to finish.
    await crawler.run();

    console.log('Crawler finished.');
});
