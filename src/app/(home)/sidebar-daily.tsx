'use client'

import Link from 'next/link'
import pictureList from '@/app/pictures/list.json'
import dayjs from 'dayjs'

export default function SidebarDaily() {
	const items = (Array.isArray(pictureList) ? pictureList : []).slice(0, 4)
	if (items.length === 0) return null

	return (
		<div className='bg-card rounded-xl border p-4'>
			<h3 className='text-secondary mb-3 text-xs font-medium tracking-widest uppercase'>
				日常动态
				<Link href='/pictures' className='text-brand/50 ml-2 font-normal hover:text-brand'>
					更多 &rarr;
				</Link>
			</h3>
			<div className='space-y-3'>
				{items.map(p => {
					const img = p.images?.[0] || ''
					const date = dayjs(p.uploadedAt).format('MM-DD')
					return (
						<Link key={p.id} href='/pictures' className='flex items-center gap-3 group'>
							{img ? (
								<img src={img} alt='' className='h-14 w-14 shrink-0 rounded-lg object-cover' loading='lazy' />
							) : (
								<div className='bg-secondary/10 h-14 w-14 shrink-0 rounded-lg' />
							)}
							<div className='min-w-0 flex-1'>
								<p className='text-secondary/80 line-clamp-1 text-xs'>{p.description || '无描述'}</p>
								<p className='text-secondary/50 mt-0.5 text-[10px] font-mono'>{date}</p>
							</div>
						</Link>
					)
				})}
			</div>
		</div>
	)
}
