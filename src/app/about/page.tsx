'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react' // ✅ 修正：确保导入了 AnimatePresence
import { toast } from 'sonner'
import { useMarkdownRender } from '@/hooks/use-markdown-render'
import { pushAbout, type AboutData } from './services/push-about'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import LikeButton from '@/components/like-button'
import GithubSVG from '@/svgs/github.svg'
import initialData from './list.json'
import { cn } from '@/lib/utils'

export default function Page() {
	const [data, setData] = useState<AboutData>(initialData as AboutData)
	const [originalData, setOriginalData] = useState<AboutData>(initialData as AboutData)
	const [isEditMode, setIsEditMode] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [isPreviewMode, setIsPreviewMode] = useState(false)
	const keyInputRef = useRef<HTMLInputElement>(null)

	const { isAuth, setPrivateKey } = useAuthStore()
	const { siteContent } = useConfigStore()
	const { content, loading } = useMarkdownRender(data.content)
	const hideEditButton = siteContent.hideEditButton ?? false

	const handleChoosePrivateKey = async (file: File) => {
		try {
			const text = await file.text()
			setPrivateKey(text)
			await handleSave()
		} catch (error) {
			console.error('Failed to read private key:', error)
			toast.error('读取密钥文件失败')
		}
	}

	const handleSaveClick = () => {
		if (!isAuth) {
			keyInputRef.current?.click()
		} else {
			handleSave()
		}
	}

	const handleEnterEditMode = () => {
		setIsEditMode(true)
		setIsPreviewMode(false)
	}

	const handleSave = async () => {
		setIsSaving(true)
		try {
			await pushAbout(data)
			setOriginalData(data)
			setIsEditMode(false)
			setIsPreviewMode(false)
			toast.success('发布成功！')
		} catch (error: any) {
			console.error('Failed to save:', error)
			toast.error(`保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	const handleCancel = () => {
		setData(originalData)
		setIsEditMode(false)
		setIsPreviewMode(false)
	}

	const buttonText = isAuth ? '发布修改' : '导入私钥'

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isEditMode && (e.ctrlKey || e.metaKey) && e.key === ',') {
				e.preventDefault()
				setIsEditMode(true)
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isEditMode])

	return (
		<>
			<input
				ref={keyInputRef}
				type='file'
				accept='.pem'
				className='hidden'
				onChange={async e => {
					const f = e.target.files?.[0]
					if (f) await handleChoosePrivateKey(f)
					if (e.currentTarget) e.currentTarget.value = ''
				}}
			/>

			<div className='flex flex-col items-center px-6 pt-32 pb-24 max-sm:px-4'>
				<div className='w-full max-w-[1000px]'>
					
					{/* 页面头部 */}
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-16 text-center'>
						{isEditMode && !isPreviewMode ? (
							<div className='flex flex-col gap-4'>
								<input
									className='bg-transparent text-center text-5xl font-bold font-averia outline-none border-b border-brand/20'
									value={data.title}
									onChange={e => setData({ ...data, title: e.target.value })}
								/>
								<input
									className='bg-transparent text-center text-lg text-secondary outline-none'
									value={data.description}
									onChange={e => setData({ ...data, description: e.target.value })}
								/>
							</div>
						) : (
							<>
								<h1 className='font-averia mb-4 text-5xl md:text-6xl font-bold italic tracking-tighter'>{data.title}</h1>
								<div className='bg-brand mx-auto h-1 w-16 rounded-full opacity-60' />
								<p className='mt-6 text-secondary text-sm italic'>{data.description}</p>
							</>
						)}
					</motion.div>

					{isEditMode && !isPreviewMode ? (
						<div className='card p-1 shadow-2xl'>
							<textarea
								placeholder='使用 Markdown 编写内容...'
								className='min-h-[500px] w-full resize-none p-6 text-sm font-mono outline-none bg-transparent'
								value={data.content}
								onChange={e => setData({ ...data, content: e.target.value })}
							/>
						</div>
					) : (
						<div className='grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr'>
							
							{/* 格子 1: Markdown 内容 */}
							<motion.div 
								initial={{ opacity: 0, x: -20 }} 
								animate={{ opacity: 1, x: 0 }} 
								className='md:col-span-2 card p-8 md:p-12 relative overflow-hidden flex flex-col'
							>
								<div className='absolute -top-4 -right-4 p-4 opacity-[0.03] font-averia text-9xl italic pointer-events-none'>Vision</div>
								<div className='prose prose-sm max-w-none relative z-10 flex-1'>
									{loading ? '渲染中...' : content}
								</div>
							</motion.div>

							{/* 格子 2: 站点状态 */}
							<motion.div 
								initial={{ opacity: 0, x: 20 }} 
								animate={{ opacity: 1, x: 0 }} 
								transition={{ delay: 0.1 }}
								className='bg-brand/5 border border-brand/10 squircle p-8 flex flex-col justify-between'
							>
								<div>
									<h3 className='text-brand text-[10px] font-bold uppercase tracking-[0.2em] mb-8'>Site Status</h3>
									<div className='space-y-6'>
										{[
											{ label: 'Platform', value: 'Github Static' },
											{ label: 'Framework', value: 'Next.js 15' },
											{ label: 'UI Engine', value: 'Motion + Tailwind' }
										].map(item => (
											<div key={item.label} className='flex justify-between items-end border-b border-brand/10 pb-2'>
												<span className='text-secondary text-[10px] uppercase opacity-60'>{item.label}</span>
												<span className='font-mono text-xs font-bold'>{item.value}</span>
											</div>
										))}
									</div>
								</div>
								<div className='mt-12 text-[10px] text-brand/40 font-mono italic'>
									Studio Version: 2026.1
								</div>
							</motion.div>

							{/* 格子 3: 技术栈 */}
							<motion.div 
								initial={{ opacity: 0, y: 20 }} 
								animate={{ opacity: 1, y: 0 }} 
								transition={{ delay: 0.2 }}
								className='md:col-span-3 card p-8 group'
							>
								<div className='flex items-center justify-between mb-6'>
									<h3 className='font-averia text-xl italic opacity-70 group-hover:text-brand transition-colors'>Tech Integrated</h3>
									<div className='h-px flex-1 bg-border mx-6 opacity-20' />
								</div>
								<div className='flex flex-wrap gap-3'>
									{['Next.js', 'React', 'TypeScript', 'Tailwind', 'Motion', 'Github API', 'Vercel', 'Sonner'].map(tech => (
										<span key={tech} className='px-4 py-2 bg-secondary/5 border rounded-full text-[11px] font-mono hover:border-brand/40 hover:text-brand transition-all cursor-default'>
											{tech}
										</span>
									))}
								</div>
							</motion.div>
						</div>
					)}

					{/* 底部互动 */}
					<div className='mt-16 flex items-center justify-center gap-8'>
						<motion.a
							href='https://github.com/YYsuni/2025-blog-public'
							target='_blank'
							rel='noreferrer'
							whileHover={{ scale: 1.1, rotate: 5 }}
							className='bg-card flex h-[58px] w-[58px] items-center justify-center rounded-full border shadow-sm transition-shadow hover:shadow-lg'>
							<GithubSVG />
						</motion.a>
						<LikeButton slug='about-studio' delay={0.1} />
					</div>
				</div>
			</div>

			{/* 管理悬浮面板 */}
			<AnimatePresence>
				<motion.div 
					initial={{ opacity: 0, y: 20 }} 
					animate={{ opacity: 1, y: 0 }} 
					exit={{ opacity: 0, y: 20 }}
					className='fixed bottom-8 right-8 z-50 flex gap-3 max-sm:bottom-4 max-sm:right-4'
				>
					{isEditMode ? (
						<div className='flex gap-2 p-2 bg-white/80 backdrop-blur-xl border rounded-2xl shadow-2xl'>
							<button onClick={handleCancel} disabled={isSaving} className='px-4 py-2 text-xs font-medium hover:bg-black/5 rounded-xl transition-colors'>
								取消
							</button>
							<button onClick={() => setIsPreviewMode(!isPreviewMode)} disabled={isSaving} className='px-4 py-2 text-xs font-medium hover:bg-black/5 rounded-xl transition-colors border-x'>
								{isPreviewMode ? '编辑' : '预览'}
							</button>
							<button onClick={handleSaveClick} disabled={isSaving} className='brand-btn px-6 py-2 text-xs shadow-lg shadow-brand/20'>
								{isSaving ? '同步中...' : buttonText}
							</button>
						</div>
					) : (
						!hideEditButton && (
							<button onClick={handleEnterEditMode} className='card px-6 py-3 text-xs font-bold tracking-widest uppercase backdrop-blur-md hover:border-brand/50 transition-all shadow-xl'>
								Enter Admin
							</button>
						)
					)}
				</motion.div>
			</AnimatePresence>
		</>
	)
}'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react' // ✅ 修正：确保导入了 AnimatePresence
import { toast } from 'sonner'
import { useMarkdownRender } from '@/hooks/use-markdown-render'
import { pushAbout, type AboutData } from './services/push-about'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import LikeButton from '@/components/like-button'
import GithubSVG from '@/svgs/github.svg'
import initialData from './list.json'
import { cn } from '@/lib/utils'

export default function Page() {
	const [data, setData] = useState<AboutData>(initialData as AboutData)
	const [originalData, setOriginalData] = useState<AboutData>(initialData as AboutData)
	const [isEditMode, setIsEditMode] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [isPreviewMode, setIsPreviewMode] = useState(false)
	const keyInputRef = useRef<HTMLInputElement>(null)

	const { isAuth, setPrivateKey } = useAuthStore()
	const { siteContent } = useConfigStore()
	const { content, loading } = useMarkdownRender(data.content)
	const hideEditButton = siteContent.hideEditButton ?? false

	const handleChoosePrivateKey = async (file: File) => {
		try {
			const text = await file.text()
			setPrivateKey(text)
			await handleSave()
		} catch (error) {
			console.error('Failed to read private key:', error)
			toast.error('读取密钥文件失败')
		}
	}

	const handleSaveClick = () => {
		if (!isAuth) {
			keyInputRef.current?.click()
		} else {
			handleSave()
		}
	}

	const handleEnterEditMode = () => {
		setIsEditMode(true)
		setIsPreviewMode(false)
	}

	const handleSave = async () => {
		setIsSaving(true)
		try {
			await pushAbout(data)
			setOriginalData(data)
			setIsEditMode(false)
			setIsPreviewMode(false)
			toast.success('发布成功！')
		} catch (error: any) {
			console.error('Failed to save:', error)
			toast.error(`保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	const handleCancel = () => {
		setData(originalData)
		setIsEditMode(false)
		setIsPreviewMode(false)
	}

	const buttonText = isAuth ? '发布修改' : '导入私钥'

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isEditMode && (e.ctrlKey || e.metaKey) && e.key === ',') {
				e.preventDefault()
				setIsEditMode(true)
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isEditMode])

	return (
		<>
			<input
				ref={keyInputRef}
				type='file'
				accept='.pem'
				className='hidden'
				onChange={async e => {
					const f = e.target.files?.[0]
					if (f) await handleChoosePrivateKey(f)
					if (e.currentTarget) e.currentTarget.value = ''
				}}
			/>

			<div className='flex flex-col items-center px-6 pt-32 pb-24 max-sm:px-4'>
				<div className='w-full max-w-[1000px]'>
					
					{/* 页面头部 */}
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-16 text-center'>
						{isEditMode && !isPreviewMode ? (
							<div className='flex flex-col gap-4'>
								<input
									className='bg-transparent text-center text-5xl font-bold font-averia outline-none border-b border-brand/20'
									value={data.title}
									onChange={e => setData({ ...data, title: e.target.value })}
								/>
								<input
									className='bg-transparent text-center text-lg text-secondary outline-none'
									value={data.description}
									onChange={e => setData({ ...data, description: e.target.value })}
								/>
							</div>
						) : (
							<>
								<h1 className='font-averia mb-4 text-5xl md:text-6xl font-bold italic tracking-tighter'>{data.title}</h1>
								<div className='bg-brand mx-auto h-1 w-16 rounded-full opacity-60' />
								<p className='mt-6 text-secondary text-sm italic'>{data.description}</p>
							</>
						)}
					</motion.div>

					{isEditMode && !isPreviewMode ? (
						<div className='card p-1 shadow-2xl'>
							<textarea
								placeholder='使用 Markdown 编写内容...'
								className='min-h-[500px] w-full resize-none p-6 text-sm font-mono outline-none bg-transparent'
								value={data.content}
								onChange={e => setData({ ...data, content: e.target.value })}
							/>
						</div>
					) : (
						<div className='grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr'>
							
							{/* 格子 1: Markdown 内容 */}
							<motion.div 
								initial={{ opacity: 0, x: -20 }} 
								animate={{ opacity: 1, x: 0 }} 
								className='md:col-span-2 card p-8 md:p-12 relative overflow-hidden flex flex-col'
							>
								<div className='absolute -top-4 -right-4 p-4 opacity-[0.03] font-averia text-9xl italic pointer-events-none'>Vision</div>
								<div className='prose prose-sm max-w-none relative z-10 flex-1'>
									{loading ? '渲染中...' : content}
								</div>
							</motion.div>

							{/* 格子 2: 站点状态 */}
							<motion.div 
								initial={{ opacity: 0, x: 20 }} 
								animate={{ opacity: 1, x: 0 }} 
								transition={{ delay: 0.1 }}
								className='bg-brand/5 border border-brand/10 squircle p-8 flex flex-col justify-between'
							>
								<div>
									<h3 className='text-brand text-[10px] font-bold uppercase tracking-[0.2em] mb-8'>Site Status</h3>
									<div className='space-y-6'>
										{[
											{ label: 'Platform', value: 'Github Static' },
											{ label: 'Framework', value: 'Next.js 15' },
											{ label: 'UI Engine', value: 'Motion + Tailwind' }
										].map(item => (
											<div key={item.label} className='flex justify-between items-end border-b border-brand/10 pb-2'>
												<span className='text-secondary text-[10px] uppercase opacity-60'>{item.label}</span>
												<span className='font-mono text-xs font-bold'>{item.value}</span>
											</div>
										))}
									</div>
								</div>
								<div className='mt-12 text-[10px] text-brand/40 font-mono italic'>
									Studio Version: 2026.1
								</div>
							</motion.div>

							{/* 格子 3: 技术栈 */}
							<motion.div 
								initial={{ opacity: 0, y: 20 }} 
								animate={{ opacity: 1, y: 0 }} 
								transition={{ delay: 0.2 }}
								className='md:col-span-3 card p-8 group'
							>
								<div className='flex items-center justify-between mb-6'>
									<h3 className='font-averia text-xl italic opacity-70 group-hover:text-brand transition-colors'>Tech Integrated</h3>
									<div className='h-px flex-1 bg-border mx-6 opacity-20' />
								</div>
								<div className='flex flex-wrap gap-3'>
									{['Next.js', 'React', 'TypeScript', 'Tailwind', 'Motion', 'Github API', 'Vercel', 'Sonner'].map(tech => (
										<span key={tech} className='px-4 py-2 bg-secondary/5 border rounded-full text-[11px] font-mono hover:border-brand/40 hover:text-brand transition-all cursor-default'>
											{tech}
										</span>
									))}
								</div>
							</motion.div>
						</div>
					)}

					{/* 底部互动 */}
					<div className='mt-16 flex items-center justify-center gap-8'>
						<motion.a
							href='https://github.com/YYsuni/2025-blog-public'
							target='_blank'
							rel='noreferrer'
							whileHover={{ scale: 1.1, rotate: 5 }}
							className='bg-card flex h-[58px] w-[58px] items-center justify-center rounded-full border shadow-sm transition-shadow hover:shadow-lg'>
							<GithubSVG />
						</motion.a>
						<LikeButton slug='about-studio' delay={0.1} />
					</div>
				</div>
			</div>

			{/* 管理悬浮面板 */}
			<AnimatePresence>
				<motion.div 
					initial={{ opacity: 0, y: 20 }} 
					animate={{ opacity: 1, y: 0 }} 
					exit={{ opacity: 0, y: 20 }}
					className='fixed bottom-8 right-8 z-50 flex gap-3 max-sm:bottom-4 max-sm:right-4'
				>
					{isEditMode ? (
						<div className='flex gap-2 p-2 bg-white/80 backdrop-blur-xl border rounded-2xl shadow-2xl'>
							<button onClick={handleCancel} disabled={isSaving} className='px-4 py-2 text-xs font-medium hover:bg-black/5 rounded-xl transition-colors'>
								取消
							</button>
							<button onClick={() => setIsPreviewMode(!isPreviewMode)} disabled={isSaving} className='px-4 py-2 text-xs font-medium hover:bg-black/5 rounded-xl transition-colors border-x'>
								{isPreviewMode ? '编辑' : '预览'}
							</button>
							<button onClick={handleSaveClick} disabled={isSaving} className='brand-btn px-6 py-2 text-xs shadow-lg shadow-brand/20'>
								{isSaving ? '同步中...' : buttonText}
							</button>
						</div>
					) : (
						!hideEditButton && (
							<button onClick={handleEnterEditMode} className='card px-6 py-3 text-xs font-bold tracking-widest uppercase backdrop-blur-md hover:border-brand/50 transition-all shadow-xl'>
								Enter Admin
							</button>
						)
					)}
				</motion.div>
			</AnimatePresence>
		</>
	)
}
