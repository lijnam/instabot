const puppeteer = require('puppeteer');

const BACKUP_CODES = [
    '123654',
    // '234324',
    // '54654365436',
    // '3343423',
    // '324232343543',
];

/* instagram username */
var USERNAME = '';

/* instagram password */
var PASSWORD = '';

/* set it to false if you want to open the browser */
var HEADLESS = true;

/* set timezone of your place */
var TIMEZONE = 'Asia/Kathmandu';

/* maximum accounts to follow per day */
var MAX_ACCOUNT_TO_FOLLOW_PER_DAY = 50;

/* maximum accounts to unfollow per day */
var MAX_ACCOUNT_TO_UNFOLLOW_PER_DAY = 50;

/* maximum posts to like pwe day */
var MAX_LIKES_PER_DAY = 500;

/* ----------------------------------------------------------------------- */


var total_accounts_followed = 0;
var total_accounts_unfollowed = 0;
var total_posts_liked = 0;
var total_stories_watched = 0;
var recorded_date = getRecorededDate();
var oneSecond = 1000;
var oneMinute = oneSecond * 60;
var oneHour = oneMinute * 60;


(async () => {
    process.argv.forEach(function (val, index, array) {
        if (val === '-headless') {
            HEADLESS = process.argv[index + 1];
        } else if (val === '-username') {
            USERNAME = process.argv[index + 1];
        } else if (val === '-password') {
            PASSWORD = process.argv[index + 1];
        } else if (val === '-follow') {
            MAX_ACCOUNT_TO_FOLLOW_PER_DAY = process.argv[index + 1];
        } else if (val === '-unfollow') {
            MAX_ACCOUNT_TO_UNFOLLOW_PER_DAY = process.argv[index + 1];
        } else if (val === '-llikes') {
            MAX_LIKES_PER_DAY = process.argv[index + 1];
        } else if (val === '-timezone') {
            TIMEZONE = process.argv[index + 1];
        }
    });

    init = await init();

    browser = init.browser;

    page = init.page;

    await gotoInstaLoginPage();

    await submitLoginForm();

    await verificationCodes();

    await removeNotification();
    while (true) {
        try {
            wait_object = {
                liked: false,
                followed: false,
                unfollowed: false,
            };
            /* check recoreded_date is today */
            if (recorded_date.getDate() === getRecorededDate().getDate()) {
                /* like no more than MAX_LIKES_PER_DAY posts per day */
                if (total_posts_liked <= MAX_LIKES_PER_DAY) {

                    like_posts_object = await likePosts(page);
                    has_likable_post = like_posts_object.has_likable_post;
                    if (has_likable_post) {
                        wait_object.liked = true;
                    }
                } else {
                    log('no posts liked as like limit reached');
                    log('total postes liked since ' + recorded_date.toLocaleString("en-US", { timeZone: TIMEZONE, dateStyle: 'full' }) + ' : ' + total_posts_liked);
                }

                /* watch story */
                watch_story = randomRange(1, 2);
                if (watch_story === 1) {
                    await watchStories(page);
                }

                if (has_likable_post) {

                    /* follow no more than MAX_ACCOUNT_TO_FOLLOW_PER_DAY accounts per day */
                    if (total_accounts_followed <= MAX_ACCOUNT_TO_FOLLOW_PER_DAY) {
                        /* follow more account */
                        followed_people_object = await followPeople(page);
                        if (followed_people_object.accounts_followed > 0) {
                            wait_object.followed = true;
                        }
                    } else {
                        log('no accounts followed as follow limit reached');
                        log("Total followed account since " + recorded_date.toLocaleString("en-US", { timeZone: TIMEZONE, dateStyle: 'full' }) + " : " + total_accounts_followed);

                    }

                    /* unfollow no more than MAX_ACCOUNT_TO_UNFOLLOW_PER_DAY accounts per day */
                    if (total_accounts_unfollowed <= MAX_ACCOUNT_TO_UNFOLLOW_PER_DAY) {
                        /* try to unfollow some account */
                        await unfollowPeople(page);
                        if (followed_people_object.accounts_unfollowed > 0) {
                            wait_object.unfollowed = true;
                        }
                    } else {
                        log('no accounts unfollowed as follow limit reached');
                        log("Total unfollowed account  since " + recorded_date.toLocaleString("en-US", { timeZone: TIMEZONE, dateStyle: 'full' }) + " : " + total_accounts_unfollowed);

                    }

                } else {
                    await noLikablePosts(page);
                }

                /* watch story */
                if (watch_story === 2) {
                    await watchStories(page);
                }
                /* wait for some time */
                waitTime = 0;
                if (wait_object.liked) {
                    /* wait for random minutes  */
                    waitTime += randomRange(30, 60);
                    // log("waiting  for " + waitTime + " minutes before liking more posts");
                    // log('will resume at ' + getDateWithTimeAddition(new Date(), oneMinute * waitTime));
                    // await page.waitFor(oneMinute * waitTime);
                }

                if (wait_object.followed) {
                    /* wait some time  */
                    waitTime += randomRange(30, 120);
                    // log("waiting for " + waitTime + " minutes after following account");
                    // log('will resume at ' + getDateWithTimeAddition(new Date(), oneMinute * waitTime));
                    // await page.waitFor(oneMinute * waitTime);
                }

                if (wait_object.unfollowed) {
                    /* wait some time  */
                    waitTime += randomRange(30, 60);
                    // log("waiting for " + waitTime + " minutes after unfollowing account");
                    // log('will resume at ' + getDateWithTimeAddition(new Date(), oneMinute * waitTime));
                    // await page.waitFor(oneMinute * waitTime);
                }
                log('Total postes liked since ' + recorded_date.toLocaleString("en-US", { timeZone: TIMEZONE, dateStyle: 'full' }) + ' : ' + total_posts_liked);
                log("Total stories watched since " + recorded_date.toLocaleString("en-US", { timeZone: TIMEZONE, dateStyle: 'full' }) + " : " + total_stories_watched);
                log("Total followed account since " + recorded_date.toLocaleString("en-US", { timeZone: TIMEZONE, dateStyle: 'full' }) + " : " + total_accounts_followed);
                log("Total unfollowed account  since " + recorded_date.toLocaleString("en-US", { timeZone: TIMEZONE, dateStyle: 'full' }) + " : " + total_accounts_unfollowed);

                log("waiting for " + waitTime + " minutes ");
                log('will resume at ' + getDateWithTimeAddition(new Date(), oneMinute * waitTime));
                await page.waitFor(oneMinute * waitTime);

                log('reloading page');
                await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
            } else {
                recorded_date = getRecorededDate();
                total_accounts_followed = 0;
                total_accounts_unfollowed = 0;
                total_posts_liked = 0;

            }

        } catch (error) {
            logError(error, '');
        }
    }


    // await unfollowPeople(page);
    // await watchStories(page);
    // await followPeople(page);

})();

