'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

/**
 * 注意：在正式环境中，建议将 API Key 放在 Vercel 环境变量中
 * 并创建一个新的 API 路由（如 /api/trakt）来处理抓取，以防前端暴露 Key。
 */
const TRAKT_CLIENT_ID = '23a43b1011bc7e1490da9aa9ada0eea7b028135a65f668cac7885ac9b0ec0b65'
const TMDB_API_KEY = 'c06994e9e33158fdac8dfda5befad851'
const TRAKT_USERNAME = 'SpencerKK'

export default function AnimePage() {
    // 状态管理
    const [biliList, setBiliList] = useState<any[]>([])
    const [traktList, setTraktList] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // 1. 获取 Bilibili 数据 (原有逻辑)
        const fetchBili = fetch('/api/bilibili').then(res => res.json())

        // 2. 获取 Trakt 数据并补全 TMDB 海报 [cite: 2026-01-20]
        const fetchTrakt = async () => {
            const historyRes = await fetch(`https://api.trakt.tv/users/${TRAKT_USERNAME}/history`, {
                headers: {
                    'Content-Type': 'application/json',
                    'trakt-api-version': '2',
                    'trakt-api-key': TRAKT_CLIENT_ID
                }
            })
            const history = await historyRes.json()

            // 仅取前 10 条记录，并并行抓取海报 [cite: 2026-01-20]
            return Promise.all(history.slice(0, 10).map(async (item: any) => {
                const type = item.type === 'movie' ? 'movie' : 'tv'
                const tmdbId = item.type === 'movie' ? item.movie.ids.tmdb : item.show.ids.tmdb
                
                const tmdbRes = await fetch(`https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=zh-CN`)
                const tmdbData = await tmdbRes.json()

                return {
                    id: item.id,
                    title: item.movie?.title || item.show?.title,
                    cover: `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`,
                    rating: tmdbData.vote_average?.toFixed(1) || '0.0',
                    progress: item.type === 'movie' ? '电影' : `更新至 ${tmdbData.number_of_episodes} 集`,
                    evaluate: tmdbData.overview || '暂无内容介绍。',
                    link: item.type === 'movie' ? `https://trakt.tv/movies/${item.movie.ids.slug}` : `https://trakt.tv/shows/${item.show.ids.slug}`
                }
            }))
        }

        // 并行加载 [cite: 2026-01-20]
        Promise.all([fetchBili, fetchTrakt()])
            .then(([biliData, traktData]) => {
                if (Array.isArray(biliData)) setBiliList(biliData)
                if (Array.isArray(traktData)) setTraktList(traktData)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    // 渲染卡片函数：复用你原有的 UI 结构
    const renderCard = (item: any, index: number) => (
        <motion.a
            key={item.id}
            href={item.link}
            target="_blank"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className='bg-card squircle group relative flex flex-col overflow-hidden border shadow-sm transition-all hover:shadow-xl'
        >
            <div className='relative aspect-[3/4.2] overflow-hidden bg-zinc-100'>
                <img 
                    src={item.cover} 
                    alt={item.title} 
                    loading="lazy"
                    className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-110' 
                />
                
                {item.rating > 0 && (
                    <div className='absolute top-2 right-2 rounded-md bg-black/60 px-2 py-1 text-[10px] text-yellow-400 backdrop-blur-md font-bold z-10'>
                        ★ {item.rating}
                    </div>
                )}

                <div className='absolute inset-0 bg-black/80 p-4 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100'>
                    <p className='text-white text-[10px] leading-relaxed line-clamp-6'>
                        {item.evaluate}
                    </p>
                </div>
            </div>

            <div className='p-3'>
                <h3 className='truncate text-xs font-bold text-primary group-hover:text-brand transition-colors'>{item.title}</h3>
                <div className='mt-2 flex items-center text-[10px] text-secondary'>
                    <span className='flex items-center gap-1'>
                        <span className='h-1.5 w-1.5 rounded-full bg-brand animate-pulse' />
                        {item.progress}
                    </span>
                </div>
            </div>
        </motion.a>
    )

    return (
        <>
            <meta name="referrer" content="no-referrer" />
            
            <div className='flex flex-col items-center px-6 pt-32 pb-12'>
                {/* 统一头部 */}
                <div className='mb-12 text-center'>
                    <h1 className='font-averia text-4xl font-bold tracking-tight uppercase'>Tracking</h1>
                    <div className='bg-brand mt-2 h-1 w-12 mx-auto rounded-full' />
                </div>

                {loading ? (
                    <div className='text-brand animate-pulse'>正在同步云端影视数据...</div>
                ) : (
                    <div className="w-full max-w-[1200px] space-y-16">
                        
                        {/* 1. Bilibili 追番部分 */}
                        <section>
                            <div className="flex items-center gap-3 mb-8">
                                <h2 className="text-xl font-bold tracking-tighter">BILIBILI ANIME</h2>
                                <span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded-full font-bold">
                                    {biliList.length} WORKS
                                </span>
                            </div>
                            <div className='grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
                                {biliList.map((anime, index) => renderCard(anime, index))}
                            </div>
                        </section>

                        {/* 2. Trakt 影视部分 [cite: 2026-01-20] */}
                        <section>
                            <div className="flex items-center gap-3 mb-8">
                                <h2 className="text-xl font-bold tracking-tighter">TRAKT MOVIES & TV</h2>
                                <span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded-full font-bold">
                                    RECENT WATCHED
                                </span>
                            </div>
                            <div className='grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
                                {traktList.map((item, index) => renderCard(item, index))}
                            </div>
                        </section>

                    </div>
                )}
            </div>
        </>
    )
}
