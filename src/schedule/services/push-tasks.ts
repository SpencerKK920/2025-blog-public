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

const FILE_PATH = 'src/app/schedule/tasks.json'

export const pushTasks = async (content: any) => {
	const { privateKey } = useAuthStore.getState()

	if (!privateKey) {
		throw new Error('请先输入 Private Key')
	}

	try {
        // 1. 身份认证
        const jwt = signAppJwt(GITHUB_CONFIG.APP_ID, privateKey)
        const installationId = await getInstallationId(jwt, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO)
        const token = await createInstallationToken(jwt, installationId)

        // 2. 准备内容
		const contentJson = JSON.stringify(content, null, 2)
        const contentEncoded = toBase64Utf8(contentJson)

        // 3. 推送更新
		await putFile(
            token, 
            GITHUB_CONFIG.OWNER, 
            GITHUB_CONFIG.REPO, 
            FILE_PATH, 
            contentEncoded, 
            'chore: update schedule tasks', 
            GITHUB_CONFIG.BRANCH
        )

		toast.success('日程保存成功！')
	} catch (error: any) {
		console.error('Push failed:', error)
		throw error
	}
}
