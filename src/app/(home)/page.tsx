'use client'

import { useState, useMemo } from 'react'
import { useSize } from '@/hooks/use-size'
import { useBlogIndex } from '@/hooks/use-blog-index'
import HeroArea from './hero-area'
import CategoryPills from './category-pills'
import ArticlesList from './articles-list'
import SidebarStats from './sidebar-stats'
import SidebarTagCloud from './sidebar-tag-cloud'
import SidebarUpdates from './sidebar-updates'
import SidebarDaily from './sidebar-daily'

export default function Home() {
	const { maxSM } = useSize()
	const { boardItems: items, loading } = useBlogIndex()
	const [selectedCategory, setSelectedCategory] = useState<string>('')

	const filtered = useMemo(() => {
		if (!selectedCategory) return items
		return items.filter(i => i.category === selectedCategory)
	}, [items, selectedCategory])

	if (loading) {
		return (
			<div className='flex min-h-screen items-center justify-center'>
				<div className='h-8 w-8 animate-spin rounded-full border-2 border-brand/30 border-t-brand' />
			</div>
		)
	}

	return (
		<div className='mx-auto w-full max-w-7xl px-4 pt-20 pb-12 md:px-8'>
			{/* Hero Card */}
			<HeroArea items={items} />

			{/* Category Pills */}
			<CategoryPills items={items} />

			{/* Main 2-column */}
			<div className='mt-8 flex flex-col gap-8 lg:flex-row'>
				{/* Articles list (left) */}
				<main className='min-w-0 flex-1'>
					<div className='rounded-2xl border bg-white/60 p-5'>
						{selectedCategory ? (
							<div className='mb-4 flex items-center gap-3'>
								<h2 className='text-sm font-bold text-brand'>{selectedCategory}</h2>
								<button onClick={() => setSelectedCategory('')} className='text-secondary text-xs hover:text-brand'>
									&times; 清除筛选
								</button>
							</div>
						) : (
							<h2 className='text-secondary mb-4 text-xs font-medium tracking-widest uppercase'>最新文章</h2>
						)}
						<ArticlesList items={filtered} />
					</div>
				</main>

				{/* Sidebar (right) */}
				{!maxSM && (
					<aside className='w-full shrink-0 space-y-4 lg:w-[280px]'>
						<SidebarStats items={items} />
						<SidebarTagCloud items={items} />
						<SidebarUpdates />
						<SidebarDaily />
					</aside>
				)}
			</div>
		</div>
	)
}
