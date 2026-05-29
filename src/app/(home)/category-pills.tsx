'use client'

import type { BlogIndexItem } from '@/hooks/use-blog-index'

interface Props {
	items: BlogIndexItem[]
}

export default function CategoryPills({ items }: Props) {
	const categories = Array.from(new Set(items.map(i => i.category).filter(Boolean)))
	if (categories.length === 0) return null

	return (
		<div className='flex flex-wrap gap-2'>
			{categories.map(cat => (
				<a
					key={cat}
					href={`/board?category=${encodeURIComponent(cat || '')}`}
					className='rounded-full border border-brand/20 bg-brand/5 px-4 py-1.5 text-xs text-brand transition-colors hover:bg-brand hover:text-white'
				>
					{cat}
				</a>
			))}
		</div>
	)
}
