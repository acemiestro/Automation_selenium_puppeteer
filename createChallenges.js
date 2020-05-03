require("chromedriver");
let fs = require("fs");
let swd = require("selenium-webdriver");

let cFile = process.argv[2];
let uToAdd = process.argv[3];
let questionsFile = process.argv[4];

let bldr = new swd.Builder();
let driver = bldr.forBrowser("chrome").build();

(async function () {
  try {
    // Login
    await loginHelper();
    // Go to Administrator
    let dropDownBtn = await driver.findElement(swd.By.css("a[data-analytics=NavBarProfileDropDown]"));
    await dropDownBtn.click();
    let adminBtn = await driver.findElement(swd.By.css("a[data-analytics=NavBarProfileDropDownAdministration]"));
    await adminBtn.click();
    // wait for loader
    await waitForLoader();
    // Go to contest tabs
    // await driver.navigate().refresh();
    let manageTabs = await driver.findElements(swd.By.css(".administration header ul li"));
    await manageTabs[1].click();
    // add challenges
    let ManageChallengePage = await driver.getCurrentUrl();
    let questions = require(questionsFile);
    for (let i = 0; i < questions.length; i++) {
      await driver.get(ManageChallengePage)
      await waitForLoader();
      await createNewChallenge(questions[i]);
    }
    
  } 
  catch (err) {
    console.log(err);
  }
})()



async function createNewChallenge(question) {
  let createChallenge = await driver.findElement(swd.By.css(".btn.btn-green.backbone.pull-right"));
  await createChallenge.click();
  await waitForLoader();
  // opertion => selection ,data entry
  let eSelector = [
    "#name", 
    "textarea.description", 
    "#problem_statement-container .CodeMirror div textarea", 
    "#input_format-container .CodeMirror textarea", 
    "#constraints-container .CodeMirror textarea", 
    "#output_format-container .CodeMirror textarea", 
    "#tags_tag"
  ];
  let eWillBeselectedPromise = eSelector.map(function (s) {
    return driver.findElement(swd.By.css(s));
  })
  let AllElements = await Promise.all(eWillBeselectedPromise);
  // submit name ,description
  let NameWillAddedPromise = AllElements[0].sendKeys(question["Challenge Name"]);
  let descWillAddedPromise = AllElements[1].sendKeys(question["Description"]);
  
  await Promise.all([NameWillAddedPromise, descWillAddedPromise]);
  // code editor
  await editorHandler("#problem_statement-container .CodeMirror div", AllElements[2], question["Problem Statement"]);
  await editorHandler("#input_format-container .CodeMirror div", AllElements[3], question["Input Format"]);
  await editorHandler("#constraints-container .CodeMirror div", AllElements[4], question["Constraints"]);
  await editorHandler("#output_format-container .CodeMirror div", AllElements[5], question["Output Format"]);
  // tags
  let TagsInput = AllElements[6];
  await TagsInput.sendKeys(question["Tags"]);
  await TagsInput.sendKeys(swd.Key.ENTER);
  // submit 
  let submitBtn = await driver.findElement(swd.By.css(".save-challenge.btn.btn-green"))
  await submitBtn.click();
  
  // await driver.wait(swd.until.elementIsNotVisible(submitBtn));
  await driver.navigate().refresh();
  
}

async function loginHelper(){
  await driver.manage().setTimeouts({ implicit: 10000, pageLoad: 10000})
  let data = await fs.promises.readFile(cFile);
  let { url, password, username } = JSON.parse(data);
  await driver.get(url);
  let userFound = driver.findElement(swd.By.css("#input-1"));
  let passFound = driver.findElement(swd.By.css("#input-2"));
  let ElementsArr = await Promise.all([userFound, passFound]);
  let userEntered = ElementsArr[0].sendKeys(username);
  let passEntered = ElementsArr[1].sendKeys(password);
  await Promise.all([userEntered, passEntered]);
  let loginBtn = driver.findElement(swd.By.css("button[data-analytics=LoginPassword]"));
  await loginBtn.click();
}

async function waitForLoader() {
  let loader = await driver.findElement(swd.By.css("#ajax-msg"));
  await driver.wait(swd.until.elementIsNotVisible(loader));
}

async function editorHandler(parentSelector, element, data) {
  let parent = await driver.findElement(swd.By.css(parentSelector));
  // selenium => browser js execute 
  await driver.executeScript("arguments[0].style.height='10px'", parent);
  await element.sendKeys(data);
}