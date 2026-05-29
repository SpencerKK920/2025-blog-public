'use client'

import { Search } from 'lucide-react'

interface Props {
	value: string
	onChange: (v: string) => void
}

export default function SearchBar({ value, onChange }: Props) {
	return (
		<div className='relative mx-auto mb-6 max-w-md'>
			<Search className='text-secondary/50 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
			<input
				type='text'
				value={value}
				onChange={e => onChange(e.target.value)}
				placeholder='搜索文章...'
				className='w-full rounded-xl border border-white/30 bg-white/50 py-2.5 pl-10 pr-4 text-sm backdrop-blur-sm transition-colors placeholder:text-secondary/50 focus:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/20'
			/>
		</div>
	)
}
