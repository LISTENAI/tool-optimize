import * as path from 'path';
// import * as lisa from '@listenai/lisa_core'
import {application, fs} from '@listenai/lisa_core'
import task from '../src/tasks/mergeDat'
import {projectDir, removeDir, taskLoad} from './res/utils'

const TEST_TYPE = 'mergeDat'
const TASK_NAME = 'optimize:mergeDat'

const mockCtx = {
    cmds: [
        { text: '打开灯光', pinyin: 'da3 kai1 deng1 guang1' },
        { text: '打开定时', pinyin: 'da3 kai1 ding4 shi2' }
    ],
    target: [
        {
            text: '打开灯光',
            audioFileName: '1-打开灯光-ctm0001aabb@hu1734c0a77ee020c902#5741886-16k32bit6ch'
        },
        {
            text: '打开定时',
            audioFileName: '2-打开定时-ctm0001c781@hu175699baece020c902#17367457-16k32bit6ch'
        }
    ],
    recordFormat: '16k32bit6ch'
}

describe('测试：合并dat', () => {
    afterAll(async () => {
        await removeDir(TEST_TYPE)
    })
    test('test: 合并dat', async () => {
        // 模拟项目配置
        const TEST_DIR = await projectDir(TEST_TYPE)
        await fs.copy(path.join(__dirname, './res/audio'), path.join(TEST_DIR, 'optimize/audio_record_dat'))
        // await fs.copy(path.join(__dirname, './res/mainToml/right.toml'), path.join(TEST_DIR, 'target/building/main.toml'))
        // 独立的 task loader
        const lisa = await taskLoad(task, TEST_DIR)
        // 执行task
        const res = await lisa.runner(TASK_NAME, mockCtx, true)
        // 测试结果校验
        console.log(res)
        const mergeDatPath = path.join(application.context.cskOptimize.optimizingPath, 'DAT')
        expect(fs.existsSync(mergeDatPath)).toBeTruthy()
        // expect(res && (res as any).recordFormat).toEqual('16k32bit6ch')
        // expect(res && (res as any).datReady).toBeUndefined()
    })
    
})