'use client'

import { motion } from 'framer-motion' // 或者使用你项目中的 'motion/react'
import { ExternalLink } from 'lucide-react'

export default function BangumiButton() {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-4">
      <p className="text-sm text-gray-500 font-medium">点击下方按钮前往我的番组计划</p>
      
      <motion.a
        href="https://bgm.tv/user/your_id" // 替换为你的 Bangumi ID
        target="_blank"
        rel="noopener noreferrer"
        // 这里的 hover 和 tap 效果参考了你项目中的 src/components/card.tsx
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        // 使用了你全局定义的样式变量
        className="brand-btn group flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg transition-all"
        style={{
          backgroundColor: '#f09199', // Bangumi 经典粉色
          color: 'white'
        }}
      >
        <span className="font-bold">我的番组计划</span>
        
        {/* 图标动画：hover 时稍微位移 */}
        <motion.div
          animate={{ x: 0 }}
          whileHover={{ x: 3 }}
          className="flex items-center"
        >
          <ExternalLink size={18} strokeWidth={2.5} />
        </motion.div>
      </motion.a>

      {/* 补充一个极简风格的按钮，适配你博客的卡片感 */}
      <motion.a
        href="#"
        whileHover={{ y: -2 }}
        className="mt-4 text-xs text-[#f09199] border-b border-[#f09199]/30 hover:border-[#f09199] transition-colors"
      >
        查看最近更新的片单 →
      </motion.a>
    </div>
  )
}
