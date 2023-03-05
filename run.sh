#!/bin/bash
/Users/kato/.nvm/versions/node/v18.7.0/bin/npx tsc $1 && /Users/kato/.nvm/versions/node/v18.7.0/bin/node ${1%%.ts} $2
