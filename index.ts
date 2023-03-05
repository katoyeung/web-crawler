import axios from 'axios'
import * as iconv from 'iconv-lite'
import * as charset from 'charset'
import * as cheerio from 'cheerio'
import * as fs from 'fs'
import * as _ from 'lodash'
import { WebClient } from '@slack/web-api'
import { Readability } from '@mozilla/readability'
import { JSDOM } from 'jsdom'
import * as crypto from 'crypto'


const url = process.argv[2]
const sort = process.argv[3]
const dataStore = 'storage/' + crypto.createHash('md5').update(url).digest('hex')
const listRule = '.info-title .a-link'

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
      latest = sort === 'asc' ? diff.slice(-3) : diff.slice(0, 3)
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
      link: $(item).attr('href')
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
  /*
  .then(latest => {
    if (latest.length) send(latest.map(obj => `<${obj.link}|${obj.name}>`).join('\n'))
  })
/* fetch and send content pages
 */
.then(latest => {
  latest.forEach(obj => {
    parseContent(obj.link)
    .then(doc => {
	const content = doc.textContent.replace(/。/g, '。\n\n')
      	send(`\n\n>*${doc.title}*\n\n\n${content}\n\n======== END ========\n\n\n`)
    })

  })
})

