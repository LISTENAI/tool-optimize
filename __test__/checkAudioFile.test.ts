import * as path from 'path';
// import * as lisa from '@listenai/lisa_core'
import {fs} from '@listenai/lisa_core'
import task from '../src/tasks/checkAudioFile'
import {projectDir, removeDir, taskLoad} from './res/utils'

const TEST_TYPE = 'checkAudioFile'
const TASK_NAME = 'optimize:ready'

describe('测试：执行前准备', () => {
    afterAll(async () => {
        await removeDir(TEST_TYPE)
    })
    test('test:正常存在dat', async () => {
        // 模拟项目配置
        const TEST_DIR = await projectDir(TEST_TYPE)
        await fs.copy(path.join(__dirname, './res/dat'), path.join(TEST_DIR, 'optimize/audio_record_dat'))
        await fs.copy(path.join(__dirname, './res/mainToml/right.toml'), path.join(TEST_DIR, 'target/building/main.toml'))
        await fs.copy(path.join(__dirname, './res/projectPackage.json'), path.join(TEST_DIR, 'package.json'))
        await fs.copy(path.join(__dirname, './res/@algo'), path.join(TEST_DIR, 'node_modules/@algo'))
        // 独立的 task loader
        const lisa = await taskLoad(task, TEST_DIR)
        // 执行task
        const baseCwd = process.cwd()

        process.chdir(TEST_DIR)
        const res = await lisa.runner(TASK_NAME, {}, true)
        process.chdir(baseCwd)
        // 测试结果校验
        expect(res && (res as any).datReady).toEqual(true)
    })

    // test('test:不存在dat，存在audio', async () => {
    //     // 模拟项目配置
    //     const TEST_DIR = await projectDir(TEST_TYPE)
    //     await fs.copy(path.join(__dirname, './res/audio'), path.join(TEST_DIR, 'optimize/audio_record'))
    //     await fs.copy(path.join(__dirname, './res/mainToml/right.toml'), path.join(TEST_DIR, 'target/building/main.toml'))
    //     // 独立的 task loader
    //     const lisa = await taskLoad(task, TEST_DIR)
    //     // 执行task
    //     const res = await lisa.runner(TASK_NAME, {}, true)
    //     // 测试结果校验
    //     expect(res && (res as any).recordFormat).toEqual('16k32bit6ch')
    //     expect(res && (res as any).datReady).toBeUndefined()
    // })
})