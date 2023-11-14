import { writeFile } from 'node:fs/promises'
import type { NodesType } from './load-nodes.js'
import {
  chatTreeExternalLinkOptionSchema,
  ChatTreeExternalLinkOptionType,
  chatTreeInternalLinkOptionSchema,
  ChatTreeInternalLinkOptionType,
  ChatTreeNodeType,
  chatTreeSelectNodeSchema,
  ChatTreeSelectNodeType,
  chatTreeTerminalNodeSchema,
  ChatTreeTerminalNodeType,
  chatTreeTransparentNodeSchema,
  ChatTreeTransparentNodeType,
} from './schemas.js'

const isSelectNode = (node: unknown): node is ChatTreeSelectNodeType => chatTreeSelectNodeSchema.safeParse(node).success
const isTransparentNode = (node: unknown): node is ChatTreeTransparentNodeType => chatTreeTransparentNodeSchema.safeParse(node).success
const isTerminalNode = (node: unknown): node is ChatTreeTerminalNodeType => chatTreeTerminalNodeSchema.safeParse(node).success
const isInternalLinkOption = (option: unknown): option is ChatTreeInternalLinkOptionType => chatTreeInternalLinkOptionSchema.safeParse(option).success
const isExternalLinkOption = (option: unknown): option is ChatTreeExternalLinkOptionType => chatTreeExternalLinkOptionSchema.safeParse(option).success

const resolveKeys = (currentFullKey: string, nextKeys: string | string[]): string[] => {
  const nextKeysArray = Array.isArray(nextKeys) ? nextKeys : [nextKeys]
  return nextKeysArray.map((nextKey) => (nextKey.includes(':') ? nextKey : [currentFullKey.split(':')[0], nextKey].join(':')))
}

type PageFragmentType = {
  msg: ChatTreeNodeType['msg']
  opt?: ReadonlyArray<
    {
      msg: ChatTreeSelectNodeType['opt'][number]['msg']
      active?: boolean
    } & (
      | {
          href: string
        }
      | {
          to: string
        }
    )
  >
  active?: boolean
}
type PageType = { path: string | undefined; page: ReadonlyArray<PageFragmentType> }

const joinPagePath = (pageData: PageType, lastPath: string): PageType => ({
  path: [pageData.path, lastPath].filter((s) => s).join('/'),
  page: pageData.page,
})
const mergePageFragment = (pageData: PageType, lastFragment: PageFragmentType): PageType => ({
  path: pageData.path,
  page: [...pageData.page, lastFragment],
})

const makeLastActive = (pageData: PageType, enabled: boolean | undefined): PageType =>
  enabled
    ? {
        path: pageData.path,
        page: pageData.page.map((fragment, index) => ({ ...fragment, active: index === pageData.page.length - 1 ? true : undefined })),
      }
    : pageData
const makeOptionActive = (pageData: PageType, optionIndex: number): PageType => ({
  path: pageData.path,
  page: pageData.page.map((fragment, index) => {
    if (index === pageData.page.length - 1) {
      return { ...fragment, opt: fragment.opt?.map((option, index) => ({ ...option, active: index === optionIndex ? true : undefined })) }
    }
    return fragment
  }),
})

const buildPage = (allNodes: NodesType) => {
  const buildPage = (pageData: PageType, keyStack: string[], afterSelect?: boolean): ReadonlyArray<PageType> => {
    const leafKey = keyStack.pop()
    if (leafKey === undefined) {
      return []
    }

    const leafNode = allNodes[leafKey]
    if (leafNode === undefined) {
      console.error(`Node not found: ${leafKey}`)
      return []
    }

    if (isSelectNode(leafNode)) {
      const internalLinkOptions = leafNode.opt.filter(isInternalLinkOption)
      const rawKeyForEachOption = internalLinkOptions.map((option) => (Array.isArray(option.next) ? option.next[0] : option.next))
      const urlKeyForEachOption = rawKeyForEachOption.map((key) =>
        encodeURIComponent(key.replace(/:root$/, '').replaceAll(/[\\/:*?"'<>.%]/g, '-')).replaceAll('%', '')
      )
      const uniqueKeys = urlKeyForEachOption.reduce<string[]>((result, key, index) => {
        if (!result.includes(key)) {
          result.push(key)
          return result
        }
        const keyWithIndex = key + index
        if (!result.includes(keyWithIndex)) {
          result.push(keyWithIndex)
          return result
        }
        throw new Error('Failed to create the unique key')
      }, [])

      const currentPage: PageType = makeLastActive(
        mergePageFragment(pageData, {
          ...leafNode,
          opt: leafNode.opt.flatMap((option): ReadonlyArray<NonNullable<PageFragmentType['opt']>[number]> => {
            if (isInternalLinkOption(option)) {
              return [
                {
                  msg: option.msg,
                  to: [pageData.path, uniqueKeys[internalLinkOptions.indexOf(option)]].filter((s) => s).join('/'),
                },
              ]
            }
            if (isExternalLinkOption(option)) {
              return [
                {
                  msg: option.msg,
                  href: option.link,
                },
              ]
            }

            console.error(`Unknown option type: ${leafKey}`)
            return []
          }),
        }),
        afterSelect
      )
      const childrenPages: ReadonlyArray<PageType> = internalLinkOptions
        .map((option, index) => {
          const selectedOptionIndex = leafNode.opt.indexOf(option)
          const nextKeys = resolveKeys(leafKey, option.next).reverse()
          return buildPage(joinPagePath(makeOptionActive(currentPage, selectedOptionIndex), uniqueKeys[index]), [...keyStack, ...nextKeys], true)
        })
        .flat()
      return [currentPage, ...childrenPages]
    }
    if (isTransparentNode(leafNode)) {
      const nextKeys = resolveKeys(leafKey, leafNode.next).reverse()
      return buildPage(makeLastActive(mergePageFragment(pageData, leafNode), afterSelect), [...keyStack, ...nextKeys])
    }
    if (isTerminalNode(leafNode)) {
      return [makeLastActive(mergePageFragment(pageData, leafNode), afterSelect)]
    }

    console.error(`Unknown node type: ${leafKey}`)
    return []
  }
  return buildPage
}

export const savePages = async (filePath: string, data: NodesType | Promise<NodesType>): Promise<void> => {
  const builtPages = buildPage(await data)({ path: undefined, page: [] }, ['main:root'])
  try {
    writeFile(filePath, JSON.stringify(builtPages, undefined, 2), { encoding: 'utf-8' })
  } catch (e) {
    console.error(`File write error at ${filePath}: `, e)
  }
}
