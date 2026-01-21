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
import initialData from './list.json'

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

							{/* 左侧区域（关键修复：overflow-hidden） */}
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
										]).ma
