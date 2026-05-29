'use client'

import { useEffect, useState } from 'react'
import { useConfigStore } from './stores/config-store'
import ActivityHeatmap from './activity-heatmap'
import GithubSVG from '@/svgs/github.svg'
import EmailSVG from '@/svgs/email.svg'
import BilibiliSVG from '@/svgs/哔哩哔哩.svg'
import JuejinSVG from '@/svgs/juejin.svg'
import XiaohongshuSVG from '@/svgs/小红书.svg'
import ZhihuSVG from '@/svgs/知乎.svg'
import WechatSVG from '@/svgs/wechat.svg'
import { toast } from 'sonner'
import type { BlogIndexItem } from '@/hooks/use-blog-index'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
	github: GithubSVG,
	email: EmailSVG,
	bilibili: BilibiliSVG,
	juejin: JuejinSVG,
	xiaohongshu: XiaohongshuSVG,
	zhihu: ZhihuSVG,
	wechat: WechatSVG
}

interface SocialButton {
	id: string
	type: string
	value: string
	label?: string
}

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

	const socialButtons = (siteContent as any).socialButtons as SocialButton[] | undefined

	const handleSocialClick = (btn: SocialButton) => {
		if (btn.type === 'email' || btn.type === 'wechat') {
			navigator.clipboard.writeText(btn.value).then(() => {
				toast.success(btn.type === 'email' ? '邮箱已复制' : '微信号已复制')
			})
		} else {
			window.open(btn.value, '_blank')
		}
	}

	return (
		<div className='mb-8 rounded-2xl border border-white/20 bg-white/30 p-6 backdrop-blur-sm'>
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

					{socialButtons && socialButtons.length > 0 && (
						<div className='mt-3 flex flex-wrap justify-center gap-2 sm:justify-start'>
							{socialButtons.map(btn => {
								const Icon = ICON_MAP[btn.type]
								if (!Icon) return null
								return (
									<button
										key={btn.id}
										onClick={() => handleSocialClick(btn)}
										className='rounded-full border border-white/30 bg-white/50 p-1.5 transition-colors hover:bg-white/80 hover:shadow-sm'
										title={btn.label || btn.type}
									>
										<Icon className='h-4 w-4' />
									</button>
								)
							})}
						</div>
					)}

					<ActivityHeatmap items={items} />
				</div>
			</div>
		</div>
	)
}
