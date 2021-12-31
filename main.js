/* eslint-disable max-len */
/* eslint-disable no-unused-expressions */
import { JSDOM } from 'jsdom';
import { gotScraping } from 'got-scraping';
import pLimit from 'p-limit';
import * as fs from 'fs';

const url = 'https://totempole666.com/archives-2/';
const limit = pLimit(5);

async function getImgUrl(pageUrl) {
  const res = await gotScraping.get(pageUrl);
  const pageDom = new JSDOM(res.body).window.document;
  const imgUrl = pageDom.querySelector('#comic img').src;
  return imgUrl;
}

async function downloadImg(imgUrl, fileDir, pageIndex) {
  fs.existsSync(fileDir) || fs.mkdirSync(fileDir);
  let fileType = '';
  if (imgUrl.includes('.jpg')) {
    fileType = '.jpg';
  } else if (imgUrl.includes('.png')) {
    fileType = '.png';
  }
  if (fs.existsSync(`${fileDir}/page${pageIndex}${fileType}`)) {
    console.log(`${imgUrl} was already downloaded before`);
  } else {
    gotScraping.stream(imgUrl)
      .pipe(fs.createWriteStream(`${fileDir}/page${pageIndex}${fileType}`));
    console.log(`${imgUrl} downloaded`);
  }
  return 0;
}

async function main() {
  const res = await gotScraping.get(url);
  const dom = new JSDOM(res.body);
  const { document } = dom.window;
  const chaptersNodeList = document.querySelectorAll('.comic-archive-chapter-wrap');

  chaptersNodeList.forEach(async (chapterNode) => {
    const chapterDom = new JSDOM(chapterNode.innerHTML).window.document;
    const chapterTitle = chapterDom.querySelector('.comic-archive-chapter').textContent;

    const pagesNodeList = chapterDom.querySelectorAll('a');
    const pagesUrlList = [];

    pagesNodeList.forEach((pageNode) => {
      pagesUrlList.push(pageNode.href);
    });

    const getImgUrlPromises = pagesUrlList.map((pageUrl) => limit(() => getImgUrl(pageUrl)));
    const imgUrls = await Promise.all(getImgUrlPromises);

    imgUrls.forEach((imgUrl, pageNUm) => {
      downloadImg(imgUrl, `./downloads/${chapterTitle}`, pageNUm);
    });
  });
}

main();
