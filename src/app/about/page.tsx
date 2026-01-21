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

// --- 【修改处：在这里直接填入你的初始信息】 ---
const DEFAULT_DATA = {
    title: "About Studio",
    description: "2026 重新出发，构建极致的阅读体验",
    content: "这里写你的个人介绍和网页介绍。支持 **Markdown** 语法。\n\n你可以描述你的设计理念，或者这个站点诞生的故事。",
    // 技术栈配置
    techStack: [
        { name: "Next.js 15", desc: "React 核心框架", icon: "⚡" },
        { name: "TypeScript", desc: "类型安全开发", icon: "📘" },
        { name: "Tailwind CSS", desc: "高效原子化样式", icon: "🎨" },
        { name: "Framer Motion", desc: "丝滑动画引擎", icon: "🎬" },
        { name: "Linux / Nginx", desc: "高性能运维部署", icon: "🐧" },
        { name: "Redis / MyCAT", desc: "数据存储与优化", icon: "💾" }
    ],
    // 更新日志配置
    updates: [
        { date: "2026-01-21", event: "更新文章看板功能" },
        { date: "2026-01-18", event: "关于页面 Bento 布局重构" },
        { date: "2025-12-15", event: "集成 Trakt 影视追踪系统" },
        { date: "2025-11-19", event: "Studio 1.0 版本正式上线" }
    ]
}

export default function AboutPage() {
	const [data, setData] = useState(DEFAULT_DATA)
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
			await pushAbout(data as any) // 保留你原有的提交逻辑
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
					
					{/* 页面标题区 */}
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-16 text-center'>
						<h1 className='font-averia text-5xl md:text-7xl font-bold italic tracking-tighter'>{data.title}</h1>
						<p className='mt-4 text-secondary/50 italic text-lg'>{data.description}</p>
					</motion.div>

					{isEditMode && !isPreviewMode ? (
						<div className='card p-1 shadow-2xl'>
							<textarea
								className='min-h-[500px] w-full resize-none bg-transparent p-6 font-mono text-sm leading-relaxed outline-none'
								value={data.content}
								onChange={e => setData({ ...data, content: e.target.value })}
							/>
						</div>
					) : (
						/* 核心网格布局：绝对不重叠 */
						<div className='grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch'>
							
							{/* 【左侧垂直容器】：包含 介绍(上) 和 技术栈(下) */}
							<div className='md:col-span-2 flex flex-col gap-6'>
								
								{/* 1. 个人介绍框 (上) */}
								<motion.section 
									initial={{ opacity: 0, x: -20 }} 
									animate={{ opacity: 1, x: 0 }}
									className='card p-8 md:p-12 flex-1 bg-white/50 backdrop-blur-sm'
								>
									<h3 className='font-averia text-2xl mb-8 italic text-brand border-b border-brand/10 pb-2'>Profile</h3>
									<div className='prose prose-neutral dark:prose-invert max-w-none'>
										{loading ? '渲染中...' : content}
									</div>
								</motion.section>

								{/* 2. 技术栈框 (下) */}
								<motion.section 
									initial={{ opacity: 0, x: -20 }} 
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.1 }}
									className='card p-8'
								>
									<h3 className='font-averia text-2xl mb-8 italic'>Toolbox</h3>
									<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
										{data.techStack.map((tech, i) => (
											<div key={i} className='flex items-center gap-4 p-4 rounded-2xl bg-secondary/5 border border-transparent hover:border-brand/30 transition-all group'>
												<span className='text-3xl grayscale group-hover:grayscale-0 transition-all'>{tech.icon}</span>
												<div>
													<div className='font-bold text-sm'>{tech.name}</div>
													<div className='text-[10px] text-secondary opacity-50 uppercase tracking-tighter'>{tech.desc}</div>
												</div>
											</div>
										))}
									</div>
								</motion.section>
							</div>

							{/* 【右侧独立长框】：更新日志 */}
							<motion.aside 
								initial={{ opacity: 0, x: 20 }} 
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.2 }}
								className='md:col-span-1 card p-8 bg-brand/5 border-brand/10 flex flex-col'
							>
								<h3 className='text-brand text-xs font-bold uppercase tracking-[0.3em] mb-12'>Update Journal</h3>
								<div className='relative flex-1 space-y-10 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-brand/20'>
									{data.updates.map((log, i) => (
										<div key={i} className='relative pl-8 group'>
											<div className='absolute left-0 top-1.5 w-[23px] h-[23px] rounded-full bg-card border-2 border-brand flex items-center justify-center z-10 shadow-sm'>
												<div className='w-1.5 h-1.5 rounded-full bg-brand group-hover:scale-150 transition-transform' />
											</div>
											<time className='text-[10px] font-mono text-brand block mb-2'>{log.date}</time>
											<p className='text-sm font-medium leading-snug opacity-80 group-hover:opacity-100 transition-opacity'>{log.event}</p>
										</div>
									))}
								</div>
								<div className='mt-12 text-[10px] text-brand/30 font-mono italic text-right'>
									STU-V2.5.1
								</div>
							</motion.aside>
						</div>
					)}

					{/* 底部按钮 */}
					<div className='mt-16 flex items-center justify-center gap-8'>
						<motion.a href='https://github.com/YYsuni' target='_blank' className='bg-card flex h-[58px] w-[58px] items-center justify-center rounded-full border shadow-sm transition-shadow hover:shadow-lg'>
							<GithubSVG />
						</motion.a>
						<LikeButton slug='about-final' />
					</div>
				</div>
			</div>

			{/* 管理悬浮面板 */}
			<AnimatePresence>
				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='fixed bottom-8 right-8 z-50 flex gap-2'>
					{isEditMode ? (
						<div className='flex p-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border rounded-2xl shadow-2xl'>
							<button onClick={() => setIsEditMode(false)} className='px-4 py-2 text-xs font-medium rounded-xl hover:bg-black/5'>取消</button>
							<button onClick={() => setIsPreviewMode(!isPreviewMode)} className='px-4 py-2 text-xs font-medium border-x border-black/5'>{isPreviewMode ? '编辑' : '预览'}</button>
							<button onClick={() => isAuth ? handleSave() : keyInputRef.current?.click()} disabled={isSaving} className='brand-btn px-6 py-2 text-xs'>
								{isSaving ? '正在同步...' : (isAuth ? '确认发布' : '导入密钥')}
							</button>
						</div>
					) : (
						!hideEditButton && (
							<button onClick={() => setIsEditMode(true)} className='card px-6 py-3 text-xs font-bold tracking-widest uppercase backdrop-blur-md hover:border-brand/40 transition-all shadow-xl'>
								Manage Studio
							</button>
						)
					)}
				</motion.div>
			</AnimatePresence>
		</>
	)
}
