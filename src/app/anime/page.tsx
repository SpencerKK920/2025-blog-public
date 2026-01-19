'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import animeList from './list.json'

const CATEGORIES = ['全部', '在看', '已完结', '想看', '弃番']

export default function AnimePage() {
	const [activeTab, setActiveTab] = useState('全部')

	const filteredList = animeList.filter(item => 
		activeTab === '全部' || item.status === activeTab
	)

	return (
		<div className='flex flex-col items-center justify-center px-6 pt-32 pb-12'>
			{/* 标题部分 - 参考 RyuChan 的 Heading 风格 */}
			<div className='mb-10 text-center'>
				<h1 className='font-averia text-4xl font-bold tracking-tighter text-primary'>ANIME</h1>
				<div className='bg-brand mt-2 h-1 w-12 mx-auto rounded-full' />
			</div>

			{/* 分类切换器 - 参考 RyuChan 的 Tab 逻辑 */}
			<div className='mb-10 flex flex-wrap justify-center gap-3'>
				{CATEGORIES.map(tab => (
					<button
						key={tab}
						onClick={() => setActiveTab(tab)}
						className={`rounded-full px-6 py-1.5 text-xs font-medium transition-all ${
							activeTab === tab 
							? 'bg-brand text-white shadow-md' 
							: 'bg-card text-secondary hover:bg-brand/10 border'
						}`}
					>
						{tab}
					</button>
				))}
			</div>

			{/* 番剧网格 - 参考 RyuChan 的 Grid 布局 */}
			<div className='grid w-full max-w-[1200px] grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
				<AnimatePresence mode='popLayout'>
					{filteredList.map((anime, index) => (
						<motion.div
							key={anime.title}
							layout
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.9 }}
							transition={{ duration: 0.3 }}
							whileHover={{ y: -8 }}
							className='bg-card squircle group relative flex flex-col overflow-hidden border p-0 shadow-sm transition-all hover:shadow-xl'
						>
							{/* 海报图 */}
							<div className='relative aspect-[3/4.2] w-full overflow-hidden'>
								<img
									src={anime.image}
									alt={anime.title}
									className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-110'
								/>
								{/* 状态标签 */}
								<div className='absolute top-2 left-2 rounded-md bg-black/60 px-2 py-1 text-[10px] text-white backdrop-blur-md'>
									{anime.label}
								</div>
							</div>

							{/* 内容信息 */}
							<div className='flex flex-col p-4'>
								<h3 className='truncate text-sm font-bold text-primary'>{anime.title}</h3>
								<div className='mt-2 flex items-center justify-between'>
									<span className='text-[10px] text-secondary'>{anime.status}</span>
									<div className='flex gap-0.5 text-brand'>
										{[...Array(5)].map((_, i) => (
											<span key={i} className='text-[10px]'>{i < anime.rating ? '★' : '☆'}</span>
										))}
									</div>
								</div>
							</div>
						</motion.div>
					))}
				</AnimatePresence>
			</div>
		</div>
	)
}
