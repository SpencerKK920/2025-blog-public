import type { BlogConfig } from '@/app/blog/types'

export type { BlogConfig } from '@/app/blog/types'

export type LoadedBlog = {
	slug: string
	config: BlogConfig
	markdown: string
	cover?: string
}

// Simple YAML frontmatter parser — handles both inline and multi-line formats (Obsidian-compatible)
function parseFrontmatter(raw: string): { data: Record<string, any>; content: string } {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
	if (!match) return { data: {}, content: raw }

	const lines = match[1].split('\n')
	const content = raw.slice(match[0].length)
	const data: Record<string, any> = {}

	let i = 0
	while (i < lines.length) {
		const line = lines[i]
		const colonIdx = line.indexOf(':')

		if (colonIdx === -1) { i++; continue }

		const key = line.slice(0, colonIdx).trim()
		const afterColon = line.slice(colonIdx + 1).trim()

		if (!key) { i++; continue }

		// Multi-line array: key:\n  - item1\n  - item2
		if (afterColon === '' && i + 1 < lines.length && /^\s{2,}-\s/.test(lines[i + 1])) {
			const arr: string[] = []
			i++
			while (i < lines.length && /^\s{2,}-\s/.test(lines[i])) {
				const item = lines[i].replace(/^\s{2,}-\s/, '').trim()
				arr.push(item.replace(/^["']|["']$/g, ''))
				i++
			}
			data[key] = arr
			continue
		}

		// Inline array: [a, b, c] or ["a", "b"]
		if (afterColon.startsWith('[') && afterColon.endsWith(']')) {
			const inner = afterColon.slice(1, -1).trim()
			if (!inner) { data[key] = []; i++; continue }
			data[key] = inner.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''))
			i++
			continue
		}

		// Quoted string
		if ((afterColon.startsWith('"') && afterColon.endsWith('"')) ||
		    (afterColon.startsWith("'") && afterColon.endsWith("'"))) {
			data[key] = afterColon.slice(1, -1)
			i++
			continue
		}

		// Boolean
		if (afterColon === 'true') { data[key] = true; i++; continue }
		if (afterColon === 'false') { data[key] = false; i++; continue }

		// Plain scalar (may be empty)
		data[key] = afterColon
		i++
	}

	return { data, content }
}

function formatDateVal(val: unknown): string | undefined {
	if (val instanceof Date) {
		const pad = (n: number) => String(n).padStart(2, '0')
		return `${val.getFullYear()}-${pad(val.getMonth() + 1)}-${pad(val.getDate())}T${pad(val.getHours())}:${pad(val.getMinutes())}`
	}
	if (typeof val === 'string') return val
	return undefined
}

function normalizeConfig(frontmatter: Record<string, any>): BlogConfig {
	return {
		title: typeof frontmatter.title === 'string' ? frontmatter.title.trim() : undefined,
		tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
		date: formatDateVal(frontmatter.date),
		summary: typeof frontmatter.summary === 'string' ? frontmatter.summary : undefined,
		cover: typeof frontmatter.cover === 'string' ? frontmatter.cover : undefined,
		hidden: typeof frontmatter.hidden === 'boolean' ? frontmatter.hidden : undefined,
		category: typeof frontmatter.category === 'string' ? frontmatter.category : undefined
	}
}

export async function loadBlog(slug: string): Promise<LoadedBlog> {
	if (!slug) throw new Error('Slug is required')

	// Try flat .md file first, then folder/index.md
	// Don't encodeURIComponent — browser handles non-ASCII URLs natively
	let mdRes = await fetch(`/blogs/${slug}.md`)
	if (!mdRes.ok) {
		mdRes = await fetch(`/blogs/${slug}/index.md`)
		if (!mdRes.ok) throw new Error('Blog not found')
	}

	const rawMarkdown = await mdRes.text()
	const parsed = parseFrontmatter(rawMarkdown)
	const hasFrontmatter = 'title' in parsed.data

	let config: BlogConfig

	if (hasFrontmatter) {
		config = normalizeConfig(parsed.data)
	} else {
		config = {}
		const configRes = await fetch(`/blogs/${slug}/config.json`)
		if (configRes.ok) {
			try { config = await configRes.json() } catch { config = {} }
		}
	}

	return {
		slug,
		config,
		markdown: parsed.content,
		cover: config.cover
	}
}
