#!/usr/bin/env node

import { loadNodes } from './load-nodes.js'
import { savePages } from './save-pages.js'

savePages(process.argv[3], loadNodes(process.argv[2]))
