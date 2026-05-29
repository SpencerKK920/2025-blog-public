'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import GridView from './grid-view'
import BloggersGridView from '../bloggers/grid-view'
import type { Blogger } from '../bloggers/grid-view'
import CreateDialog from './components/create-dialog'
import BloggersCreateDialog from '../bloggers/components/create-dialog'
import { pushShares } from './services/push-shares'
import { pushBloggers } from '../bloggers/services/push-bloggers'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import initialShares from './list.json'
import initialBloggers from '../bloggers/list.json'
import type { Share } from './components/share-card'
import type { LogoItem } from './components/logo-upload-dialog'
import type { AvatarItem } from '../bloggers/components/avatar-upload-dialog'
import { cn } from '@/lib/utils'

type Tab = 'share' | 'bloggers'

function ShareContent() {
	const searchParams = useSearchParams()
	const router = useRouter()
	const initialTab: Tab = searchParams.get('tab') === 'bloggers' ? 'bloggers' : 'share'
	const [activeTab, setActiveTab] = useState<Tab>(initialTab)

	const [shares, setShares] = useState<Share[]>(initialShares as Share[])
	const [originalShares, setOriginalShares] = useState<Share[]>(initialShares as Share[])
	const [bloggers, setBloggers] = useState<Blogger[]>(initialBloggers as Blogger[])
	const [originalBloggers, setOriginalBloggers] = useState<Blogger[]>(initialBloggers as Blogger[])
	const [isEditMode, setIsEditMode] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [logoItems, setLogoItems] = useState<Map<string, LogoItem>>(new Map())
	const [avatarItems, setAvatarItems] = useState<Map<string, AvatarItem>>(new Map())

	// Create dialog state
	const [createShareOpen, setCreateShareOpen] = useState(false)
	const [createBloggerOpen, setCreateBloggerOpen] = useState(false)

	const keyInputRef = useRef<HTMLInputElement>(null)
	const { isAuth, setPrivateKey } = useAuthStore()
	const { siteContent } = useConfigStore()
	const hideEditButton = siteContent.hideEditButton ?? false

	// --- Share handlers ---
	const handleShareUpdate = (updated: Share, old: Share, logoItem?: LogoItem) => {
		setShares(prev => prev.map(s => (s.url === old.url ? updated : s)))
		if (logoItem) {
			setLogoItems(prev => { const m = new Map(prev); m.set(updated.url, logoItem); return m })
		}
	}
	const handleShareDelete = (share: Share) => {
		if (confirm(`确定要删除 ${share.name} 吗？`)) setShares(shares.filter(s => s.url !== share.url))
	}
	const handleShareSave = (s: Share) => {
		setShares([...shares, s])
	}

	// --- Blogger handlers ---
	const handleBloggerUpdate = (updated: Blogger, old: Blogger, avatarItem?: AvatarItem) => {
		setBloggers(prev => prev.map(b => (b.url === old.url ? updated : b)))
		if (avatarItem) {
			setAvatarItems(prev => { const m = new Map(prev); m.set(updated.url, avatarItem); return m })
		}
	}
	const handleBloggerDelete = (blogger: Blogger) => {
		if (confirm(`确定要删除 ${blogger.name} 吗？`)) setBloggers(bloggers.filter(b => b.url !== blogger.url))
	}
	const handleBloggerSave = (b: Blogger) => {
		setBloggers([...bloggers, b])
	}

	// --- Edit mode ---
	const handleSave = async () => {
		setIsSaving(true)
		try {
			if (shares !== originalShares || logoItems.size > 0) {
				await pushShares({ shares, logoItems })
			}
			if (bloggers !== originalBloggers || avatarItems.size > 0) {
				await pushBloggers({ bloggers, avatarItems })
			}
			setOriginalShares(shares)
			setOriginalBloggers(bloggers)
			setLogoItems(new Map())
			setAvatarItems(new Map())
			setIsEditMode(false)
			toast.success('保存成功！')
		} catch (error: any) {
			console.error('Failed to save:', error)
			toast.error(`保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	const handleCancel = () => {
		setShares(originalShares)
		setBloggers(originalBloggers)
		setLogoItems(new Map())
		setAvatarItems(new Map())
		setIsEditMode(false)
	}

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
		if (!isAuth) keyInputRef.current?.click()
		else handleSave()
	}

	const handleAdd = () => {
		if (activeTab === 'share') setCreateShareOpen(true)
		else setCreateBloggerOpen(true)
	}

	const handleTabChange = (tab: Tab) => {
		setActiveTab(tab)
		router.replace(`/share${tab === 'bloggers' ? '?tab=bloggers' : ''}`, { scroll: false })
	}

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

	const buttonText = isAuth ? '保存' : '导入密钥'

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

			{/* Tab bar */}
			<div className='mx-auto w-full max-w-7xl px-6 pt-24 pb-0'>
				<div className='mb-8 flex justify-center gap-2'>
					{([
						['share', '推荐分享'],
						['bloggers', '优秀博客']
					] as const).map(([key, label]) => (
						<button
							key={key}
							onClick={() => handleTabChange(key)}
							className={cn(
								'rounded-full px-6 py-2 text-sm font-medium transition-colors',
								activeTab === key ? 'bg-brand text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
							)}>
							{label}
						</button>
					))}
				</div>
			</div>

			{/* Grid */}
			{activeTab === 'share' ? (
				<GridView shares={shares} isEditMode={isEditMode} onUpdate={handleShareUpdate} onDelete={handleShareDelete} />
			) : (
				<BloggersGridView bloggers={bloggers} isEditMode={isEditMode} onUpdate={handleBloggerUpdate} onDelete={handleBloggerDelete} />
			)}

			{/* Edit controls */}
			<motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} className='absolute top-4 right-6 flex gap-3 max-sm:hidden'>
				{isEditMode ? (
					<>
						<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleCancel} disabled={isSaving} className='rounded-xl border bg-white/60 px-6 py-2 text-sm'>
							取消
						</motion.button>
						<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleAdd} className='rounded-xl border bg-white/60 px-6 py-2 text-sm'>
							添加
						</motion.button>
						<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSaveClick} disabled={isSaving} className='brand-btn px-6'>
							{isSaving ? '保存中...' : buttonText}
						</motion.button>
					</>
				) : (
					!hideEditButton && (
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={() => setIsEditMode(true)}
							className='bg-card rounded-xl border px-6 py-2 text-sm backdrop-blur-sm transition-colors hover:bg-white/80'>
							编辑
						</motion.button>
					)
				)}
			</motion.div>

			{/* Create dialogs */}
			{createShareOpen && <CreateDialog share={null} onClose={() => setCreateShareOpen(false)} onSave={handleShareSave} />}
			{createBloggerOpen && <BloggersCreateDialog blogger={null} onClose={() => setCreateBloggerOpen(false)} onSave={handleBloggerSave} />}
		</>
	)
}

export default function Page() {
	return (
		<Suspense fallback={<div className='flex min-h-screen items-center justify-center'><div className='h-8 w-8 animate-spin rounded-full border-2 border-brand/30 border-t-brand' /></div>}>
			<ShareContent />
		</Suspense>
	)
}
