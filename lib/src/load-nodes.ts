import { readdir, readFile } from 'node:fs/promises'
import { parse, resolve, sep } from 'node:path'
import { FAILSAFE_SCHEMA, load } from 'js-yaml'
import { chatTreeFileSchema, ChatTreeNodeType } from './schemas.js'

export type NodesType = Record<string, ChatTreeNodeType>

export const loadNodes = async (directoryPath: string): Promise<NodesType> => {
  const nodes: NodesType = {}
  try {
    const fileNames = await readdir(directoryPath, { recursive: true })
    for (const fileName of fileNames) {
      const { dir, name } = parse(fileName)
      const fileKey = [dir, name].filter((s) => s).join(sep)
      try {
        const fileString = await readFile(resolve(directoryPath, fileName), { encoding: 'utf-8' })
        try {
          const yamlObject = load(fileString, { schema: FAILSAFE_SCHEMA })
          try {
            const yamlData = await chatTreeFileSchema.parseAsync(yamlObject)
            for (const yamlItem of yamlData) {
              const fullKey = [fileKey, yamlItem.key].join(':')
              nodes[fullKey] = yamlItem
            }
          } catch (e) {
            console.error(`Yaml parse error at ${fileName}: `, e)
            continue
          }
        } catch (e) {
          console.error(`Yaml load error at ${fileName}: `, e)
          continue
        }
      } catch (e) {
        console.error(`File read error at ${fileName}: `, e)
        continue
      }
    }
  } catch (e) {
    console.error(`Directory read error at ${directoryPath}: `, e)
  }
  return nodes
}
