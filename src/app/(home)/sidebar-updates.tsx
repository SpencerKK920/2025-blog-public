'use client'

import aboutData from '@/app/about/list.json'

export default function SidebarUpdates() {
	const changelog = aboutData.changelog || ''
	const lines = changelog.split('\n').filter(Boolean).slice(0, 5)

	return (
		<div className='bg-white/30 backdrop-blur-sm rounded-xl border border-white/20 p-4'>
			<h3 className='text-secondary mb-3 text-xs font-medium tracking-widest uppercase'>站点动态</h3>
			<div className='max-h-[200px] space-y-2 overflow-auto text-xs scrollbar-none'>
				{lines.length === 0 ? (
					<p className='text-secondary/50 text-xs'>暂无动态</p>
				) : (
					lines.map((line, i) => {
						const idx = line.indexOf(' ')
						const date = idx > 0 ? line.slice(0, idx) : ''
						const text = idx > 0 ? line.slice(idx + 1) : line
						return (
							<div key={i} className='flex gap-2'>
								<span className='text-secondary/50 shrink-0 font-mono text-[10px]'>{date}</span>
								<span className='text-secondary/70 text-[11px]'>{text}</span>
							</div>
						)
					})
				)}
			</div>
		</div>
	)
}
