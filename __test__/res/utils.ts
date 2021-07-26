import {fs} from '@listenai/lisa_core'
import * as path from 'path'

const projectDir = async (type: string) => {
    const _projectDir = path.join(__dirname, '../__project__')
    const _testDir = path.join(_projectDir, `${type}/${new Date().toLocaleDateString()}_${Math.random().toString().slice(-6)}`)
    await fs.mkdirp(_testDir)
    return _testDir
}

const projectDirSync = (type: string) => {
    const _projectDir = path.join(__dirname, '../__project__')
    const _testDir = path.join(_projectDir, `${type}/${new Date().toLocaleDateString()}_${Math.random().toString().slice(-6)}`)
    fs.mkdirpSync(_testDir)
    return _testDir
}

const removeDir = async (type: string) => {
    const _projectDir = path.join(__dirname, '../__project__')
    const _testDir = path.join(_projectDir, `${type}`)
    await fs.remove(_testDir)
}

const taskLoad = async (task: any, project: string) => {
    const lisa = await import('@listenai/lisa_core')
    lisa.application.addContext('cskBuild', {
        buildingPath: path.join(project, 'target/building'),
    });
    lisa.application.addContext('cskOptimize', {
        audioRecordDat: path.join(project, 'optimize/audio_record_dat'),
        audioRecord: path.join(project, 'optimize/audio_record'),
        optimizingPath: path.join(project, 'target/optimizing'),
        testReportPath: path.join(project, 'test_report'),
        optimumAdvicePath: path.join(project, 'test_report/optimum_advice')
      })
    if (task instanceof Array) {
        task.forEach(item => {
            item(lisa)
        })
    } else {
        task(lisa)
    }
    return lisa
}

export {
    projectDir,
    projectDirSync,
    removeDir,
    taskLoad
}
