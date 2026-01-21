'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { useMarkdownRender } from '@/hooks/use-markdown-render'
import { pushAbout, type AboutData } from './services/push-about'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import LikeButton from '@/components/like-button'
import GithubSVG from '@/svgs/github.svg'

'use client'
export function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-8 rounded cursor-pointer" />
  )
}

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
			await pushAbout(data)
			setOriginalData(data)
			setIsEditMode(false)
			setIsPreviewMode(false)
			toast.success('同步成功')
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
					<motion.div
						initial={{ opacity: 0, y: 15 }}
						animate={{ opacity: 1, y: 0 }}
						className='mb-12 text-center'
					>
						<h1 className='font-averia text-5xl font-bold italic tracking-tighter'>
							{data.title}
						</h1>
						<p className='mt-4 text-secondary/60 italic text-sm'>
							{data.description}
						</p>
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
						<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>

							{/* 左侧区域（关键：overflow-hidden） */}
							<div className='md:col-span-2 flex flex-col gap-6 overflow-hidden'>

								<motion.section
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									className='card p-8 md:p-10'
								>
									<h3 className='font-averia text-xl mb-6 italic text-brand border-b border-brand/10 pb-2'>
										Profile & Introduction
									</h3>
									<div className='prose prose-sm max-w-none dark:prose-invert'>
										{loading ? '渲染中...' : content}
									</div>
								</motion.section>

								<motion.section
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.1 }}
									className='card p-8'
								>
									<h3 className='font-averia text-xl mb-6 italic'>
										Technical Toolbox
									</h3>

									<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
										{(data.techStack || [
											{ name: 'Next.js', icon: '⚡', desc: 'React Framework' },
											{ name: 'TypeScript', icon: '📘', desc: 'Type Safety' },
											{ name: 'Tailwind', icon: '🎨', desc: 'Styling Engine' },
											{ name: 'Nginx', icon: '🚀', desc: 'Web Server' }
										]).map((item, idx) => (
											<div
												key={idx}
												className='flex items-center gap-4 p-4 rounded-2xl bg-secondary/5 border border-transparent hover:border-brand/20 transition-all'
											>
												<span className='text-3xl'>{item.icon}</span>
												<div>
													<p className='text-sm font-bold'>{item.name}</p>
													<p className='text-[10px] text-secondary/50 uppercase tracking-tighter'>
														{item.desc}
													</p>
												</div>
											</div>
										))}
									</div>
								</motion.section>
							</div>

							{/* 右侧更新日志（关键：overflow-hidden） */}
							<motion.aside
								initial={{ opacity: 0, x: 10 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.2 }}
								className='md:col-span-1 card p-8 bg-brand/5 border-brand/10 overflow-hidden'
							>
								<h3 className='text-brand text-xs font-bold uppercase tracking-[0.3em] mb-10'>
									Updates History
								</h3>

								<div className='relative space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-brand/20'>
									{(data.updates || [
										{ date: '2026-01-21', title: '更新文章看板功能' },
										{ date: '2025-12-15', title: '完成系统架构搭建' },
										{ date: '2025-11-19', title: '初始化个人博客' }
									]).map((log, i) => (
										<div key={i} className='relative pl-8'>
											<div className='absolute left-0 top-1.5 w-[23px] h-[23px] rounded-full bg-card border-2 border-brand flex items-center justify-center z-10'>
												<div className='w-1 h-1 rounded-full bg-brand' />
											</div>
											<time className='text-[10px] font-mono text-brand/60 block mb-1'>
												{log.date}
											</time>
											<p className='text-sm font-medium leading-snug'>
												{log.title}
											</p>
										</div>
									))}
								</div>
							</motion.aside>
						</div>
					)}

					{/* 底部 */}
					<div className='mt-16 flex items-center justify-center gap-8'>
						<motion.a
							href='https://github.com/YYsuni'
							target='_blank'
							className='bg-card flex h-[58px] w-[58px] items-center justify-center rounded-full border shadow-sm'
						>
							<GithubSVG />
						</motion.a>
						<LikeButton slug='about-v3' />
					</div>
				</div>
			</div>

			{/* 管理面板 */}
			<AnimatePresence>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className='fixed bottom-8 right-8 z-50 flex gap-2'
				>
					{isEditMode ? (
						<div className='flex p-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border rounded-2xl shadow-2xl'>
							<button
								onClick={() => setIsEditMode(false)}
								className='px-4 py-2 text-xs font-medium rounded-xl hover:bg-black/5'
							>
								取消
							</button>
							<button
								onClick={() => setIsPreviewMode(!isPreviewMode)}
								className='px-4 py-2 text-xs font-medium border-x border-black/5'
							>
								{isPreviewMode ? '编辑' : '预览'}
							</button>
							<button
								onClick={handleSave}
								disabled={isSaving}
								className='brand-btn px-6 py-2 text-xs'
							>
								{isSaving ? '同步中...' : (isAuth ? '确认发布' : '导入密钥')}
							</button>
						</div>
					) : (
						!hideEditButton && (
							<button
								onClick={() => setIsEditMode(true)}
								className='card px-6 py-3 text-xs font-bold tracking-widest uppercase backdrop-blur-md hover:border-brand/40 transition-all'
							>
								Manage Page
							</button>
						)
					)}
				</motion.div>
			</AnimatePresence>
		</>
	)
}
