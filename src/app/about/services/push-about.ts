import { useAuthStore } from '@/hooks/use-auth'
import { 
    signAppJwt, 
    getInstallationId, 
    createInstallationToken, 
    putFile,
    toBase64Utf8 
} from '@/lib/github-client'
import { GITHUB_CONFIG } from '@/consts'
import { toast } from 'sonner'

export interface AboutData {
	title: string
	description: string
	content: string
	techStack: string
	changelog: string
    sha?: string
}

const FILE_PATH = 'src/app/about/list.json'

export const pushAbout = async (data: AboutData) => {
	const { privateKey } = useAuthStore.getState()

	if (!privateKey) {
		throw new Error('请先输入 Private Key')
	}

	try {
        // 1. 身份认证流程：使用 Private Key 生成 JWT
        const jwt = signAppJwt(GITHUB_CONFIG.APP_ID, privateKey)
        
        // 2. 获取 Installation ID (连接 App 和 仓库)
        const installationId = await getInstallationId(jwt, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO)
        
        // 3. 生成 Access Token
        const token = await createInstallationToken(jwt, installationId)

        // 4. 准备文件内容
		const contentJson = JSON.stringify({
            title: data.title,
            description: data.description,
            content: data.content,
            techStack: data.techStack,
            changelog: data.changelog
        }, null, 2)
        
        // 使用工具函数转换为 Base64 (支持 UTF-8)
        const contentEncoded = toBase64Utf8(contentJson)

        // 5. 推送文件 (putFile 内部会自动处理 SHA 校验和更新)
		await putFile(
            token, 
            GITHUB_CONFIG.OWNER, 
            GITHUB_CONFIG.REPO, 
            FILE_PATH, 
            contentEncoded, 
            'chore: update about page content', 
            GITHUB_CONFIG.BRANCH
        )

		toast.success('更新成功！')
	} catch (error: any) {
		console.error('Push failed:', error)
		throw error
	}
}
