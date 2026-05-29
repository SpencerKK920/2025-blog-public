'use client'

import { useEffect, useState } from 'react'
import { useConfigStore } from './stores/config-store'
import ActivityHeatmap from './activity-heatmap'
import type { BlogIndexItem } from '@/hooks/use-blog-index'

export default function HeroArea({ items }: { items: BlogIndexItem[] }) {
	const { siteContent } = useConfigStore()
	const username = siteContent.meta.username || 'Suni'

	const [now, setNow] = useState(new Date())
	useEffect(() => {
		const t = setInterval(() => setNow(new Date()), 1000)
		return () => clearInterval(t)
	}, [])

	const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
	const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

	return (
		<div className='mb-8 rounded-2xl border bg-white/80 p-6'>
			<div className='flex flex-col items-center gap-6 sm:flex-row sm:items-start'>
				<img
					src='/images/avatar.png'
					className='rounded-full shrink-0'
					style={{ width: 90, height: 90, boxShadow: '0 12px 28px -4px #E2D9CE' }}
					alt='avatar'
				/>
				<div className='flex-1 text-center sm:text-left'>
					<h1 className='font-averia text-2xl font-bold'>
						<span className='text-linear text-[28px]'>{username}</span>
					</h1>
					<p className='text-secondary mt-0.5 text-sm'>{dateStr}</p>
					<p className='text-secondary/60 text-xs font-mono'>{timeStr}</p>
					<ActivityHeatmap items={items} />
				</div>
			</div>
		</div>
	)
}
