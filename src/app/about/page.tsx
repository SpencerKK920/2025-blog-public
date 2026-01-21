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

// 扩展类型以匹配新布局
interface ExtendedAboutData extends AboutData {
    techStack?: { name: string; desc: string; icon: string }[]
    updates?: { date: string; event: string }[]
}

export default function Page() {
	const [data, setData] = useState<ExtendedAboutData>(initialData as ExtendedAboutData)
	const [originalData, setOriginalData] = useState<ExtendedAboutData>(initialData as ExtendedAboutData)
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
			await pushAbout(data) // 提交到仓库
			setOriginalData(data)
			setIsEditMode(false)
			setIsPreviewMode(false)
			toast.success('发布成功！')
		} catch (error: any) {
			toast.error(`保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	const handleSaveClick = () => {
		if (!isAuth) keyInputRef.current?.click()
		else handleSave()
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
				<div className='w-full max-w-[1200px]'>
					
					{/* 页面大标题 */}
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-12 text-center'>
						<h1 className='font-averia text-5xl font-bold italic tracking-tighter'>{data.title}</h1>
						<p className='mt-4 text-secondary italic opacity-60'>{data.description}</p>
					</motion.div>

					{isEditMode && !isPreviewMode ? (
						/* 编辑模式：显示文本编辑框 */
						<div className='space-y-6'>
							<div className='grid grid-cols-2 gap-4'>
								<input className='card p-4 font-bold' value={data.title} onChange={e => setData({...data, title: e.target.value})} placeholder="页面标题" />
								<input className='card p-4' value={data.description} onChange={e => setData({...data, description: e.target.value})} placeholder="副标题" />
							</div>
							<textarea 
								className='card w-full min-h-[400px] p-6 font-mono text-sm' 
								value={data.content} 
								onChange={e => setData({...data, content: e.target.value})}
								placeholder="Markdown 个人介绍内容..."
							/>
							<p className="text-xs text-secondary opacity-50">注：技术栈和更新日志请在 list.json 中手动配置或等待后续功能升级。</p>
						</div>
					) : (
						/* 展示模式：三栏布局 */
						<div className='grid grid-cols-1 md:grid-cols-3 gap-6 items-start'>
							
							{/* 左侧：上下分割结构 */}
							<div className='md:col-span-2 flex flex-col gap-6'>
								
								{/* 上框：个人与网页介绍 */}
								<motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className='card p-8 md:p-10 min-h-[300px]'>
									<div className='prose prose-sm max-w-none'>
										<h3 className='font-averia text-xl mb-6 italic border-b pb-2'>Introduction</h3>
										{loading ? '渲染中...' : content}
									</div>
								</motion.div>

								{/* 下框：技术栈 (模仿图二) */}
								<motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className='card p-8'>
									<h3 className='font-averia text-xl mb-6 italic'>Tech Stack</h3>
									<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
										{(data.techStack || []).map((tech, i) => (
											<div key={i} className='flex items-center gap-4 p-4 rounded-2xl bg-secondary/5 border border-transparent hover:border-brand/30 transition-all group'>
												<div className='text-3xl grayscale group-hover:grayscale-0 transition-all'>{tech.icon}</div>
												<div>
													<div className='font-bold text-sm'>{tech.name}</div>
													<div className='text-[10px] text-secondary opacity-60'>{tech.desc}</div>
												</div>
											</div>
										))}
									</div>
								</motion.div>
							</div>

							{/* 右侧：竖向长框（更新内容） */}
							<motion.div 
								initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} 
								className='card h-full p-8 bg-brand/5 border-brand/10'
							>
								<h3 className='text-brand text-xs font-bold uppercase tracking-widest mb-8'>Update Log</h3>
								<div className='space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-brand/20'>
									{(data.updates || []).map((log, i) => (
										<div key={i} className='relative pl-8 group'>
											<div className='absolute left-0 top-1.5 w-[23px] h-[23px] rounded-full bg-card border-2 border-brand flex items-center justify-center z-10'>
												<div className='w-1.5 h-1.5 rounded-full bg-brand group-hover:scale-150 transition-transform' />
											</div>
											<div className='text-[10px] font-mono text-brand mb-1'>{log.date}</div>
											<div className='text-sm font-medium leading-relaxed opacity-80'>{log.event}</div>
										</div>
									))}
								</div>
							</motion.div>
						</div>
					)}

					{/* 底部互动 */}
					<div className='mt-12 flex items-center justify-center gap-8'>
						<motion.a href='https://github.com/YYsuni/2025-blog-public' target='_blank' className='bg-card flex h-[58px] w-[58px] items-center justify-center rounded-full border shadow-sm'>
							<GithubSVG />
						</motion.a>
						<LikeButton slug='about-v3' delay={0.1} />
					</div>
				</div>
			</div>

			{/* 管理浮动面板 */}
			<motion.div className='fixed top-4 right-6 z-50 flex gap-3 max-sm:hidden'>
				{isEditMode ? (
					<>
						<button onClick={() => setIsEditMode(false)} className='rounded-xl border bg-white/80 backdrop-blur px-6 py-2 text-sm'>取消</button>
						<button onClick={() => setIsPreviewMode(!isPreviewMode)} className='rounded-xl border bg-white/80 backdrop-blur px-6 py-2 text-sm'>
							{isPreviewMode ? '返回编辑' : '预览'}
						</button>
						<button onClick={handleSaveClick} disabled={isSaving} className='brand-btn px-6'>
							{isSaving ? '正在推送到仓库...' : (isAuth ? '发布' : '导入密钥')}
						</button>
					</>
				) : (
					!hideEditButton && (
						<button onClick={() => setIsEditMode(true)} className='card px-6 py-2 text-sm backdrop-blur-md hover:bg-white/90'>
							进入管理模式
						</button>
					)
				)}
			</motion.div>
		</>
	)
}
