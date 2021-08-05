import * as path from 'path';
import lisa from '@listenai/lisa_core'
import task from '../src/tasks/optimumReport'
import {projectDirSync, removeDir, taskLoad} from './res/utils'

const {application, fs, runner} = lisa

const TEST_TYPE = 'optimumReport'
const TASK_NAME = 'optimize:optimumReport'

const mockCtx:any = {
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

describe('测试 生成测试集', () => {
    afterAll(async () => {
        await removeDir(TEST_TYPE)
    })
    test('test: 生成测试集', async () => {
        const TEST_DIR = projectDirSync(TEST_TYPE)
        await fs.copy(path.join(__dirname, './res/audio'), path.join(TEST_DIR, 'optimize/audio_record'))
        await fs.copy(path.join(__dirname, './res/dat'), path.join(TEST_DIR, 'optimize/audio_record_dat'))
        await fs.copy(path.join(__dirname, './res/target/trainTestSetlog'), path.join(TEST_DIR, 'target/optimizing/trainTestSetlog'))
        await fs.copy(path.join(__dirname, './res/target/optimumTestSetLog'), path.join(TEST_DIR, 'target/optimizing/optimumTestSetLog'))
        await fs.copy(path.join(__dirname, './res/target/adaptionThreshold'), path.join(TEST_DIR, 'target/optimizing/adaptionThreshold'))
        await fs.copy(path.join(__dirname, './res/mainToml/right.toml'), path.join(TEST_DIR, 'target/building/main.toml'))
        await fs.copy(path.join(__dirname, './res/mainToml/cmd_train.txt'), path.join(TEST_DIR, 'target/building/cmd_train.txt'))
        await fs.copy(path.join(__dirname, './res/mainToml/main_train.txt'), path.join(TEST_DIR, 'target/building/main_train.txt'))
        await fs.copy(path.join(__dirname, './res/mainToml/mlp.bin'), path.join(TEST_DIR, 'target/building/mlp.bin'))
        await fs.copy(path.join(__dirname, './res/mainToml/esr.bin'), path.join(TEST_DIR, 'target/building/esr.bin'))
        // await fs.copy(path.join(__dirname, './res/mainToml/right.toml'), path.join(TEST_DIR, 'target/building/main.toml'))
        // 独立的 task loader
        await taskLoad(task, TEST_DIR)
        // 执行task
        const res = await runner(TASK_NAME, mockCtx, true)
        // 测试结果校验
        console.log(res)
        const optimumTestSetLogPath = path.join(application.context.cskOptimize.testReportPath,'optimum_advice')
        const cskPath = path.join(optimumTestSetLogPath, 'optimum_advice.csk')
        expect(fs.existsSync(cskPath)).toBeTruthy()
        
        // expect(res && (res as any).recordFormat).toEqual('16k32bit6ch')
        // expect(res && (res as any).datReady).toBeUndefined()
    })
    
})