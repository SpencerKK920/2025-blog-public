'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { useMarkdownRender } from '@/hooks/use-markdown-render'
import { pushAbout } from './services/push-about'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import LikeButton from '@/components/like-button'
import GithubSVG from '@/svgs/github.svg'

// --- 【在这里修改你的信息】 ---
const ABOUT_CONTENT = {
    title: "About Studio",
    description: "2026.01.21 / 灵感与技术的碰撞",
    // 1. 个人与网页介绍 (支持 Markdown)
    intro: "这里写你的个人介绍。你可以描述你是一名 Linux 运维爱好者，或者是 Next.js 开发者。\n\n这个网页是我的个人实验室，记录关于 Nginx、Redis、Keepalived 以及现代前端技术的点点滴滴。希望能在这里与你分享有价值的内容。",
    // 2. 技术栈 (图标 + 名字 + 描述)
    tech: [
        { name: "Next.js", icon: "⚡", desc: "React 全栈框架" },
        { name: "TypeScript", icon: "📘", desc: "类型安全开发" },
        { name: "Linux", icon: "🐧", desc: "运维与自动化" },
        { name: "Nginx", icon: "🚀", desc: "高性能 Web 服务器" },
        { name: "Redis", icon: "💾", desc: "分布式缓存方案" },
        { name: "Tailwind", icon: "🎨", desc: "现代 UI 引擎" }
    ],
    // 3. 更新日志 (右侧长框)
    logs: [
        { date: "2026-01-21", event: "更新文章看板功能，优化首页性能" },
        { date: "2026-01-20", event: "关于页面 Bento 布局 3.0 重写" },
        { date: "2026-01-15", event: "集成 Trakt 影视追踪数据流" },
        { date: "2025-12-11", event: "配置 Nginx 跨服务器负载均衡" },
        { date: "2025-11-19", event: "Studio 博客系统正式初始化" }
    ]
}

