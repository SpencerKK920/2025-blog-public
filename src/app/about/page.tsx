'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { useMarkdownRender } from '@/hooks/use-markdown-render'
import { pushAbout, type AboutData } from './services/push-about'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import LikeButton from '@/components/like-button'
import GithubSVG from '@/svgs/github.svg'
import initialData from './list.json'

// 这里的 ExtendedData 对应你 list.json 的扩展
interface ExtendedData extends AboutData {
	techStack?: { name: string; icon: string; desc: string }[]
	updates?: { date: string; title: string }[]
}

export default function AboutPage() {
	const [data, setData] = useState<ExtendedData>(initialData as ExtendedData)
	const [originalData, setOriginalData] = useState<ExtendedData>(initialData as ExtendedData)
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
			await pushAbout(data) // 提交到 GitHub
			setOriginalData(data)
			setIsEditMode(false)
			setIsPreviewMode(false)
			toast.success('发布成功！')
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
				<div className='w-full max-w-[1150px]'>
					
					{/* 页面标题 */}
					<motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className='mb-12 text-center'>
						<h1 className='font-averia text-5xl md:text-6xl font-bold italic tracking-tighter'>{data.title}</h1>
						<div className='bg-brand mx-auto h-1 w-12 mt-4 rounded-full opacity-40' />
					</motion.div>

					{isEditMode && !isPreviewMode ? (
						/* 编辑模式 */
						<div className='card p-1 shadow-2xl'>
							<textarea
								className='min-h-[500px] w-full resize-none bg-transparent p-6 font-mono text-sm leading-relaxed outline-none'
								value={data.content}
								onChange={e => setData({ ...data, content: e.target.value })}
							/>
						</div>
					) : (
						/* 核心布局：Grid 分列，items-stretch 确保左右等高 */
						<div className='grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch'>
							
							{/* 【左侧容器】：通过 flex-col 确保上下两个框绝对不重叠 */}
							<div className='md:col-span-2 flex flex-col gap-6'>
								
								{/* 1. 个人与网页介绍 (上框) */}
								<motion.section 
									initial={{ opacity: 0, x: -10 }} 
									animate={{ opacity: 1, x: 0 }}
									className='card p-8 md:p-10 flex-1 relative overflow-hidden'
								>
									<h3 className='font-averia text-xl mb-6 italic text-brand'>Introduction</h3>
									<div className='prose prose-sm max-w-none dark:prose-invert relative z-10'>
										{loading ? '渲染中...' : content}
									</div>
								</motion.section>

								{/* 2. 技术栈 (下框) - 图标+文字样式 */}
								<motion.section 
									initial={{ opacity: 0, x: -10 }} 
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.1 }}
									className='card p-8'
								>
									<h3 className='font-averia text-xl mb-6 italic'>Technical Stack</h3>
									<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
										{/* 你可以在这里修改显示的图标和文字 */}
										{(data.techStack || [
											{ name: 'Next.js', icon: '⚡', desc: 'React 核心框架' },
											{ name: 'TypeScript', icon: '📘', desc: '类型安全语言' },
											{ name: 'Tailwind', icon: '🎨', desc: '原子化 CSS' },
											{ name: 'Linux', icon: '🐧', desc: '系统运维与部署' }
										]).map((item, idx) => (
											<div key={idx} className='flex items-center gap-4 p-4 rounded-2xl bg-secondary/5 border border-transparent hover:border-brand/20 transition-all group'>
												<span className='text-3xl grayscale group-hover:grayscale-0 transition-all'>{item.icon}</span>
												<div>
													<p className='text-sm font-bold'>{item.name}</p>
													<p className='text-[10px] text-secondary/50 uppercase'>{item.desc}</p>
												</div>
											</div>
										))}
									</div>
								</motion.section>
							</div>

							{/* 【右侧容器】：纵向长框 (网站更新日志) */}
							<motion.aside 
								initial={{ opacity: 0, x: 10 }} 
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.2 }}
								className='md:col-span-1 card p-8 bg-brand/5 border-brand/10 flex flex-col'
							>
								<h3 className='text-brand text-xs font-bold uppercase tracking-[0.3em] mb-10'>Update Journal</h3>
								<div className='relative flex-1 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-brand/20'>
									{(data.updates || [
										{ date: '2026-01-21', title: '更新文章看板功能' },
										{ date: '2026-01-18', title: '关于页面 Bento 布局重构' },
										{ date: '2025-12-11', title: 'Nginx 负载均衡配置优化' }
									]).map((log, i) => (
										<div key={i} className='relative pl-8'>
											<div className='absolute left-0 top-1.5 w-[23px] h-[23px] rounded-full bg-card border-2 border-brand flex items-center justify-center z-10 shadow-sm'>
												<div className='w-1 h-1 rounded-full bg-brand animate-pulse' />
											</div>
											<time className='text-[10px] font-mono text-brand/60 block mb-1'>{log.date}</time>
											<p className='text-sm font-medium leading-snug opacity-80'>{log.title}</p>
										</div>
									))}
								</div>
							</motion.aside>
						</div>
					)}

					{/* 底部按钮 */}
					<div className='mt-16 flex items-center justify-center gap-8'>
						<motion.a href='https://github.com/YYsuni' target='_blank' className='bg-card flex h-[58px] w-[58px] items-center justify-center rounded-full border shadow-sm'>
							<GithubSVG />
						</motion.a>
						<LikeButton slug='about-v3' />
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
							<button onClick={handleSave} disabled={isSaving} className='brand-btn px-6 py-2 text-xs'>
								{isSaving ? '同步中...' : (isAuth ? '确认发布' : '导入密钥')}
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
