let puppeteer = require("puppeteer");
let fs = require("fs");

let cFile = process.argv[2];
let pUrl = process.argv[3];
let nPost = process.argv[4];

(async function () {
    // browser create => fullscreen
    try {
        let data = await fs.promises.readFile(cFile);
        let { url, password, username } = JSON.parse(data)[1];
        // launch browser
        let browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ["--start-maximized", "--disable-notifications"]
        });
        // tab
        let tabs = await browser.pages();
        let tab = tabs[0];

        await tab.goto(url, { waitUntil: "networkidle2" });
        await tab.waitForSelector("input[type=email]");
        await tab.type("input[type=email]", username, { delay: 120 });
        await tab.type("input[type=password]", password, { delay: 120 });

        await Promise.all([
            tab.click(".login_form_login_button"), tab.waitForNavigation({
                waitUntil: "networkidle2"
            })
        ])
        await tab.goto(pUrl, { waitUntil: "networkidle2" });
        await tab.waitForSelector("div[data-key=tab_posts]");
        //  post => click => reroute=> 2 times=> 2 times (wait for navigation)
        await Promise.all([
            tab.click("div[data-key=tab_posts]"),
            tab.waitForNavigation({ waitUntil: "networkidle2" })
        ])
        await tab.waitForNavigation({ waitUntil: "networkidle2" });

        let idx = 0;
        do {
            //  post => 7 post => are loaded 
            await tab.waitForSelector("#pagelet_timeline_main_column ._1xnd .clearfix.uiMorePager");
            // children selector
            let elements = await tab.$$("#pagelet_timeline_main_column ._1xnd > ._4-u2._4-u8")
            // saftey
            let post = elements[idx];
            // like -> selector
            await tab.waitForSelector("._666k ._8c74");
            let like = await post.$("._666k ._8c74");
            await like.click({delay: 100});
            idx++;
            await tab.waitForSelector(".uiMorePagerLoader", {hidden: true})
        } while (idx < nPost)
        // await browser.close();
    } 
    catch (err) {
        console.log(err)
    }
})()
