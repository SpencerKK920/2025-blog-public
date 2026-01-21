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

export default function AboutPage() {
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
			toast.success('配置已成功同步至 Github')
		} catch (error: any) {
			console.error('Save failed:', error)
			toast.error(`同步失败: ${error?.message || '网络或密钥错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	const handleCancel = () => {
		setData(originalData)
		setIsEditMode(false)
		setIsPreviewMode(false)
	}

	const buttonText = isAuth ? '发布更新' : '验证私钥'

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
		<div className='min-h-screen bg-[#fafafa] dark:bg-[#050505]'>
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

			<div className='mx-auto flex w-full max-w-[800px] flex-col px-6 pt-32 pb-24'>
				{/* 1. 头部标题区 */}
				<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className='mb-20'>
					{isEditMode && !isPreviewMode ? (
						<div className='space-y-4'>
							<input
								className='w-full bg-transparent font-averia text-5xl font-bold italic outline-none border-b-2 border-brand/20 pb-2'
								value={data.title}
								onChange={e => setData({ ...data, title: e.target.value })}
							/>
							<input
								className='w-full bg-transparent text-xl text-secondary outline-none'
								value={data.description}
								onChange={e => setData({ ...data, description: e.target.value })}
							/>
						</div>
					) : (
						<div className='text-left'>
							<h1 className='font-averia text-6xl md:text-8xl font-bold italic tracking-tighter text-black dark:text-white leading-none'>
								{data.title}
							</h1>
							<p className='mt-8 text-xl md:text-2xl text-secondary/50 font-serif italic leading-relaxed'>
								{data.description}
							</p>
						</div>
					)}
				</motion.div>

				{/* 2. 内容堆叠区 */}
				<div className='flex flex-col gap-12'>
					{isEditMode && !isPreviewMode ? (
						<div className='card p-2 shadow-2xl bg-white dark:bg-zinc-900'>
							<textarea
								className='min-h-[500px] w-full resize-none bg-transparent p-6 font-mono text-sm leading-relaxed outline-none'
								value={data.content}
								onChange={e => setData({ ...data, content: e.target.value })}
								placeholder='支持 Markdown 语法...'
							/>
						</div>
					) : (
						<>
							{/* 核心故事/愿景区 */}
							<motion.section 
								initial={{ opacity: 0 }} 
								animate={{ opacity: 1 }} 
								className='card p-10 md:p-14 bg-white dark:bg-zinc-900 border-none shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)]'
							>
								<div className='prose prose-neutral dark:prose-invert max-w-none prose-p:leading-loose prose-p:text-lg'>
									{loading ? <div className='h-32 animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-2xl' /> : content}
								</div>
							</motion.section>

							{/* 站点与技术参数（双列） */}
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								{/* 状态卡片 */}
								<div className='bg-brand text-white squircle p-8 flex flex-col justify-between min-h-[240px]'>
									<span className='text-[10px] font-bold uppercase tracking-[0.4em] opacity-60'>Studio Intel</span>
									<div className='space-y-4 my-6'>
										{/* 在这里修改你的站点参数 */}
										{[
											{ k: 'Version', v: '2.0.1-stable' },
											{ k: 'Engine', v: 'Next.js 15 (App)' },
											{ k: 'Uptime', v: '99.9%' }
										].map(i => (
											<div key={i.k} className='flex justify-between items-end border-b border-white/10 pb-2'>
												<span className='text-[10px] opacity-50 uppercase'>{i.k}</span>
												<span className='font-mono text-xs font-bold'>{i.v}</span>
											</div>
										))}
									</div>
								</div>

								{/* 技术栈卡片 */}
								<div className='card p-8 bg-white dark:bg-zinc-900'>
									<h3 className='font-averia italic text-xl mb-6'>Toolbox</h3>
									<div className='flex flex-wrap gap-2'>
										{/* 在这里修改你的技术标签 */}
										{['TypeScript', 'Tailwind', 'Motion', 'Redis', 'Nginx', 'Docker'].map(t => (
											<span key={t} className='px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-[11px] font-mono border border-zinc-100 dark:border-zinc-800'>
												{t}
											</span>
										))}
									</div>
								</div>
							</div>
						</>
					)}
				</div>

				{/* 3. 底部互动 */}
				<div className='mt-24 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-900 pt-12'>
					<motion.a 
						whileHover={{ scale: 1.1 }} 
						href='https://github.com/YYsuni' 
						target='_blank' 
						className='p-4 bg-zinc-100 dark:bg-zinc-900 rounded-full'
					>
						<GithubSVG className='w-6 h-6' />
					</motion.a>
					<LikeButton slug='about-final' />
				</div>
			</div>

			{/* 控制浮动面板 */}
			<AnimatePresence>
				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='fixed bottom-10 right-10 z-50 flex items-center gap-2'>
					{isEditMode ? (
						<div className='flex p-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border rounded-2xl shadow-2xl'>
							<button onClick={handleCancel} className='px-4 py-2 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors'>取消</button>
							<button onClick={() => setIsPreviewMode(!isPreviewMode)} className='px-4 py-2 text-xs font-medium border-x border-zinc-100 dark:border-zinc-800'>{isPreviewMode ? '编辑模式' : '实时预览'}</button>
							<button onClick={handleSaveClick} disabled={isSaving} className='brand-btn px-6 py-2 text-xs'>
								{isSaving ? '正在推送到仓库...' : buttonText}
							</button>
						</div>
					) : (
						!hideEditButton && (
							<button 
								onClick={handleEnterEditMode} 
								className='flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-2xl shadow-2xl hover:scale-105 transition-all active:scale-95'
							>
								<span className='text-xs font-bold tracking-widest uppercase'>Edit Page</span>
							</button>
						)
					)}
				</motion.div>
			</AnimatePresence>
		</div>
	)
}
