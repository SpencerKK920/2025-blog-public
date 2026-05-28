const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

const ROOT = path.join(__dirname, '..')
const BLOGS_DIR = path.join(ROOT, 'public', 'blogs')
const INDEX_OUT = path.join(BLOGS_DIR, 'index.json')
const CATEGORIES_OUT = path.join(BLOGS_DIR, 'categories.json')

const SKIP_NAMES = new Set(['index.json', 'categories.json', '_template'])

function formatDate(val) {
  if (val instanceof Date) {
    const pad = n => String(n).padStart(2, '0')
    const y = val.getFullYear()
    const m = pad(val.getMonth() + 1)
    const d = pad(val.getDate())
    const h = pad(val.getHours())
    const min = pad(val.getMinutes())
    return `${y}-${m}-${d}T${h}:${min}`
  }
  if (typeof val === 'string') return val
  return ''
}

function processFrontmatter(slug, raw) {
  const { data } = matter(raw)
  return {
    slug,
    title: (data.title ?? '').trim(),
    tags: Array.isArray(data.tags) ? data.tags : [],
    date: formatDate(data.date),
    summary: data.summary ?? '',
    cover: data.cover ?? '',
    hidden: data.hidden ?? false,
    category: data.category ?? '',
    onBoard: data.onBoard
  }
}

function processLegacy(slug) {
  const configPath = path.join(BLOGS_DIR, slug, 'config.json')
  if (!fs.existsSync(configPath)) return null
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  if (!config.title) return null
  return {
    slug,
    title: config.title,
    tags: config.tags || [],
    date: config.date || '',
    summary: config.summary || '',
    cover: config.cover || '',
    hidden: config.hidden || false,
    category: config.category || '',
    onBoard: config.onBoard ?? undefined
  }
}

function main() {
  if (!fs.existsSync(BLOGS_DIR)) {
    console.log('Blogs directory not found, skipping index generation.')
    return
  }

  const entries = fs.readdirSync(BLOGS_DIR, { withFileTypes: true })
  const blogItems = []
  const categorySet = new Set()
  const seenSlugs = new Set()

  for (const entry of entries) {
    const name = entry.name
    if (SKIP_NAMES.has(name)) continue
    if (name.startsWith('_')) continue

    if (entry.isFile() && name.endsWith('.md')) {
      // Flat .md file — slug is filename without extension
      const slug = name.replace(/\.md$/, '')
      if (seenSlugs.has(slug)) continue
      seenSlugs.add(slug)

      try {
        const raw = fs.readFileSync(path.join(BLOGS_DIR, name), 'utf-8')
        const parsed = matter(raw)

        let item
        if ('title' in parsed.data) {
          item = processFrontmatter(slug, raw)
        } else {
          item = processLegacy(slug)
        }

        if (item) {
          blogItems.push(item)
          if (item.category) categorySet.add(item.category)
        }
      } catch (err) {
        console.error(`Error processing ${name}:`, err.message)
      }
    } else if (entry.isDirectory()) {
      // Folder with index.md (or single .md file)
      const slug = name
      if (seenSlugs.has(slug)) continue
      seenSlugs.add(slug)

      // Prefer index.md, fallback to any .md file
      let mdPath = path.join(BLOGS_DIR, slug, 'index.md')
      if (!fs.existsSync(mdPath)) {
        const innerEntries = fs.readdirSync(path.join(BLOGS_DIR, slug), { withFileTypes: true })
        const mdFile = innerEntries.find(e => e.isFile() && e.name.endsWith('.md'))
        if (mdFile) {
          mdPath = path.join(BLOGS_DIR, slug, mdFile.name)
        } else {
          continue
        }
      }

      try {
        const raw = fs.readFileSync(mdPath, 'utf-8')
        const parsed = matter(raw)

        let item
        if ('title' in parsed.data) {
          item = processFrontmatter(slug, raw)
        } else {
          item = processLegacy(slug)
        }

        if (item) {
          blogItems.push(item)
          if (item.category) categorySet.add(item.category)
        }
      } catch (err) {
        console.error(`Error processing ${slug}:`, err.message)
      }
    }
  }

  blogItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Preserve onBoard values from existing index (set via web editor, not in frontmatter)
  if (fs.existsSync(INDEX_OUT)) {
    try {
      const oldIndex = JSON.parse(fs.readFileSync(INDEX_OUT, 'utf-8'))
      const onBoardMap = new Map((Array.isArray(oldIndex) ? oldIndex : []).map((i: any) => [i.slug, i.onBoard]))
      for (const item of blogItems) {
        if (onBoardMap.has(item.slug) && item.onBoard === undefined) {
          item.onBoard = onBoardMap.get(item.slug)
        }
      }
    } catch (err) {
      console.error('Failed to preserve onBoard from existing index:', err.message)
    }
  }

  fs.writeFileSync(INDEX_OUT, JSON.stringify(blogItems, null, 2))
  console.log(`Generated ${INDEX_OUT} with ${blogItems.length} articles.`)

  const categories = Array.from(categorySet).sort()
  fs.writeFileSync(CATEGORIES_OUT, JSON.stringify({ categories }, null, 2))
  console.log(`Generated ${CATEGORIES_OUT} with ${categories.length} categories.`)
}

main()
