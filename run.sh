#!/bin/bash
npx tsc $1 && node ${1%%.ts} $2
