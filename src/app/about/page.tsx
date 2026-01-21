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
import clsx from 'clsx'

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
			toast.success('保存成功！')
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

	const buttonText = isAuth ? '保存' : '导入密钥'

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
					{/* 页面标题区 */}
					<motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className='mb-16 text-center'
                    >
						<h1 className='font-averia mb-4 text-5xl md:text-6xl font-bold italic tracking-tighter'>
                            {isEditMode ? 'Editing About' : data.title}
                        </h1>
						<div className='bg-brand mx-auto h-1.5 w-16 rounded-full opacity-60' />
					</motion.div>

					{isEditMode && !isPreviewMode ? (
						<div className='space-y-6'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<input
									type='text'
									placeholder='页面大标题'
									className='card px-4 py-3 text-lg font-bold outline-none focus:border-brand'
									value={data.title}
									onChange={e => setData({ ...data, title: e.target.value })}
								/>
								<input
									type='text'
									placeholder='简短描述'
									className='card px-4 py-3 text-lg outline-none focus:border-brand'
									value={data.description}
									onChange={e => setData({ ...data, description: e.target.value })}
								/>
							</div>
							<div className='card p-1'>
								<textarea
									placeholder='使用 Markdown 编写你的故事...'
									className='min-h-[500px] w-full resize-none p-4 text-sm font-mono outline-none'
									value={data.content}
									onChange={e => setData({ ...data, content: e.target.value })}
								/>
							</div>
						</div>
					) : (
						<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
							{/* 格子 1: 核心内容预览 */}
							<motion.div 
                                initial={{ opacity: 0, scale: 0.95 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                transition={{ delay: 0.1 }}
                                className='md:col-span-2 card p-8 md:p-12 relative overflow-hidden'
                            >
                                <div className='absolute top-0 right-0 p-4 opacity-5 font-averia text-6xl italic pointer-events-none'>Vision</div>
								<div className='prose prose-sm max-w-none relative z-10'>
                                    {loading ? '渲染中...' : content}
                                </div>
							</motion.div>

							{/* 格子 2: 站点状态 (静态展示) */}
							<motion.div 
                                initial={{ opacity: 0, scale: 0.95 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                transition={{ delay: 0.2 }}
                                className='bg-brand/5 border border-brand/10 squircle p-8 flex flex-col justify-between min-h-[300px]'
                            >
                                <h3 className='text-brand text-xs font-bold uppercase tracking-widest'>Site Status</h3>
                                <div className='space-y-4 my-8'>
                                    <div className='flex justify-between items-end border-b border-brand/10 pb-2'>
                                        <span className='text-secondary text-xs'>Platform</span>
                                        <span className='font-mono text-sm font-bold'>Github Static</span>
                                    </div>
                                    <div className='flex justify-between items-end border-b border-brand/10 pb-2'>
                                        <span className='text-secondary text-xs'>Framework</span>
                                        <span className='font-mono text-sm font-bold'>Next.js 15</span>
                                    </div>
                                    <div className='flex justify-between items-end border-b border-brand/10 pb-2'>
                                        <span className='text-secondary text-xs'>UI Engine</span>
                                        <span className='font-mono text-sm font-bold'>Motion + Tailwind</span>
                                    </div>
                                </div>
                                <p className='text-[10px] text-brand/60 leading-relaxed italic'>
                                    {data.description}
                                </p>
							</motion.div>

							{/* 格子 3: 技术栈标签 */}
							<motion.div 
                                initial={{ opacity: 0, y: 20 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                transition={{ delay: 0.3 }}
                                className='md:col-span-3 card p-8'
                            >
                                <h3 className='font-averia text-xl mb-6 italic opacity-70'>Tech Integrated</h3>
                                <div className='flex flex-wrap gap-3'>
                                    {['Next.js', 'React', 'TypeScript', 'Tailwind', 'Motion', 'Github API', 'Vercel'].map(tech => (
                                        <span key={tech} className='px-4 py-2 bg-secondary/5 border rounded-full text-xs font-mono hover:border-brand/50 transition-colors cursor-default'>
                                            {tech}
                                        </span>
                                    ))}
                                </div>
							</motion.div>
						</div>
					)}

					<div className='mt-12 flex items-center justify-center gap-6'>
						<motion.a
							href='https://github.com/YYsuni/2025-blog-public'
							target='_blank'
							rel='noreferrer'
							whileHover={{ scale: 1.1, rotate: 5 }}
							className='bg-card flex h-[53px] w-[53px] items-center justify-center rounded-full border shadow-sm'>
							<GithubSVG />
						</motion.a>
						<LikeButton slug='open-source' delay={0.1} />
					</div>
				</div>
			</div>

            {/* 编辑悬浮面板 */}
			<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className='fixed top-4 right-6 z-50 flex gap-3 max-sm:hidden'>
				{isEditMode ? (
					<>
						<button onClick={handleCancel} disabled={isSaving} className='rounded-xl border bg-white/80 backdrop-blur px-6 py-2 text-sm'>
							取消
						</button>
						<button onClick={() => setIsPreviewMode(!isPreviewMode)} disabled={isSaving} className='rounded-xl border bg-white/80 backdrop-blur px-6 py-2 text-sm'>
							{isPreviewMode ? '编辑' : '预览'}
						</button>
						<button onClick={handleSaveClick} disabled={isSaving} className='brand-btn px-6 shadow-lg shadow-brand/20'>
							{isSaving ? '正在提交...' : buttonText}
						</button>
					</>
				) : (
					!hideEditButton && (
						<button onClick={handleEnterEditMode} className='card px-6 py-2 text-sm backdrop-blur-md hover:bg-white/90 transition-all active:scale-95'>
							进入管理模式
						</button>
					)
				)}
			</motion.div>
		</>
	)
}
