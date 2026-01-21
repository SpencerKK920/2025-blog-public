'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { useMarkdownRender } from '@/hooks/use-markdown-render'
import { pushAbout, type AboutData } from './services/push-about'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import LikeButton from '@/components/like-button'
import { User, Cpu, History, Edit3, Eye, Save, X } from 'lucide-react' // 使用 lucide 图标

import GithubSVG from '@/svgs/github.svg'
import initialData from './list.json'

// 简单的卡片组件包装器
const CardBox = ({ title, icon: Icon, children, className = '' }: { title?: string; icon?: any; children: React.ReactNode; className?: string }) => (
	<div className={`card relative p-6 flex flex-col ${className}`}>
		{(title || Icon) && (
			<div className="flex items-center gap-2 mb-4 border-b pb-2 border-border/50">
				{Icon && <Icon className="w-5 h-5 text-primary" />}
				{title && <h3 className="font-bold text-lg">{title}</h3>}
			</div>
		)}
		<div className="flex-1 overflow-auto">{children}</div>
	</div>
)

export default function Page() {
	// 确保 initialData 包含所有字段，避免 undefined 报错
	const safeInitialData = {
		title: '',
		description: '',
		content: '',
		techStack: '',
		changelog: '',
		...initialData
	} as AboutData

	const [data, setData] = useState<AboutData>(safeInitialData)
	const [originalData, setOriginalData] = useState<AboutData>(safeInitialData)
	const [isEditMode, setIsEditMode] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [isPreviewMode, setIsPreviewMode] = useState(false)
	const keyInputRef = useRef<HTMLInputElement>(null)

	const { isAuth, setPrivateKey } = useAuthStore()
	const { siteContent } = useConfigStore()
	const hideEditButton = siteContent.hideEditButton ?? false

	// 分别渲染三个部分的 Markdown
	const { content: introContent } = useMarkdownRender(data.content)
	const { content: techContent } = useMarkdownRender(data.techStack)
	const { content: logContent } = useMarkdownRender(data.changelog)

	const handleChoosePrivateKey = async (file: File) => {
		try {
			const text = await file.text()
			setPrivateKey(text)
			toast.success('密钥读取成功')
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

	const buttonText = isAuth ? '保存更新' : '导入密钥'

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isEditMode && (e.ctrlKey || e.metaKey) && e.key === ',') {
				e.preventDefault()
				setIsEditMode(true)
				setIsPreviewMode(false)
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [isEditMode])

	// 通用的编辑框样式
	const textareaClass = "w-full h-full resize-none bg-transparent p-2 text-sm focus:outline-none font-mono leading-relaxed min-h-[150px]"

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

			<div className='flex flex-col items-center justify-center px-4 pt-24 pb-12 w-full'>
				<div className='w-full max-w-[1200px] space-y-8'>
					
					{/* 顶部标题区域 (仅在预览/查看模式显示大标题，编辑模式显示输入框) */}
					{isEditMode && !isPreviewMode ? (
						<div className="space-y-4 max-w-2xl mx-auto">
							<input
								type='text'
								placeholder='页面标题'
								className='w-full text-center text-3xl font-bold bg-transparent border-b border-border/50 pb-2 focus:outline-none focus:border-primary'
								value={data.title}
								onChange={e => setData({ ...data, title: e.target.value })}
							/>
							<input
								type='text'
								placeholder='页面简短描述'
								className='w-full text-center text-lg text-secondary bg-transparent focus:outline-none'
								value={data.description}
								onChange={e => setData({ ...data, description: e.target.value })}
							/>
						</div>
					) : (
						<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className='text-center mb-8'>
							<h1 className='text-4xl font-bold mb-3'>{data.title}</h1>
							<p className='text-secondary text-lg'>{data.description}</p>
						</motion.div>
					)}

					{/* 核心布局区域：左二右一 */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:min-h-[600px]">
						
						{/* 左侧两列容器 */}
						<div className="lg:col-span-2 flex flex-col gap-6 h-full">
							
							{/* 左上：个人介绍 */}
							<motion.div 
								initial={{ opacity: 0, x: -20 }} 
								animate={{ opacity: 1, x: 0 }} 
								className="flex-1 min-h-[250px]"
							>
								<CardBox title="个人介绍" icon={User} className="h-full bg-card/50 backdrop-blur-sm">
									{isEditMode && !isPreviewMode ? (
										<textarea
											placeholder="支持 Markdown 的个人介绍..."
											className={textareaClass}
											value={data.content}
											onChange={e => setData({ ...data, content: e.target.value })}
										/>
									) : (
										<div className="prose prose-sm dark:prose-invert max-w-none">
											{introContent}
										</div>
									)}
								</CardBox>
							</motion.div>

							{/* 左下：技术栈 */}
							<motion.div 
								initial={{ opacity: 0, x: -20 }} 
								animate={{ opacity: 1, x: 0 }} 
								transition={{ delay: 0.1 }}
								className="flex-1 min-h-[250px]"
							>
								<CardBox title="技术栈" icon={Cpu} className="h-full bg-card/50 backdrop-blur-sm">
									{isEditMode && !isPreviewMode ? (
										<textarea
											placeholder="- ⚡ Next.js..."
											className={textareaClass}
											value={data.techStack}
											onChange={e => setData({ ...data, techStack: e.target.value })}
										/>
									) : (
										// 可以在这里给 li 加上特殊的样式，或者直接用 markdown
										<div className="prose prose-sm dark:prose-invert max-w-none prose-li:marker:text-primary">
											{techContent}
										</div>
									)}
								</CardBox>
							</motion.div>
						</div>

						{/* 右侧：更新日志 (长框) */}
						<motion.div 
							initial={{ opacity: 0, x: 20 }} 
							animate={{ opacity: 1, x: 0 }} 
							transition={{ delay: 0.2 }}
							className="lg:col-span-1 h-full min-h-
