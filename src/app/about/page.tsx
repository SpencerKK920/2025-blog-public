'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import Image from 'next/image' // 新增: 用于显示头像
import { useMarkdownRender } from '@/hooks/use-markdown-render'
import { pushAbout, type AboutData } from './services/push-about'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import LikeButton from '@/components/like-button'

// 引入图标 (根据您 src/svgs 目录下的文件)
import GithubSVG from '@/svgs/github.svg'
import BilibiliSVG from '@/svgs/bilibili-outline.svg' // 假设您想展示B站
import EmailSVG from '@/svgs/email.svg'
// import TwitterSVG from '@/svgs/x.svg' // 如果需要可以解开注释

import initialData from './list.json'

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

    // ... (保留原有的 handleChoosePrivateKey, handleSaveClick, handleEnterEditMode, handleSave, handleCancel 等函数不变) ...
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
                setIsPreviewMode(false)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [isEditMode])

    // 定义社交链接样式
    const socialLinkClass = "bg-card text-secondary hover:text-primary hover:scale-110 transition-all flex h-[45px] w-[45px] items-center justify-center rounded-full border shadow-sm"

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

            <div className='flex flex-col items-center justify-center px-6 pt-32 pb-12 max-sm:px-4'>
                <div className='w-full max-w-[800px]'>
                    {isEditMode ? (
                        // 编辑模式 (保持原有逻辑，稍作样式优化)
                        isPreviewMode ? (
                            <div className='space-y-6'>
                                <div className='text-center border-b pb-6'>
                                    <h1 className='mb-4 text-4xl font-bold'>{data.title || '标题预览'}</h1>
                                    <p className='text-secondary text-lg'>{data.description || '描述预览'}</p>
                                </div>
                                {loading ? (
                                    <div className='text-secondary text-center'>预览渲染中...</div>
                                ) : (
                                    <div className='card relative p-8'>
                                        <div className='prose prose-zinc dark:prose-invert max-w-none'>{content}</div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className='space-y-6'>
                                <div className='space-y-4'>
                                    <input
                                        type='text'
                                        placeholder='标题'
                                        className='w-full bg-transparent px-4 py-3 text-center text-3xl font-bold focus:outline-none'
                                        value={data.title}
                                        onChange={e => setData({ ...data, title: e.target.value })}
                                    />
                                    <input
                                        type='text'
                                        placeholder='描述'
                                        className='w-full bg-transparent px-4 py-2 text-center text-lg text-secondary focus:outline-none'
                                        value={data.description}
                                        onChange={e => setData({ ...data, description: e.target.value })}
                                    />
                                </div>

                                <div className='card relative overflow-hidden'>
                                    <textarea
                                        placeholder='Markdown 内容...'
                                        className='min-h-[500px] w-full resize-none bg-transparent p-6 text-sm focus:outline-none font-mono leading-relaxed'
                                        value={data.content}
                                        onChange={e => setData({ ...data, content: e.target.value })}
                                    />
                                </div>
                            </div>
                        )
                    ) : (
                        // 展示模式：新增个人资料卡片区域
                        <>
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                className='mb-12 flex flex-col items-center text-center'
                            >
                                {/* 头像区域 */}
                                <div className="relative mb-6 h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-lg dark:border-zinc-800">
                                    <Image 
                                        src="/images/avatar.png" // 确保 public/images/avatar.png 存在
                                        alt="Avatar"
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                </div>
                                
                                <h1 className='mb-3 text-4xl font-bold tracking-tight'>{data.title}</h1>
                                <p className='text-secondary max-w-2xl text-lg'>{data.description}</p>

                                {/* 社交链接栏 */}
                                <div className='mt-6 flex gap-4'>
                                    <a href='https://github.com/spencerkk920' target='_blank' rel='noreferrer' className={socialLinkClass} title="Github">
                                        <GithubSVG className="w-5 h-5" />
                                    </a>
                                    <a href='mailto:your-email@example.com' className={socialLinkClass} title="Email">
                                        <EmailSVG className="w-5 h-5" />
                                    </a>
                                    <a href='https://space.bilibili.com/your-id' target='_blank' rel='noreferrer' className={socialLinkClass} title="Bilibili">
                                        <BilibiliSVG className="w-5 h-5" />
                                    </a>
                                    {/* 可以在这里添加更多图标 */}
                                </div>
                            </motion.div>

                            {loading ? (
                                <div className='text-secondary text-center py-12'>加载内容中...</div>
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    transition={{ delay: 0.1 }}
                                    className='card relative p-8 md:p-10'
                                >
                                    <div className='prose prose-zinc dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-a:text-blue-500 hover:prose-a:text-blue-600 prose-img:rounded-xl'>
                                        {content}
                                    </div>
                                </motion.div>
                            )}

                            <div className='mt-12 flex justify-center'>
                                <LikeButton slug='about-page' delay={0.2} />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* 悬浮按钮区域 (保持不变) */}
            <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} className='fixed top-4 right-6 z-10 flex gap-3 max-sm:hidden'>
                {isEditMode ? (
                    <>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCancel}
                            disabled={isSaving}
                            className='rounded-xl border bg-white/60 px-6 py-2 text-sm backdrop-blur-sm shadow-sm hover:bg-white/80 dark:bg-zinc-800/60 dark:hover:bg-zinc-800/80'>
                            取消
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsPreviewMode(prev => !prev)}
                            disabled={isSaving}
                            className={`rounded-xl border bg-white/60 px-6 py-2 text-sm backdrop-blur-sm shadow-sm hover:bg-white/80 dark:bg-zinc-800/60 dark:hover:bg-zinc-800/80`}>
                            {isPreviewMode ? '继续编辑' : '预览'}
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSaveClick} disabled={isSaving} className='brand-btn px-6 shadow-md'>
                            {isSaving ? '保存中...' : buttonText}
                        </motion.button>
                    </>
                ) : (
                    !hideEditButton && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleEnterEditMode}
                            className='rounded-xl border bg-white/60 px-6 py-2 text-sm backdrop-blur-sm transition-colors hover:bg-white/80 shadow-sm dark:bg-zinc-800/60 dark:hover:bg-zinc-800/80'>
                            编辑
                        </motion.button>
                    )
                )}
            </motion.div>
        </>
    )
}
