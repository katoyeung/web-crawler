"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var axios_1 = require("axios");
var iconv = require("iconv-lite");
var charset = require("charset");
var cheerio = require("cheerio");
var fs = require("fs");
var _ = require("lodash");
var web_api_1 = require("@slack/web-api");
var readability_1 = require("@mozilla/readability");
var jsdom_1 = require("jsdom");
var url = process.argv[2];
var dataStore = 'data.json';
var listRule = 'li a';
var request = function (url) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, axios_1["default"]
                .get(url, { responseType: 'arraybuffer' })
                .then(function (res) {
                var cs = charset(res.headers, res.data);
                if (cs !== 'utf8') {
                    return iconv.decode(Buffer.from(res.data), cs);
                }
                else {
                    return (new TextDecoder("utf-8")).decode(res.data);
                }
            })];
    });
}); };
var send = function (msg) {
    var token = process.env.SLACK_TOKEN;
    if (token) {
        var web_1 = new web_api_1.WebClient(token);
        var conversationId_1 = 'C034T9FRMC2';
        (function () { return __awaiter(void 0, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, web_1.chat.postMessage({ channel: conversationId_1, text: msg })];
                    case 1:
                        res = _a.sent();
                        console.log('Message sent: ', res.ts);
                        return [2 /*return*/];
                }
            });
        }); })();
    }
    else {
        console.log('Slack token not found', msg);
    }
};
var checkUpdate = function (postList) {
    var ch = [];
    if (fs.existsSync(dataStore)) {
        var rawdata = fs.readFileSync(dataStore);
        ch = JSON.parse(rawdata.toString());
    }
    var latest = [];
    if (postList.length && !_.isEqual(ch[ch.length - 1], postList[postList.length - 1])) {
        fs.writeFile(dataStore, JSON.stringify(postList), function (err) {
            if (err) {
                console.log(err);
            }
        });
        var diff = postList.filter(function (obj) { return ch.findIndex(function (o) { return o.id === obj.id; }) == -1; });
        if (diff.length > 0) {
            latest = diff.slice(-3);
        }
    }
    return latest;
};
var parseContent = function (link) {
    return request(link).then(function (data) {
        var doc = new jsdom_1.JSDOM(data);
        return new readability_1.Readability(doc.window.document).parse();
    });
};
var parseList = function (html) {
    var $ = cheerio.load(html);
    var postList = [];
    $(listRule).each(function (idx, item) {
        postList.push({
            id: idx,
            name: $(item).text(),
            link: url + $(item).attr('href')
        });
    });
    return postList;
};
request(url)
    .then(function (data) {
    return parseList(data);
})
    .then(function (postList) {
    return checkUpdate(postList);
})
    .then(function (latest) {
    if (latest.length)
        send(latest.map(function (obj) { return "<".concat(obj.link, "|").concat(obj.name, ">"); }).join('\n'));
});
/*
.then(latest => {
  latest.forEach(obj => {
    parseContent(obj.link)
    .then(doc => {
      send(`*${doc.title}*\n${doc.textContent}`)
    })
  })
})
*/
