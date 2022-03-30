### Web Crawler
A simple web crawler to fetch updated web page content and send notification

### Features
- convert non-utf8 content (e.g. gbk)
- jQuery like syntax for DOM operations
- use firefox reader view to unify content
- disintct the updated list
- send notification to Slack channel

### Install
```
npm i
```

### Basic Usage
```
update listRule for the web page

./run.sh index https://target-web
```

### Cron Usage
```
SLACK_TOKEN="xoxb-"
* * * * * pathto/run.sh index https://target-web
```
