const puppeteer = require('puppeteer');

// function for starting a puppeteer browser instance
module.exports.startBrowser = async (url, headless = true, proxy = null) => {

  // browser options, start with headless options to show browser on screen or not
  let options = {
    headless: headless,
    timeout: 0
  };

  // if we have a proxy, add the proxy details to the browser options
  if(proxy) options.args = [
    `--proxy-server=${proxy}`,
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-setuid-sandbox',
    '--no-first-run',
    '--no-sandbox',
    '--no-zygote',
  ];
  else options.args = [
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-setuid-sandbox',
    '--no-first-run',
    '--no-sandbox',
    '--no-zygote',
  ];
  
  // launch browser with the browser options
  const browser = await puppeteer.launch(options);

  // override browser popups (e.g. location, etc)
  const context = await browser.defaultBrowserContext();
  await context.overridePermissions(url, []);
  
  // return the browser
  return browser;
}

module.exports.delay = (ms) =>  {
  return new Promise(res => setTimeout(res, ms));
};