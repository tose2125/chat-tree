#!/usr/bin/env node

import { watch } from 'chokidar'
import { loadNodes } from './load-nodes.js'
import { savePages } from './save-pages.js'

let timeout: NodeJS.Timeout
watch(process.argv[2]).on('all', () => {
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    console.log(new Date())
    savePages(process.argv[3], loadNodes(process.argv[2]))
  }, 1000)
})
