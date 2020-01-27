const puppeteer = require('puppeteer');
const fs = require('fs');

const BACKUP_CODES = [
    '123654',
    // '234324',
    // '54654365436',
    // '3343423',
    // '324232343543',
];

/* instagram username */
const USERNAME = '';

/* instagram password */
const PASSWORD = '';

var total_people_folowed = 0;

function randomRange(min, max) {
    return ~~(Math.random() * (max - min + 1)) + min
}

async function scrapeInfiniteScrollItems(
    page,
    extractElements,
    itemTargetCount,
    scrollDelay = 3000,
) {
    let items = [];
    try {
        let previousHeight;
        var count = 0;
        while ((items.length < itemTargetCount) && (count < itemTargetCount)) {
            extractItems = await page.$$(extractElements);
            items.push(extractItems);
            log(items.length);
            /* scroll codes */
            try {
                previousHeight = await page.evaluate('document.body.scrollHeight');

                await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');

                await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);
            } catch (error) {
                /* cant scroll anymore */
                log('Cannot Scroll anymore ');
                log('Total items :' + items.length);

                break;
            }
            await page.waitFor(scrollDelay);
            count++;
        }
    } catch (error) {
        logError('scrapeInfiniteScrollItems', error)
    }
    return items;
}

async function init() {
    try {
        const browser = await puppeteer.launch({
            // headless: false,
            // executablePath: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
            args: ["--window-size=1920,1080"],
            defaultViewport: {
                width: 1920,
                height: 1080
            },
        });
        const page = await browser.newPage();
        return { page: page, browser: browser };
    } catch (error) {
        logError(error, "cant initiliaze... trying again.");
        init();
    }
}

function logError(error, message) {
    console.log(new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu" }) + '   ERROR : ' + message, error)
}

function log(message) {
    console.log(new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu" }) + '   ' + message);
}

function getDateWithTimeAddition(date, miliSeconds) {
    return new Date(date.getTime() + miliSeconds).toLocaleString("en-US", { timeZone: "Asia/Kathmandu" });
}

async function gotoInstaLoginPage() {
    try {
        await page.goto('https://www.instagram.com/accounts/login/?source=auth_switcher',
            { waitUntil: 'networkidle2' });
        return true;
    } catch (error) {
        logError(error, 'unable to go to login page... trying again.');
        gotoInstaLoginPage();
    }


}

async function submitLoginForm() {
    /* username input */
    await page.waitFor('._2hvTZ.pexuQ.zyHYP[name="username"]');
    await page.type('._2hvTZ.pexuQ.zyHYP[name="username"]', USERNAME, { delay: 200 });
    // await page.type('._2hvTZ.pexuQ.zyHYP[name="username"]', 'qrstorenepal', { delay: 200 });


    /* password input */
    await page.waitFor('._2hvTZ.pexuQ.zyHYP[name="password"]');
    await page.type('._2hvTZ.pexuQ.zyHYP[name="password"]', PASSWORD, { delay: 200 });
    // await page.type('._2hvTZ.pexuQ.zyHYP[name="password"]', 'welcome$1290$', { delay: 200 });


    /* click submit */
    await page.click('button.sqdOP.L3NKy.y3zKF');
}

async function verificationCodes(params) {
    try {
        /* input backup code */
        await page.waitFor('._2hvTZ.pexuQ.zyHYP[name="verificationCode"]');
        if (await page.$('._2hvTZ.pexuQ.zyHYP[name="verificationCode"]') !== null) {
            await page.type('._2hvTZ.pexuQ.zyHYP[name="verificationCode"]', BACKUP_CODES[0], { delay: 100 });
            /* click verify */
            await page.click('button.sqdOP.L3NKy.y3zKF');
        }
    } catch (error) {
        logError(error, "verification codes");

    }
}

async function removeNotification() {
    try {
        await page.waitFor('button.aOOlW.HoLwm');
        if (await page.$('button.aOOlW.HoLwm') !== null) {
            /* click "not now" for push notification */
            await page.click('button.aOOlW.HoLwm');
        }
        return true;

    } catch (error) {
        logError(error, 'not now button not found');
        return false;
    }
}

(async () => {

    init = await init();

    browser = init.browser;

    page = init.page;

    await gotoInstaLoginPage();

    await submitLoginForm();

    await verificationCodes();

    await removeNotification();

    await likePosts(page);

})();

async function likePosts(page) {
    try {
        while (true) {
            /* like button svg  */
            var LIKEBTNS = '.ltpMr.Slqrh button.wpO6b svg[aria-label="Like"]';
            // let extractedElements = await page.$$(LIKEBTNS);

            /* Scroll and extract items from the page.  */
            await scrapeInfiniteScrollItems(page, LIKEBTNS, 50);

            posts = await page.$$eval(LIKEBTNS, async (svgs) => {
                // console.log(svgs.length);
                randomRange = function (min, max) {
                    return ~~(Math.random() * (max - min + 1)) + min
                }
                let liked_post = 0;
                for (let svg of svgs) {
                    // wait one second
                    await new Promise(function (resolve) { setTimeout(resolve, randomRange(3000, 10000)) });
                    // console.log(svg.parentElement);
                    await svg.parentElement.click();
                    liked_post++;
                }
                return {
                    likeable_posts: svgs.length,
                    liked_post: liked_post
                };
            });

            log("likeable Posts:" + posts.likeable_posts);
            log("liked Posts:" + posts.liked_post);


            randomRange = function (min, max) {
                return ~~(Math.random() * (max - min + 1)) + min
            }
            let oneSecond = 1000;
            let oneMinute = oneSecond * 60;
            let oneHour = oneMinute * 60;

            /* wait for some time if likeable post is 0 */
            if (posts.likeable_posts < 1) {
                log("Following more people..");

                /* follow more people */
                followed_people = await followPeople(page);
                log(followed_people + " new People followed ");

                /* reset total people followed  */
                total_people_folowed = 0;

                /* wait for 6 hours */
                log("waiting  for 6 hours no more likeable posts...")
                log('will resume at ' + getDateWithTimeAddition(new Date(), oneHour * 6));
                await page.waitFor(oneHour * 6); // 
                // await page.waitFor(30000);
            } else {
                if (total_people_folowed <= 100) {
                    log("Total followed people :" + total_people_folowed);
                    log("Following more people...");

                    /* follow more people */
                    followed_people = await followPeople(page);
                    log(followed_people + " new People followed ");

                    /* wait some time  */
                    waitTime = randomRange(30, 60);
                    log("waiting for " + waitTime + " minutes after following people");
                    log('will resume at ' + getDateWithTimeAddition(new Date(), waitTime));

                    await page.waitFor(oneMinute * waitTime);
                }
                /* wait for random minutes  */
                waitTime = randomRange(30, 120);
                log("waiting  for " + waitTime + " minutes before liking more posts");
                log('will resume at ' + getDateWithTimeAddition(new Date(), waitTime));

                await page.waitFor(oneMinute * waitTime);
            }
            await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });

        }
    } catch (error) {
        logError('on likePosts', error);
        return false;
    }

}

