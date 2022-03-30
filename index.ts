import axios from 'axios'
import * as iconv from 'iconv-lite'
import * as charset from 'charset'
import * as cheerio from 'cheerio'
import * as fs from 'fs'
import * as _ from 'lodash'
import { WebClient } from '@slack/web-api'
import { Readability } from '@mozilla/readability'
import { JSDOM } from 'jsdom'

const url = process.argv[2]
const dataStore = 'data.json'
const listRule = 'li a'

const request = async (url: string) => {
  return axios
    .get(url, { responseType: 'arraybuffer' })
    .then(res => {
      let cs = charset(res.headers, res.data)
      if (cs !== 'utf8') {
        return iconv.decode(Buffer.from(res.data), cs)
      } else {
        return (new TextDecoder("utf-8")).decode(res.data)
      }
    })
}

const send = (msg: string) => {
  const token = process.env.SLACK_TOKEN;

  if (token) {
    const web = new WebClient(token);
    const conversationId = 'C034T9FRMC2';

    (async () => {
      const res = await web.chat.postMessage({ channel: conversationId, text: msg });
      console.log('Message sent: ', res.ts);
    })();
  } else {
    console.log('Slack token not found', msg)
  }
}

const checkUpdate = (postList: { id: number, link: string }[]) => {
  let ch = [];
  if (fs.existsSync(dataStore)) {
    let rawdata = fs.readFileSync(dataStore)
    ch = JSON.parse(rawdata.toString())
  }

  let latest = []
  if (postList.length && !_.isEqual(ch[ch.length - 1], postList[postList.length - 1])) {
    fs.writeFile(dataStore, JSON.stringify(postList), function (err) {
      if (err) {
        console.log(err);
      }
    })

    const diff = postList.filter(obj => ch.findIndex(o => o.id === obj.id) == -1)
    if (diff.length > 0) {
      latest = diff.slice(-3)
    }
  }

  return latest
}

const parseContent = (link: string) => {
  return request(link).then(data => {
    const doc = new JSDOM(data)
    return new Readability(doc.window.document).parse()
  })
}

const parseList = (html: string) => {
  const $ = cheerio.load(html)
  let postList = []
  $(listRule).each((idx, item) => {
    postList.push({
      id: idx,
      name: $(item).text(),
      link: url + $(item).attr('href')
    })
  })

  return postList
}

request(url)
  .then(data => {
    return parseList(data)
  })
  .then(postList => {
    return checkUpdate(postList)
  })
  .then(latest => {
    if (latest.length) send(latest.map(obj => `<${obj.link}|${obj.name}>`).join('\n'))
  })
/* fetch and send content pages
.then(latest => {
  latest.forEach(obj => {
    parseContent(obj.link)
    .then(doc => {
      send(`*${doc.title}*\n${doc.textContent}`)
    })
  })
})
*/

