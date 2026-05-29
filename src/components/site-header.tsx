'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
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

function HeaderSearch() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [val, setVal] = useState(searchParams.get('q') || '')

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (val.trim()) {
			router.push(`/?q=${encodeURIComponent(val.trim())}`)
		} else {
			router.push('/')
		}
	}

	return (
		<form onSubmit={handleSubmit} className='relative'>
			<Search className='text-secondary/40 absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2' />
			<input
				type='text'
				value={val}
				onChange={e => setVal(e.target.value)}
				placeholder='搜索...'
				className='w-36 rounded-full border border-white/30 bg-white/40 py-1.5 pl-8 pr-3 text-xs backdrop-blur-sm transition-all placeholder:text-secondary/40 focus:w-48 focus:border-brand/30 focus:outline-none'
			/>
		</form>
	)
}

export default function SiteHeader() {
	const pathname = usePathname()
	const { siteContent } = useConfigStore()

	return (
		<header className='fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-white/40 backdrop-blur-md'>
			<div className='mx-auto flex max-w-7xl items-center justify-between px-8 py-3'>
				<Link href='/' className='shrink-0'>
					<span className='font-averia text-lg font-medium'>{siteContent.meta.title || 'YiKG'}</span>
				</Link>

				<div className='flex items-center gap-2'>
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
					<HeaderSearch />
				</div>
			</div>
		</header>
	)
}
