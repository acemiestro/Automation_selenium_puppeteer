let puppeteer = require("puppeteer");
let fs = require("fs");

let cFile = process.argv[2];
let uToAdd = process.argv[3];

(async function () {
    try {
        let browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ["--start-maximized"]
        });
        let data = await fs.promises.readFile(cFile);
        let { url, password, username } = JSON.parse(data);
        
        let tabs = await browser.pages();
        let tab = tabs[0];

        await tab.goto(url, {waitUntil: "networkidle0"});
        await tab.waitForSelector("#input-1", {visible: true});
        await tab.type("#input-1", username, {delay: 100});
        await tab.type("#input-2", password, {delay: 100});
        //await tab.click("button[data-analytics=LoginPassword]");
        await Promise.all([
            tab.click("button[data-analytics=LoginPassword]"), tab.waitForNavigation({waitUntil: "networkidle0"})
        ]);

        await tab.waitForSelector("a[data-analytics=NavBarProfileDropDown]", {visible: true});
        await tab.click("a[data-analytics=NavBarProfileDropDown]");
        
        await Promise.all(
            [tab.waitForNavigation({ waitUntil: "networkidle0" }),
            tab.click("a[data-analytics=NavBarProfileDropDownAdministration]")
        ])

        await tab.waitForSelector(".administration header", {visible: true})
        let mTabs = await tab.$$(".administration header ul li a");

        await Promise.all(
            [tab.waitForNavigation({ waitUntil: "networkidle0" }),
            mTabs[1].click("a[data-analytics=NavBarProfileDropDownAdministration]")
        ]);

        await handleSinglePage(tab, browser);
    }
    catch (err) {
        console.log(err);
    }
})();


async function handleSinglePage(tab, browser) {
    await tab.waitForSelector(".backbone.block-center");
    let qPage = await tab.$$(".backbone.block-center");
    let pArr = [];
    for (let i = 0; i < qPage.length; i++) {
        let href = await tab.evaluate(function (elem) {
            return elem.getAttribute()
        }, qPage[i]);

        let newTab = await browser.newPage();
        let tabOpened = handleQuestion(newTab, "https://www.hackerrank.com" + href);
        pArr.push(tabOpened);
    }
    await Promise.all(pArr);
    // go to next page
    await tab.waitForSelector(".pagination ul li");
    let pageBtn = await tab.$$(".pagination ul li");
    let nxtBtn = pageBtn[pageBtn.length - 2];
    let className = await tab.evaluate(function (nxtBtn) {
        return nxtBtn.getAttribute("class");
    }, nxtBtn);
    if (className === "disabled") {
        return;
    }
    else {
        await Promise.all([nxtBtn.click(), tab.waitForNavigation({
            waitUntil: "networkidle0"
        })]);
        await handleSinglePage(tab, browser);
    }
}

async function handleQuestion(newTab, link) {

    await newTab.goto(link, { waitUntil: "networkidle0"});
    await newTab.waitForSelector(".tag");
    await newTab.click("li[data-tab=moderators]");
    await newTab.waitForSelector("input[id=moderator]", { visible: true });
    await newTab.type("#moderator", uToAdd);
    await newTab.keyboard.press("Enter");
    await newTab.click(".save-challenge.btn.btn-green");
    await newTab.close();
}