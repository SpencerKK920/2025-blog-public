'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

// 已更新为你提供的最新 Key [cite: 2026-01-20]
const TRAKT_CLIENT_ID = '23a43b1011bc7e1490da9aa9ada0eea7b028135a65f668cac7885ac9b0ec0b65'
const TMDB_API_KEY = 'c06994e9e33158fdac8dfda5befad851'
const TRAKT_USERNAME = 'SpencerKK'

export default function TrackingPage() {
    // 按分类管理状态 [cite: 2026-01-20]
    const [categories, setCategories] = useState<{
        anime: any[],
        movies: any[],
        shows: any[]
    }>({ anime: [], movies: [], shows: [] })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTraktData = async () => {
            try {
                // 抓取较多记录以确保分类后数量充足 [cite: 2026-01-20]
                const historyRes = await fetch(`https://api.trakt.tv/users/${TRAKT_USERNAME}/history?limit=100`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'trakt-api-version': '2',
                        'trakt-api-key': TRAKT_CLIENT_ID
                    }
                })
                const history = await historyRes.json()

                // 去重并分类
                const seenIds = new Set()
                const rawAnime: any[] = []
                const rawMovies: any[] = []
                const rawShows: any[] = []

                for (const item of history) {
                    const tmdbId = item.type === 'movie' ? item.movie.ids.tmdb : item.show.ids.tmdb
                    if (seenIds.has(tmdbId)) continue
                    seenIds.add(tmdbId)

                    // 抓取详细数据以进行智能分类 [cite: 2026-01-20]
                    const type = item.type === 'movie' ? 'movie' : 'tv'
                    const tmdbRes = await fetch(`https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=zh-CN`)
                    const tmdbData = await tmdbRes.json()

                    const processedItem = {
                        id: item.id,
                        title: item.movie?.title || item.show?.title,
                        cover: `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`,
                        rating: tmdbData.vote_average?.toFixed(1) || '0.0',
                        progress: item.type === 'movie' ? '电影' : `更新至 ${tmdbData.number_of_episodes} 集`,
                        evaluate: tmdbData.overview || '暂无内容介绍。',
                        link: item.type === 'movie' ? `https://trakt.tv/movies/${item.movie.ids.slug}` : `https://trakt.tv/shows/${item.show.ids.slug}`
                    }

                    // 智能分类逻辑 [cite: 2026-01-20]
                    const isAnime = tmdbData.genres?.some((g: any) => g.id === 16) && 
                                    (tmdbData.origin_country?.includes('JP') || tmdbData.original_language === 'ja')

                    if (isAnime) {
                        rawAnime.push(processedItem)
                    } else if (item.type === 'movie') {
                        rawMovies.push(processedItem)
                    } else {
                        rawShows.push(processedItem)
                    }

                    // 每个分类最多显示 10 个 [cite: 2026-01-20]
                    if (rawAnime.length >= 10 && rawMovies.length >= 10 && rawShows.length >= 10) break
                }

                setCategories({ anime: rawAnime, movies: rawMovies, shows: rawShows })
                setLoading(false)
            } catch (error) {
                console.error("Fetch Error:", error)
                setLoading(false)
            }
        }

        fetchTraktData()
    }, [])

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
                <img src={item.cover} alt={item.title} loading="lazy" className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-110' />
                {item.rating > 0 && (
                    <div className='absolute top-2 right-2 rounded-md bg-black/60 px-2 py-1 text-[10px] text-yellow-400 backdrop-blur-md font-bold z-10'>
                        ★ {item.rating}
                    </div>
                )}
                <div className='absolute inset-0 bg-black/80 p-4 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 text-center'>
                    <p className='text-white text-[10px] leading-relaxed line-clamp-6 px-2'>{item.evaluate}</p>
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

    const renderSection = (title: string, sub: string, list: any[]) => (
        list.length > 0 && (
            <section>
                <div className="flex items-center gap-3 mb-8 px-2">
                    <h2 className="text-xl font-bold tracking-tighter uppercase">{title}</h2>
                    <span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded-full font-bold">{sub}</span>
                </div>
                <div className='grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
                    {list.map((item, index) => renderCard(item, index))}
                </div>
            </section>
        )
    )

    return (
        <div className='flex flex-col items-center px-6 pt-32 pb-12'>
            <div className='mb-12 text-center'>
                <h1 className='font-averia text-4xl font-bold tracking-tight uppercase'>Archive</h1>
                <div className='bg-brand mt-2 h-1 w-12 mx-auto rounded-full' />
            </div>

            {loading ? (
                <div className='text-brand animate-pulse text-sm'>正在同步 Trakt 云端数据并分类...</div>
            ) : (
                <div className="w-full max-w-[1200px] space-y-20">
                    {renderSection("Anime", "日本动画", categories.anime)}
                    {renderSection("TV Shows", "欧美/国产剧集", categories.shows)}
                    {renderSection("Movies", "电影归档", categories.movies)}
                </div>
            )}
        </div>
    )
}
