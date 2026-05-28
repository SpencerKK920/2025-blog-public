import { toast } from 'sonner'
import { GITHUB_CONFIG } from '@/consts'
import { getAuthToken } from '@/lib/auth'
import { createBlob, createCommit, createTree, getRef, toBase64Utf8, updateRef, type TreeItem } from '@/lib/github-client'
import type { BlogIndexItem } from '@/lib/blog-index'

export async function toggleOnBoard(
    allItems: BlogIndexItem[],
    slug: string
): Promise<BlogIndexItem[]> {
    const updated = allItems.map(item =>
        item.slug === slug ? { ...item, onBoard: !(item.onBoard !== false) } : item
    )

    const token = await getAuthToken()
    const refData = await getRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`)

    const sortedItems = [...updated].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const indexJson = JSON.stringify(sortedItems, null, 2)
    const indexBlob = await createBlob(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, toBase64Utf8(indexJson), 'base64')

    const treeItems: TreeItem[] = [{
        path: 'public/blogs/index.json',
        mode: '100644',
        type: 'blob',
        sha: indexBlob.sha
    }]

    const treeData = await createTree(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, treeItems, refData.sha)
    const commitData = await createCommit(
        token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO,
        `切换文章精选状态: ${slug}`,
        treeData.sha,
        [refData.sha]
    )
    await updateRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`, commitData.sha)

    return updated
}