function getRecorededDate() {
    return new Date(Date().toLocaleString("en-US", { timeZone: TIMEZONE }));
}

function randomRange(min, max) {
    return parseInt(~~(Math.random() * (max - min + 1)) + min);
}

async function scroll(
    page,
    scroll_times,
    scrollDelay = 3000,
) {
    try {
        let previousHeight;
        var count = 0;
        while (count <= scroll_times) {
            /* scroll codes */
            try {

                previousHeight = await page.evaluate('document.body.scrollHeight');

                await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');

                await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`);

                log('scroll ' + count);
                await page.waitFor(scrollDelay);
                count++;

            } catch (error) {
                /* cant scroll anymore */
                log('Cannot scroll anymore ');
                log('Total Scolls :' + count);

                break;
            }

        }
    } catch (error) {
        logError('scroll', error)
    }
    return count;
}

async function init() {
    try {
        log('opening Browser...');
        const browser = await puppeteer.launch({
            headless: HEADLESS,
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
    console.log(new Date().toLocaleString("en-US", { timeZone: TIMEZONE }) + '   ERROR : ' + message, error)
}

function log(message) {
    console.log(new Date().toLocaleString("en-US", { timeZone: TIMEZONE }) + '   ' + message);
}

function getDateWithTimeAddition(date, miliSeconds) {
    return new Date(date.getTime() + miliSeconds).toLocaleString("en-US", { timeZone: TIMEZONE });
}

async function gotoInstaLoginPage() {
    try {
        log('going to login page');
        await page.goto('https://www.instagram.com/accounts/login/?source=auth_switcher',
            { waitUntil: 'networkidle2' });
        return true;
    } catch (error) {
        logError(error, 'unable to go to login page... trying again.');
        gotoInstaLoginPage();
    }


}

async function submitLoginForm() {

    log('inputing username')
    /* username input */
    await page.waitFor('._2hvTZ.pexuQ.zyHYP[name="username"]');
    await page.type('._2hvTZ.pexuQ.zyHYP[name="username"]', USERNAME, { delay: 200 });


    log('inputing password');
    /* password input */
    await page.waitFor('._2hvTZ.pexuQ.zyHYP[name="password"]');
    await page.type('._2hvTZ.pexuQ.zyHYP[name="password"]', PASSWORD, { delay: 200 });


    log('logging in...')
    /* click submit */
    await page.click('button.sqdOP.L3NKy.y3zKF');
}

async function verificationCodes(params) {
    try {
        /* input backup code */
        try {
            await page.waitFor('._2hvTZ.pexuQ.zyHYP[name="verificationCode"]');
        } catch (error) { }

        if (await page.$('._2hvTZ.pexuQ.zyHYP[name="verificationCode"]') !== null) {
            log('inputing backup codes for 2 factor verification')
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
            log('"Turn on Notifications"  popup removed. clicked "Not now"')

        }
        return true;

    } catch (error) {
        logError(error, 'not now button not found');
        return false;
    }
}

async function noLikablePosts(page) {
    log("Following more accounts..");

    /* follow no more than MAX_ACCOUNT_TO_FOLLOW_PER_DAY accounts per day */
    if (total_accounts_followed <= MAX_ACCOUNT_TO_FOLLOW_PER_DAY) {
        /* follow more account */
        followed_people_object = await followPeople(page);
    } else {
        log('no accounts followed as follow limit reached');
        log("Total followed account since " + recorded_date.toLocaleString("en-US", { timeZone: TIMEZONE, dateStyle: 'full' }) + " : " + total_accounts_followed);

    }

    /* unfollow no more than MAX_ACCOUNT_TO_UNFOLLOW_PER_DAY accounts per day */
    if (total_accounts_unfollowed <= MAX_ACCOUNT_TO_UNFOLLOW_PER_DAY) {
        /* try to unfollow some account */
        await unfollowPeople(page);
    } else {
        log('no accounts unfollowed as follow limit reached');
        log("Total unfollowed account  since " + recorded_date.toLocaleString("en-US", { timeZone: TIMEZONE, dateStyle: 'full' }) + " : " + total_accounts_unfollowed);

    }
    /* wait for 6 hours */
    log("waiting  for 6 hours no more likeable posts...")
    log('will resume at ' + getDateWithTimeAddition(new Date(), oneHour * 6));
    await page.waitFor(oneHour * 6); // 
    return true;
}

async function likePosts(page) {
    try {

        /* like button svg  */
        var LIKEBTNS = '.ltpMr.Slqrh button.wpO6b svg[aria-label="Like"]';
        var temp_liked_post = 0;
        var temp_no_likable_count = 0;
        var no_of_posts_to_like = randomRange(10, 48);
        var has_likable_post = true;

        while (temp_liked_post <= no_of_posts_to_like) {

            /* stop after no likable post is >= 5 */
            if (temp_no_likable_count >= 5) {
                has_likable_post = false;
                break;
            }

            /* Scroll and extract items from the page.  */
            log('scrolling some posts..')
            await scroll(page, randomRange(5, 10));

            log('liking posts..')
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
            if (posts.likeable_posts < 1) {
                temp_no_likable_count++;
            }
            temp_liked_post += posts.liked_post
            log("liked posts:" + temp_liked_post);
        }
        total_posts_liked += temp_liked_post;
        log('total postes liked since ' + recorded_date.toLocaleString("en-US", { timeZone: TIMEZONE, dateStyle: 'full' }) + ' : ' + total_posts_liked);
        return {
            posts_liked: temp_liked_post,
            has_likable_post: has_likable_post,
        }

    } catch (error) {
        logError('on likePosts', error);
        return {
            posts_liked: 0,
            has_likable_post: true,
        }
    }

}

async function followPeople(page) {
    try {

        log("Total followed account :" + total_accounts_followed);
        log("Following more account...");
        await page.waitFor(randomRange(5000, 10000));

        log('going to suggested people page')
        await page.goto('https://www.instagram.com/explore/people/suggested/',
            { waitUntil: 'networkidle2' });

        /* like button svg  */
        var follow_buttons = 'button.sqdOP.L3NKy.y3zKF';
        let no_of_people_to_follow = randomRange(1, 7);

        log('scrolling suggested followers...')
        /* Scroll and extract items from the page.  */
        await scroll(page, 5);
        log('trying to follow ' + no_of_people_to_follow + ' accounts...')
        follow_object = await page.$$eval(follow_buttons, async (follow_buttons, args) => {
            console.log(args);
            randomRange = function (min, max) {
                return ~~(Math.random() * (max - min + 1)) + min
            }
            let total_accounts_followed = 0
            for (let follow_button of follow_buttons) {
                // console.log('total_accounts_followed : ' + total_accounts_followed);
                // console.log('no_of_people_to_follow : ' + no_of_people_to_follow);

                if (total_accounts_followed >= args.no_of_people_to_follow) {
                    // console.log(total_accounts_followed)
                    break;
                }
                // wait 
                await new Promise(function (resolve) { setTimeout(resolve, randomRange(3000, 10000)) });
                // console.log(follow_button);
                await follow_button.click();
                total_accounts_followed++;

            }
            return {
                total_accounts_followed: total_accounts_followed,
                followable_people: follow_buttons.length
            };
        }, {
            no_of_people_to_follow: no_of_people_to_follow
        });

        total_accounts_followed += follow_object.total_accounts_followed;

        log(follow_object.total_accounts_followed + " new accounts followed ");
        log("Total followed account since " + recorded_date.toLocaleString("en-US", { timeZone: TIMEZONE, dateStyle: 'full' }) + " : " + total_accounts_followed);


        await page.waitFor(randomRange(5000, 10000));
        log('going to instagram homepage');
        await page.goto('https://www.instagram.com', { waitUntil: 'networkidle2' });
        await page.waitFor(randomRange(5000, 30000));


        return {
            accounts_followed: follow_object.total_accounts_followed
        };

    } catch (error) {
        logError('on followPeople', error);
        log('going to instagram homepage');
        await page.goto('https://www.instagram.com', { waitUntil: 'networkidle2' });
        return {
            accounts_followed: 0
        };
    }
}

async function unfollowPeople(page) {
    try {
        await page.waitFor(randomRange(5000, 10000));

        log('going to profile page...')
        await page.goto('https://www.instagram.com/' + USERNAME,
            { waitUntil: 'networkidle2' });

        /* chcek number of followers */
        total_followers_selector = '.Y8-fY .-nal3[href="/' + USERNAME + '/followers/"] span.g47SY';
        await page.waitFor(total_followers_selector);
        total_followers = await page.$eval(total_followers_selector, e => e.innerText);
        log('number of followers : ' + total_followers);

        /* check nubmber of followed users */
        total_following_selector = '.Y8-fY .-nal3[href="/' + USERNAME + '/following/"] span.g47SY';
        await page.waitFor(total_following_selector);
        total_following = await page.$eval(total_following_selector, e => e.innerText);
        log('nubmber of followed account  : ' + total_following);

        if (parseInt(total_following) < 5000) {

            throw ('Wont start unfollowing until total number of followed account is greater than ' + 5000);
        }

        /* click following  */
        following_selector = '.Y8-fY .-nal3[href="/' + USERNAME + '/following/"]';

        await page.waitFor(following_selector);
        await page.click(following_selector);

        following_button_selector = '.Igw0E.rBNOH.YBx95.ybXk5._4EzTm.soMvl button.sqdOP.L3NKy._8A5w5'
        await page.waitFor(following_button_selector);

        unfollow_object = await page.$$eval(following_button_selector, async (following_buttona) => {

            randomRange = function (min, max) {
                return ~~(Math.random() * (max - min + 1)) + min
            }
            let no_of_people_to_unfollow = 5;
            let total_accounts_unfollowed = 0
            for (let following_button of following_buttona) {

                if (total_accounts_unfollowed > no_of_people_to_unfollow) {
                    break;
                }

                // wait 
                await new Promise(function (resolve) { setTimeout(resolve, randomRange(3000, 10000)) });
                await following_button.click();

                /* wait for unfollow popup */
                await new Promise(function (resolve) { setTimeout(resolve, randomRange(3000, 10000)) });
                await document.querySelector('button.aOOlW.-Cab_').click();;

                total_accounts_unfollowed++;

            }
            return {
                total_accounts_unfollowed: total_accounts_unfollowed,
                unfollowable_people: following_buttona.length
            };
        });
        total_accounts_unfollowed += unfollow_object.total_accounts_unfollowed;

        log(unfollow_object.total_accounts_unfollowed + " accounts unfollowed.");
        log("Total unfollowed account  since " + recorded_date.toLocaleString("en-US", { timeZone: TIMEZONE, dateStyle: 'full' }) + " : " + total_accounts_unfollowed);



        await page.waitFor(randomRange(5000, 10000));
        log('going to instagram homepage');
        await page.goto('https://www.instagram.com', { waitUntil: 'networkidle2' });
        await page.waitFor(randomRange(5000, 30000));

        return {
            accounts_unfollowed: unfollow_object.total_accounts_unfollowed
        }


    } catch (error) {
        logError('on unfollowPeople', error);
        log('going to instagram homepage');
        await page.goto('https://www.instagram.com', { waitUntil: 'networkidle2' });
        return {
            accounts_unfollowed: 0
        }
    }
}

async function watchStories(page) {
    try {

        await page.waitFor(randomRange(5000, 10000));

        log('going to instagram homepage...')
        await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle2' });

        /* click watch all */
        watch_all_selector = '._7UhW9.PIoXz.qyrsm.KV-D4.uL8Hv';
        await page.waitFor(watch_all_selector);
        await page.click(watch_all_selector);
        await page.waitFor('section._9eogI._01nki.lXJWB');

        watch_duration = randomRange(1, 10);
        log('watching stories for ' + parseInt((watch_duration * oneMinute)) + ' minutes...');
        log('will stop watching at ' + getDateWithTimeAddition(new Date(), watch_duration));
        time_count = 0
        while (time_count <= ((watch_duration * 60) / 4)) {
            await page.waitFor(4 * oneSecond);
            await page.click('button.ow3u_');
            time_count++;
            log('watching story... ' + time_count);
        }
        total_stories_watched += time_count;
        // await page.hover('section._8XqED.carul');

        log('stopped watching stories')

        log('going to instagram homepage...')
        await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle2' });

        return true

    } catch (error) {
        logError('on watchStories', error);
        log('going to instagram homepage');
        await page.goto('https://www.instagram.com', { waitUntil: 'networkidle2' });
        return false;
    }
}