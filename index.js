require('dotenv').config();
const lib = require ('./src/lib');
const crawler = require('./src/crawler');

const crawl = async (url, searchDepth, proxy = null) => {
  const site = await crawler.checkRedirect(url);
  const browser = await lib.startBrowser(site.url, false, proxy = proxy);
  const results = await crawler.crawl(browser, null, site.host, site.url, [], [], searchDepth);
  await browser.close(); 
  return results;
}

crawl(process.env.URL, process.env.DEPTH, process.env.PROXY);