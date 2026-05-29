'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useConfigStore } from '@/app/(home)/stores/config-store'

const links = [
	{ label: '首页', href: '/' },
	{ label: '知识库', href: '/kb' },
	{ label: '看板', href: '/board' },
	{ label: '项目', href: '/projects' },
	{ label: '推荐', href: '/share' },
	{ label: '影视', href: '/anime' },
	{ label: '关于', href: '/about' }
]

export default function SiteHeader() {
	const pathname = usePathname()
	const { siteContent } = useConfigStore()

	return (
		<header className='fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-white/40 backdrop-blur-md'>
			<div className='mx-auto flex max-w-7xl items-center justify-between px-8 py-3'>
				<Link href='/' className='shrink-0'>
					<span className='font-averia text-lg font-medium'>{siteContent.meta.title || 'YiKG'}</span>
				</Link>

				<nav className='flex items-center gap-1'>
					{links.map(l => {
						const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href))
						return (
							<Link
								key={l.href}
								href={l.href}
								className={cn(
									'rounded-full px-3 py-1.5 text-sm transition-colors',
									active ? 'bg-brand/10 text-brand font-medium' : 'text-secondary hover:text-primary'
								)}
							>
								{l.label}
							</Link>
						)
					})}
				</nav>
			</div>
		</header>
	)
}
