'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

export default function AnimePage() {
    const [list, setList] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/bilibili').then(res => res.json()).then(data => {
            setList(data)
            setLoading(false)
        })
    }, [])

    return (
        <div className='flex flex-col items-center px-6 pt-32 pb-12'>
            {/* 页面头部：参考 RyuChan 的 Heading 样式 */}
            <div className='mb-12 text-center'>
                <h1 className='font-averia text-4xl font-bold tracking-tight'>ANIME</h1>
                <div className='bg-brand mt-2 h-1 w-12 mx-auto rounded-full' />
                <p className='text-secondary mt-4 text-xs italic'>
                    共追番 <span className='text-brand font-bold'>{list.length}</span> 部作品
                </p>
            </div>

            {loading ? (
                <div className='text-brand animate-pulse'>正在同步 Bilibili 追番...</div>
            ) : (
                <div className='grid w-full max-w-[1200px] grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
                    {list.map((anime, index) => (
                        <motion.a
                            key={anime.id}
                            href={anime.link}
                            target="_blank"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className='bg-card squircle group relative flex flex-col overflow-hidden border shadow-sm transition-all hover:shadow-xl'
                        >
                            {/* 封面：参考 RyuChan 的悬停遮罩设计 */}
                            <div className='relative aspect-[3/4.2] overflow-hidden'>
                                <img src={anime.cover} alt={anime.title} className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-110' />
                                
                                {/* 评分角标 */}
                                {anime.rating > 0 && (
                                    <div className='absolute top-2 right-2 rounded-md bg-black/60 px-2 py-1 text-[10px] text-yellow-400 backdrop-blur-md font-bold'>
                                        ★ {anime.rating}
                                    </div>
                                )}

                                {/* 悬停时显示的简介遮罩 */}
                                <div className='absolute inset-0 bg-black/80 p-4 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100'>
                                    <p className='text-white text-[10px] leading-relaxed line-clamp-6'>
                                        {anime.evaluate}
                                    </p>
                                </div>
                            </div>

                            {/* 信息区域 */}
                            <div className='p-3'>
                                <h3 className='truncate text-xs font-bold text-primary group-hover:text-brand transition-colors'>{anime.title}</h3>
                                <div className='mt-2 flex items-center text-[10px] text-secondary'>
                                    <span className='flex items-center gap-1'>
                                        <span className='h-1.5 w-1.5 rounded-full bg-brand animate-pulse' />
                                        {anime.progress}
                                    </span>
                                </div>
                            </div>
                        </motion.a>
                    ))}
                </div>
            )}
        </div>
    )
}