async function followPeople(page) {
    try {
        await page.waitFor(randomRange(5000, 10000));

        await page.goto('https://www.instagram.com/explore/people/suggested/',
            { waitUntil: 'networkidle2' });

        /* like button svg  */
        var follow_buttons = 'button.sqdOP.L3NKy.y3zKF';
        let no_of_people_to_follow = 5

        /* Scroll and extract items from the page.  */
        await scrapeInfiniteScrollItems(page, follow_buttons, no_of_people_to_follow);

        follow_object = await page.$$eval(follow_buttons, async (follow_buttons) => {
            // console.log(svgs.length);
            randomRange = function (min, max) {
                return ~~(Math.random() * (max - min + 1)) + min
            }
            let no_of_people_to_follow = 5;
            let total_people_folowed = 0
            for (let follow_button of follow_buttons) {
                // console.log('total_people_folowed : ' + total_people_folowed);
                // console.log('no_of_people_to_follow : ' + no_of_people_to_follow);

                if (total_people_folowed > no_of_people_to_follow) {
                    // console.log(total_people_folowed)
                    break;
                }
                // wait 
                await new Promise(function (resolve) { setTimeout(resolve, randomRange(3000, 10000)) });
                // console.log(follow_button);
                await follow_button.click();
                total_people_folowed++;

            }
            return {
                total_people_folowed: total_people_folowed,
                followable_people: follow_buttons.length
            };
        });
        total_people_folowed += follow_object.total_people_folowed;

        await page.waitFor(randomRange(5000, 10000));
        await page.goto('https://www.instagram.com', { waitUntil: 'networkidle2' });
        await page.waitFor(randomRange(5000, 30000));
        return follow_object.total_people_folowed;

    } catch (error) {
        logError('on followPeople', error);
        await page.goto('https://www.instagram.com', { waitUntil: 'networkidle2' });
        return false;
    }
}
