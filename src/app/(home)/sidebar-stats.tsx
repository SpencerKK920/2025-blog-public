'use client'

import { useMemo } from 'react'
import type { BlogIndexItem } from '@/hooks/use-blog-index'

interface Props {
	items: BlogIndexItem[]
}

export default function SidebarStats({ items }: Props) {
	const stats = useMemo(() => {
		const total = items.length
		const categoryCount = new Set(items.map(i => i.category).filter(Boolean)).size
		const tagCount = new Set(items.flatMap(i => i.tags || [])).size
		return { total, categoryCount, tagCount }
	}, [items])

	return (
		<div className='bg-card rounded-xl border p-4'>
			<h3 className='text-secondary mb-3 text-xs font-medium tracking-widest uppercase'>站点统计</h3>
			<div className='grid grid-cols-3 gap-2 text-center'>
				<div>
					<div className='text-brand text-lg font-bold'>{stats.total}</div>
					<div className='text-secondary text-[10px]'>文章</div>
				</div>
				<div>
					<div className='text-brand text-lg font-bold'>{stats.categoryCount}</div>
					<div className='text-secondary text-[10px]'>分类</div>
				</div>
				<div>
					<div className='text-brand text-lg font-bold'>{stats.tagCount}</div>
					<div className='text-secondary text-[10px]'>标签</div>
				</div>
			</div>
		</div>
	)
}