export default function AboutPage() {
	const [data, setData] = useState({
        title: ABOUT_CONTENT.title,
        description: ABOUT_CONTENT.description,
        content: ABOUT_CONTENT.intro
    })
	const [isEditMode, setIsEditMode] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [isPreviewMode, setIsPreviewMode] = useState(false)
	const keyInputRef = useRef<HTMLInputElement>(null)

	const { isAuth, setPrivateKey } = useAuthStore()
	const { siteContent } = useConfigStore()
	const { content, loading } = useMarkdownRender(data.content)
	const hideEditButton = siteContent.hideEditButton ?? false

	const handleSave = async () => {
		setIsSaving(true)
		try {
			await pushAbout(data as any) // 保留你原来的提交逻辑
			setIsEditMode(false)
			toast.success('同步成功！')
		} catch (error: any) {
			toast.error(`同步失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<>
			<input
				ref={keyInputRef}
				type='file'
				accept='.pem'
				className='hidden'
				onChange={async e => {
					const f = e.target.files?.[0]
					if (f) {
						const text = await f.text()
						setPrivateKey(text)
						await handleSave()
					}
				}}
			/>

			<div className='flex flex-col items-center px-6 pt-32 pb-24 max-sm:px-4'>
				<div className='w-full max-w-[1100px]'>
					
					{/* 页面头部 */}
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-12 text-center'>
						<h1 className='font-averia text-5xl md:text-6xl font-bold italic tracking-tighter'>{data.title}</h1>
						<p className='mt-4 text-secondary/40 italic font-mono uppercase tracking-widest text-xs'>{data.description}</p>
					</motion.div>

					{isEditMode && !isPreviewMode ? (
						<div className='card p-1 shadow-2xl bg-white dark:bg-zinc-900'>
							<textarea
								className='min-h-[500px] w-full resize-none bg-transparent p-6 font-mono text-sm leading-relaxed outline-none'
								value={data.content}
								onChange={e => setData({ ...data, content: e.target.value })}
							/>
						</div>
					) : (
						/* --- 核心布局：Grid 3 列 --- */
						<div className='grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch'>
							
							{/* 【左侧区域】：占据 2 列，内部垂直堆叠 */}
							<div className='md:col-span-2 flex flex-col gap-6'>
								
								{/* 1. 介绍框 (上) */}
								<motion.section 
									initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
									className='card p-8 md:p-10 flex-1 relative bg-white/50 backdrop-blur-sm'
								>
									<h3 className='font-averia text-2xl mb-8 italic text-brand flex items-center gap-2'>
										<span className='w-6 h-px bg-brand/30' />
										Introduction
									</h3>
									<div className='prose prose-sm max-w-none dark:prose-invert leading-relaxed'>
										{loading ? '渲染中...' : content}
									</div>
								</motion.section>

								{/* 2. 技术栈 (下) - 模仿图二样式 */}
								<motion.section 
									initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.1 }}
									className='card p-8'
								>
									<h3 className='font-averia text-2xl mb-8 italic'>Technical Toolbox</h3>
									<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
										{ABOUT_CONTENT.tech.map((tech, i) => (
											<div key={i} className='flex items-center gap-4 p-4 rounded-2xl bg-secondary/5 border border-transparent hover:border-brand/30 transition-all group'>
												<span className='text-3xl grayscale group-hover:grayscale-0 transition-all duration-500'>{tech.icon}</span>
												<div>
													<div className='font-bold text-sm'>{tech.name}</div>
													<div className='text-[10px] text-secondary opacity-50 uppercase tracking-tighter'>{tech.desc}</div>
												</div>
											</div>
										))}
									</div>
								</motion.section>
							</div>

							{/* 【右侧区域】：占据 1 列，纵向长条看板 */}
							<motion.aside 
								initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.2 }}
								className='md:col-span-1 card p-8 bg-brand/5 border-brand/10 flex flex-col'
							>
								<h3 className='text-brand text-xs font-bold uppercase tracking-[0.4em] mb-12'>Update Journal</h3>
								
								<div className='relative flex-1 space-y-10 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-brand/20'>
									{ABOUT_CONTENT.logs.map((log, i) => (
										<div key={i} className='relative pl-8 group'>
											<div className='absolute left-0 top-1.5 w-[23px] h-[23px] rounded-full bg-card border-2 border-brand flex items-center justify-center z-10'>
												<div className='w-1.5 h-1.5 rounded-full bg-brand group-hover:scale-150 transition-all duration-300' />
											</div>
											<div className='text-[10px] font-mono text-brand mb-2'>{log.date}</div>
											<p className='text-sm font-medium leading-snug opacity-70 group-hover:opacity-100 transition-opacity'>{log.event}</p>
										</div>
									))}
								</div>
								
								<div className='mt-12 text-[10px] font-mono opacity-20 text-right uppercase italic'>
									Studio System v2.6.1
								</div>
							</motion.aside>
						</div>
					)}

					{/* 底部按钮 */}
					<div className='mt-16 flex items-center justify-center gap-8'>
						<motion.a href='https://github.com/YYsuni' target='_blank' className='bg-card flex h-[58px] w-[58px] items-center justify-center rounded-full border shadow-sm hover:shadow-lg transition-shadow'>
							<GithubSVG />
						</motion.a>
						<LikeButton slug='about-final-v3' />
					</div>
				</div>
			</div>

			{/* 管理悬浮面板 */}
			<AnimatePresence>
				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='fixed bottom-8 right-8 z-50 flex gap-2'>
					{isEditMode ? (
						<div className='flex p-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border rounded-2xl shadow-2xl'>
							<button onClick={() => setIsEditMode(false)} className='px-4 py-2 text-xs font-medium rounded-xl hover:bg-black/5'>取消</button>
							<button onClick={() => setIsPreviewMode(!isPreviewMode)} className='px-4 py-2 text-xs font-medium border-x border-black/5'>{isPreviewMode ? '编辑模式' : '实时预览'}</button>
							<button onClick={() => isAuth ? handleSave() : keyInputRef.current?.click()} disabled={isSaving} className='brand-btn px-6 py-2 text-xs'>
								{isSaving ? '同步中...' : (isAuth ? '发布' : '验证私钥')}
							</button>
						</div>
					) : (
						!hideEditButton && (
							<button onClick={() => setIsEditMode(true)} className='card px-6 py-3 text-xs font-bold tracking-widest uppercase backdrop-blur-md hover:border-brand/40 transition-all shadow-xl active:scale-95'>
								Manage Page
							</button>
						)
					)}
				</motion.div>
			</AnimatePresence>
		</>
	)
}
