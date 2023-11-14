import { z } from 'zod'

//// definition ////

const internalLinkItemSchema = z.string().min(1)
const internalLinkSchema = z.union([internalLinkItemSchema, z.array(internalLinkItemSchema).nonempty()])

//// chat tree option ///

const chatTreeBaseOptionSchema = z.object({
  msg: z.object({
    ja: z.string(),
    en: z.string(),
  }),
})

export const chatTreeInternalLinkOptionSchema = chatTreeBaseOptionSchema.extend({
  next: internalLinkSchema,
})
export type ChatTreeInternalLinkOptionType = z.infer<typeof chatTreeInternalLinkOptionSchema>

export const chatTreeExternalLinkOptionSchema = chatTreeBaseOptionSchema.extend({
  link: z.string().url(),
})
export type ChatTreeExternalLinkOptionType = z.infer<typeof chatTreeExternalLinkOptionSchema>

export const chatTreeOptionSchema = z.union([chatTreeInternalLinkOptionSchema, chatTreeExternalLinkOptionSchema])

//// chat tree node ///

const chatTreeBaseNodeSchema = z.object({
  key: z.string().regex(/^[^:]+$/),
  msg: z.object({
    ja: z.string(),
    en: z.string(),
  }),
})

export const chatTreeSelectNodeSchema = chatTreeBaseNodeSchema.extend({
  opt: z.array(chatTreeOptionSchema).nonempty(),
})
export type ChatTreeSelectNodeType = z.infer<typeof chatTreeSelectNodeSchema>

export const chatTreeTransparentNodeSchema = chatTreeBaseNodeSchema.extend({
  next: internalLinkSchema,
})
export type ChatTreeTransparentNodeType = z.infer<typeof chatTreeTransparentNodeSchema>

export const chatTreeTerminalNodeSchema = chatTreeBaseNodeSchema.extend({})
export type ChatTreeTerminalNodeType = z.infer<typeof chatTreeTerminalNodeSchema>

export const chatTreeNodeSchema = z.union([chatTreeSelectNodeSchema, chatTreeTransparentNodeSchema, chatTreeTerminalNodeSchema])
export type ChatTreeNodeType = z.infer<typeof chatTreeNodeSchema>

/// chat tree file ///

export const chatTreeFileSchema = z.array(chatTreeNodeSchema)
