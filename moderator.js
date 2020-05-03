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
        let pages = await browser.pages();
        let page = pages[0];

        await page.goto(url, { waitUntil: "networkidle0" });
        await page.type("#input-1", username);
        await page.type("#input-2", password);

        await Promise.all([
            page.waitForNavigation({ waitUntil: "networkidle0" }),
            page.click("button[data-analytics=LoginPassword]")
        ])

        await page.waitForSelector("a[data-analytics=NavBarProfileDropDown]", { visible: true });
        await page.click("a[data-analytics=NavBarProfileDropDown]");
        await Promise.all([
            page.waitForNavigation({ waitUntil: "networkidle0" }),
            page.click("a[data-analytics=NavBarProfileDropDownAdministration]")
        ])

        await page.waitForSelector(".administration header", { visible: true })
        let tabs = await page.$$(".administration header ul li a");
        let href = await page.evaluate(function (el) {
            return el.getAttribute("href");
        }, tabs[1])
        let mpUrl = `https://www.hackerrank.com${href}`;
        // console.log("Line number number " + mpUrl);
        await page.goto(mpUrl , {waitUntil: "networkidle0"});

        let qidx = 0;
        while (true) {
            let question = await getMeQuestionElement(page, qidx, mpUrl);
            if (question == null) {
                console.log("All Question processed");
                return;
            } 
            else{
                await handleQuestion(page, question, uToAdd);
                qidx++;
                question = await getMeQuestionElement(page, qidx, mpUrl);
            } 
        }
    }
    catch (err) {
        console.log(err);
    }
})();

async function getMeQuestionElement(page, qidx, mpUrl) {
    let pidx = Math.floor(qidx / 10);
    let pQidx = qidx % 10;
    //  pageVisit 
    console.log(pidx + " " + pQidx);
    // go to manage challenges page => pidx=0
    await page.goto(mpUrl,{ waitUntil: "networkidle0" });
//    await page.waitForNavigation();
    // you will wait for pagination 
    await page.waitForSelector(".pagination ul li", { visible: true });
    let paginations = await page.$$(".pagination ul li");
    let nxtBtn = paginations[paginations.length - 2];

    let className = await page.evaluate(function (el) {
        return el.getAttribute("class")
    }, nxtBtn);

    for (let i = 0; i < pidx; i++) {
        if (className == "disabled") {
            return null;
        }
        await nxtBtn.click();
        //  wait page visible 
        await page.waitForSelector(".pagination ul li", { visible: true });
        //  findElements
        paginations = await page.$$(".pagination ul li");
        nxtBtn = paginations[paginations.length - 2];
        //  attribute
        className = await page.evaluate(function (el) {
            return el.getAttribute("class")
        }, nxtBtn);
    }// pageQuestion
    let challengeList = await page.$$(".backbone.block-center");
    if (challengeList.length > pQidx) {
        return challengeList[pQidx];
    } else {
        return null;
    }
}

// async function waitForLoader(page) {
//     await page.waitForSelector("#ajax-msg", {
//         visible: false
//     });
// }

async function handleQuestion(page, question, uToAdd) {
    await Promise.all([page.waitForNavigation({ waitUntil: "networkidle2" }), question.click()]);
    await page.waitForSelector("li[data-tab=moderators]", { visible: true })
    await page.click("li[data-tab=moderators]");
    let dialogueBox =  await page.waitForSelector(".modal.modal-mid.in",{waitUntil:"networkidle0"});
    //await page.waitForNavigation({waitUntil:"neworkidle0"});
    if(dialogueBox==undefined){
        return null;
    }
    else{
        await page.click("#cancelBtn");
        await page.waitForSelector("input[id=moderator]", { visible: true });
        await page.type("#moderator", uToAdd);
        await page.keyboard.press("Enter");
        await page.click(".save-challenge.btn.btn-green");
    }
}