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

// --- 【修改处：在这里直接填写你的信息】 ---
const INITIAL_DATA = {
    title: "About Studio",
    description: "2026 / 重新定义阅读与记录的边界",
    // 1. 个人/网页介绍 (支持 Markdown)
    intro: "这里是你的个人介绍。描述一下你是谁，以及这个站点的故事。\n\n支持使用 **Markdown** 语法进行加粗、列表等排版。",
    // 2. 技术栈配置 (图标 + 名称 + 描述)
    tech: [
        { name: "Next.js 15", icon: "⚡", desc: "React 核心框架" },
        { name: "TypeScript", icon: "📘", desc: "类型安全开发" },
        { name: "Tailwind CSS", icon: "🎨", desc: "原子化样式引擎" },
        { name: "Linux / Nginx", icon: "🐧", desc: "运维部署环境" },
        { name: "Redis", icon: "💾", desc: "高效缓存存储" },
        { name: "Framer Motion", icon: "🎬", desc: "丝滑动画交互" }
    ],
    // 3. 右侧更新日志
    logs: [
        { date: "2026-01-21", event: "更新文章看板与三栏布局功能" },
        { date: "2026-01-18", event: "优化移动端导航与管理控制台" },
        { date: "2025-12-11", event: "Nginx 负载均衡配置完成" },
        { date: "2025-11-19", event: "Studio 1.0 正式部署上线" }
    ]
}

export default function AboutPage() {
	const [data, setData] = useState(INITIAL_DATA)
	const [isEditMode, setIsEditMode] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [isPreviewMode, setIsPreviewMode] = useState(false)
	const keyInputRef = useRef<HTMLInputElement>(null)

	const { isAuth, setPrivateKey } = useAuthStore()
	const { siteContent } = useConfigStore()
	const { content, loading } = useMarkdownRender(data.intro)
	const hideEditButton = siteContent.hideEditButton ?? false

	const handleSave = async () => {
		setIsSaving(true)
		try {
			// 保留你原有的推送逻辑
			await pushAbout({ ...data, content: data.intro } as any)
			setIsEditMode(false)
			toast.success('配置已同步至 GitHub')
		} catch (error: any) {
			toast.error(`同步失败: ${error?.message}`)
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<div className='min-h-screen bg-[#fafafa] dark:bg-[#050505]'>
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

			<div className='mx-auto flex w-full max-w-[1150px] flex-col px-6 pt-32 pb-24'>
				{/* 顶部标题区 */}
				<motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className='mb-12 text-left'>
					<h1 className='font-averia text-5xl md:text-7xl font-bold italic tracking-tighter text-black dark:text-white'>
						{data.title}
					</h1>
					<p className='mt-6 text-secondary/50 italic font-mono text-xs uppercase tracking-widest'>{data.description}</p>
				</motion.div>

				{isEditMode && !isPreviewMode ? (
					/* 编辑模式编辑器 */
					<div className='card p-1 shadow-2xl bg-white dark:bg-zinc-900'>
						<textarea
							className='min-h-[500px] w-full resize-none bg-transparent p-6 font-mono text-sm leading-relaxed outline-none'
							value={data.intro}
							onChange={e => setData({ ...data, intro: e.target.value })}
						/>
					</div>
				) : (
					/* --- 核心布局：Grid 3 列 --- */
					<div className='grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch'>
						
						{/* 【左侧容器】：使用 flex-col 强制上下排列，绝对不会重叠 */}
						<div className='md:col-span-2 flex flex-col gap-6'>
							
							{/* 上框：介绍 (Introduction) */}
							<motion.section 
								initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
								className='card p-8 md:p-12 flex-1 bg-white dark:bg-zinc-900 border-none shadow-sm'
							>
								<h3 className='font-averia text-2xl mb-8 italic text-brand'>Introduction</h3>
								<div className='prose prose-neutral dark:prose-invert max-w-none leading-relaxed'>
									{loading ? '渲染中...' : content}
								</div>
							</motion.section>

							{/* 下框：技术栈 (Tech Stack) - 模仿图二图标样式 */}
							<motion.section 
								initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.1 }}
								className='card p-8 bg-white dark:bg-zinc-900 border-none shadow-sm'
							>
								<h3 className='font-averia text-2xl mb-8 italic'>Technical Toolbox</h3>
								<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
									{data.tech.map((item, i) => (
										<div key={i} className='flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-transparent hover:border-brand/30 transition-all group'>
											<span className='text-3xl grayscale group-hover:grayscale-0 transition-all duration-500'>{item.icon}</span>
											<div>
												<div className='font-bold text-sm'>{item.name}</div>
												<div className='text-[10px] text-secondary opacity-50 uppercase tracking-tighter'>{item.desc}</div>
											</div>
										</div>
									))}
								</div>
							</motion.section>
						</div>

						{/* 【右侧区域】：独立长条 (Update Log) */}
						<motion.aside 
							initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.2 }}
							className='md:col-span-1 card p-8 bg-brand/5 border-brand/10 flex flex-col'
						>
							<h3 className='text-brand text-xs font-bold uppercase tracking-[0.4em] mb-12'>Update Journal</h3>
							
							<div className='relative flex-1 space-y-10 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-brand/20'>
								{data.logs.map((log, i) => (
									<div key={i} className='relative pl-8 group'>
										{/* 时间轴圆点 */}
										<div className='absolute left-0 top-1.5 w-[23px] h-[23px] rounded-full bg-card border-2 border-brand flex items-center justify-center z-10'>
											<div className='w-1.5 h-1.5 rounded-full bg-brand group-hover:scale-150 transition-all' />
										</div>
										<div className='text-[10px] font-mono text-brand mb-2'>{log.date}</div>
										<p className='text-sm font-medium leading-snug opacity-70 group-hover:opacity-100 transition-opacity'>{log.event}</p>
									</div>
								))}
							</div>
						</motion.aside>
					</div>
				)}

				{/* 底部互动 */}
				<div className='mt-20 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-900 pt-10'>
					<div className='flex gap-6'>
						<motion.a whileHover={{ y: -3 }} href='https://github.com/YYsuni' target='_blank' className='p-3 bg-zinc-100 dark:bg-zinc-900 rounded-full'>
							<GithubSVG />
						</motion.a>
					</div>
					<LikeButton slug='about-final' />
				</div>
			</div>

			{/* 管理浮动面板 */}
			<AnimatePresence>
				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='fixed bottom-10 right-10 z-50 flex gap-2'>
					{isEditMode ? (
						<div className='flex p-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border rounded-2xl shadow-2xl'>
							<button onClick={() => setIsEditMode(false)} className='px-4 py-2 text-xs font-medium rounded-xl hover:bg-black/5'>取消</button>
							<button onClick={() => setIsPreviewMode(!isPreviewMode)} className='px-4 py-2 text-xs font-medium border-x border-zinc-100 dark:border-zinc-800'>{isPreviewMode ? '编辑模式' : '实时预览'}</button>
							<button onClick={() => isAuth ? handleSave() : keyInputRef.current?.click()} disabled={isSaving} className='brand-btn px-6 py-2 text-xs'>
								{isSaving ? '同步中...' : (isAuth ? '发布修改' : '验证私钥')}
							</button>
						</div>
					) : (
						!hideEditButton && (
							<button onClick={() => setIsEditMode(true)} className='card px-6 py-3 text-xs font-bold tracking-widest uppercase backdrop-blur-md hover:border-brand/40 transition-all shadow-xl'>
								Manage Page
							</button>
						)
					)}
				</motion.div>
			</AnimatePresence>
		</div>
	)
}
