import * as path from 'path';
import lisa from '@listenai/lisa_core'
import task from '../src/tasks/audioToDat'
import {projectDir, removeDir, taskLoad} from './res/utils'

const {application, fs, runner} = lisa

const TEST_TYPE = 'audioToDat'
const TASK_NAME = 'optimize:audioToDat'

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

describe('测试：音频转dat', () => {
    afterAll(async () => {
        await removeDir(TEST_TYPE)
    })
    test('test:正常音频转dat', async () => {
        // 模拟项目配置
        const TEST_DIR = await projectDir(TEST_TYPE)
        await fs.copy(path.join(__dirname, './res/audio'), path.join(TEST_DIR, 'optimize/audio_record'))
        await fs.copy(path.join(__dirname, './res/mainToml/right.toml'), path.join(TEST_DIR, 'target/building/main.toml'))
        await fs.copy(path.join(__dirname, './res/mainToml/cmd_train.txt'), path.join(TEST_DIR, 'target/building/cmd_train.txt'))
        await fs.copy(path.join(__dirname, './res/mainToml/main_train.txt'), path.join(TEST_DIR, 'target/building/main_train.txt'))
        await fs.copy(path.join(__dirname, './res/mainToml/mlp.bin'), path.join(TEST_DIR, 'target/building/mlp.bin'))
        // 独立的 task loader
        await taskLoad(task, TEST_DIR)
        // 执行task
        const res = await runner(TASK_NAME, mockCtx, true)
        // 测试结果校验
        console.log(res)

        const datPath = application.context.cskOptimize.audioRecordDat
        expect(fs.existsSync(path.join(datPath,'DAT'))).toBeTruthy()
        expect(fs.existsSync(path.join(datPath,'target.txt'))).toBeTruthy()
        // expect(res && (res as any).recordFormat).toEqual('16k32bit6ch')
        // expect(res && (res as any).datReady).toBeUndefined()
    })
    
})