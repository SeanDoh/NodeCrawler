require('dotenv').config();
const URL = require('url').URL;
const lib = require('./lib');
const delay = lib.delay;

/* crawl - recursivley crawl a website
   args:
     browser: puppeteer browser context
     page: puppeteer page context
     host: host/domain to compare 'a' tag 'href' to (e.g. www.google.com/test/path -> google.com)
     url_list: array of urls to crawled
     crawled_urls: urls already crawled
     limit: limit of how many urls to crawl
   return:
     crawled_urls: array of urls
     page: puppeteer page context
*/
let crawl = async (browser, page = null, host, url, url_list = [], crawled_urls = [], limit = null) => {
  // if we have reached the limit, return the crawled_urls, and the page
  // we need to close the page outside of the recursive function to avoid errors
  if(crawled_urls.length == limit){
    return {crawled_urls: crawled_urls, page: page};
  }
  
  // open the url
  // if we have a page, just go to the new url in the same page
  if(page){
    await page.goto(url, {waituntil: 'networkidle'});
  }
  // otherwise, create a new page and go to the url
  else{
    page = await browser.newPage();
    await page.goto(url, {waituntil: 'networkidle'});
  }

  // todo: process the page

  // add current url to the already crawled urls
  crawled_urls.push(url);

  // select all a tags from the page
  const links = await page.$$('a');

  // loop through all the a tags and process the href value
  for (let i = 0; i < links.length; i++) {

    // get href value
    let link = await links[i].evaluate(node => node.href);

    // if the href tag has a value, process the URL
    // sometimes, there are empty links (e.g. <a href=''></a>)
    if(link){
      url_list = await processURL(link, host, url_list);
    }
  }

  // remove duplicates
  url_list = [...new Set(url_list)];

  //onsole.log(url);
  //onsole.log(url_list.length);
  //onsole.log(crawled_urls.length);

  // recursively parse each url
  for (let i = 0; i < url_list.length; i++) {

    // if the host matches between parent host and url host
    // and we have not already crawled this url, then recursively crawl
    if(new URL(url).host == host && !crawled_urls.includes(url_list[i])){
      await delay(5000);
      await crawl(browser, page, host, url_list[i], url_list, crawled_urls, limit);
      return {crawled_urls: crawled_urls, page: page};
    }
  }

  // return the crawled_urls and page
  // we need to close the page outside of the recursive function to avoid errors
  return {crawled_urls: crawled_urls, page: page};
}

/* processURL - process junk urls
    e.g. skip these
      www.google.com/test/path#test
      www.google.com/test/path/#
     
    args:
      link: url to process
      host: parent host to compare to
      url_list: list of urls to add to

    return:
      url_list: list of urls with new addition or no changes

    todo: query string processing
*/
let processURL= async (link, host, url_list) => {

  // first, remove '#' at end of URL
  let result = link.slice(-2) == '/#' ? link.slice(0, link.length-1) : link;

  // then check if there are any URL fragments and remove
  // 'https://example.org/foo#bar'= #bar
  let website = new URL(link);
  if(website.hash){
    result = website.origin + website.pathname;
  }

  // then check if we have same host as parent and we don't already have the link
  if(website.host == host && !url_list.includes(result)){
    url_list.push(result);
  }

  // return the url_list
  return url_list;
}

/*  checkRedirect - check if the starting url redirects on load
    args:
      url - url to check for a redirect

    return:
      {
        url: url to crawl
        host: host to use for comparison
      }
*/
let checkRedirect = async (url, proxy) => {

  // start a new puppeteer browser and load url
  const browser = await lib.startBrowser(url, true, proxy);
  const page = await browser.newPage();
  await page.goto(url, {waituntil: 'networkidle'});

  // get the url on current page after loading
  const host = await page.evaluate(() => window.location.host);
  await browser.close();
  // if the host of current page is different than the host of url
  if (host != new URL(url).host){
    // return the new url and host
    return {
      url: await page.evaluate(() => window.location.href),
      host: host
    }
  }
  // else return the original url and host
  else return{
    url: url,
    host: new URL(url).host
  }
}

module.exports.crawl = crawl;
module.exports.checkRedirect = checkRedirect;