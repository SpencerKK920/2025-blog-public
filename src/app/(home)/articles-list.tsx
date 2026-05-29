'use client'

import Link from 'next/link'
import dayjs from 'dayjs'
import type { BlogIndexItem } from '@/hooks/use-blog-index'

interface Props {
	items: BlogIndexItem[]
}

export default function ArticlesList({ items }: Props) {
	if (items.length === 0) {
		return <div className='text-secondary py-20 text-center text-sm'>暂无文章</div>
	}

	return (
		<div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
			{items.map(post => (
				<Link
					key={post.slug}
					href={`/blog/${post.slug}`}
					className='group flex h-full flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/40 backdrop-blur-sm transition-shadow hover:shadow-lg'
				>
					{post.cover ? (
						<div className='h-48 w-full shrink-0 overflow-hidden'>
							<img
								src={post.cover}
								alt={post.title}
								className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
							/>
						</div>
					) : (
						<div className='flex h-48 w-full shrink-0 items-center justify-center bg-gradient-to-br from-brand/5 via-secondary/5 to-brand/10'>
							<span className='text-secondary/30 text-4xl'>&#9998;</span>
						</div>
					)}
					<div className='flex flex-1 flex-col p-5'>
						<div className='mb-2 flex items-center gap-3'>
							{post.category && (
								<span className='rounded-sm bg-brand px-2 py-0.5 text-[9px] font-bold tracking-widest text-white uppercase'>
									{post.category}
								</span>
							)}
							<span className='text-secondary text-[10px] font-mono'>{dayjs(post.date).format('YYYY-MM-DD')}</span>
						</div>
						<h2 className='font-averia group-hover:text-brand mb-2 line-clamp-2 text-lg font-bold transition-colors italic'>
							{post.title}
						</h2>
						<p className='text-secondary/70 mb-4 line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed'>
							{post.summary || '点击阅读全文'}
						</p>
						<div className='mt-auto'>
							<span className='text-brand text-xs font-bold'>
								READ MORE &rarr;
							</span>
						</div>
					</div>
				</Link>
			))}
		</div>
	)
}
