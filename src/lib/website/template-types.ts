// src/lib/website/template-types.ts
// Shared type for website template metadata. Split out to avoid a
// circular import between templates.ts and the templates-data chunks.

export type WebsiteTemplate = {
  id: string
  label: string
  category: string
  color: string
  bg: string
  industries: string[]
  keywords: string[]
  description: string
}
