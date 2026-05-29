'use client'

import { useMemo } from 'react'
import type { BlogIndexItem } from '@/hooks/use-blog-index'

interface Props {
	items: BlogIndexItem[]
}

export default function SidebarTagCloud({ items }: Props) {
	const tags = useMemo(() => {
		const count = new Map<string, number>()
		for (const item of items) {
			for (const tag of item.tags || []) {
				count.set(tag, (count.get(tag) || 0) + 1)
			}
		}
		return Array.from(count.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15)
	}, [items])

	if (tags.length === 0) return null

	const maxCount = tags[0]?.[1] || 1

	return (
		<div className='bg-card rounded-xl border p-4'>
			<h3 className='text-secondary mb-3 text-xs font-medium tracking-widest uppercase'>标签云</h3>
			<div className='flex flex-wrap gap-1.5'>
				{tags.map(([tag, count]) => {
					const size = 0.7 + (count / maxCount) * 0.5
					return (
						<a
							key={tag}
							href={`/board?tag=${encodeURIComponent(tag)}`}
							className='hover:text-brand text-secondary rounded-full bg-secondary/5 px-2 py-0.5 transition-colors hover:bg-brand/10'
							style={{ fontSize: `${size}rem` }}
						>
							{tag}
						</a>
					)
				})}
			</div>
		</div>
	)
}
