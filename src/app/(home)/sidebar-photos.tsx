'use client'

import Link from 'next/link'
import pictureList from '@/app/pictures/list.json'

export default function SidebarPhotos() {
	const photos = (Array.isArray(pictureList) ? pictureList : []).slice(0, 4)
	if (photos.length === 0) return null

	return (
		<div className='bg-card rounded-xl border p-4'>
			<h3 className='text-secondary mb-3 text-xs font-medium tracking-widest uppercase'>
				近期照片
				<Link href='/pictures' className='text-brand/50 ml-2 font-normal hover:text-brand'>
					更多 &rarr;
				</Link>
			</h3>
			<div className='grid grid-cols-2 gap-1.5'>
				{photos.map(p => {
					const img = p.images?.[0] || ''
					return (
						<Link key={p.id} href='/pictures' className='block'>
							<img src={img} alt={p.description || ''} className='h-20 w-full rounded-lg object-cover transition-opacity hover:opacity-80' loading='lazy' />
						</Link>
					)
				})}
			</div>
		</div>
	)
}
