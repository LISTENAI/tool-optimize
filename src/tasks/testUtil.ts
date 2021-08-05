import lisa from '@listenai/lisa_core'
import targetFileInfo from '../utils/targetFileInfo'
import * as path from 'path'
export default (core = lisa) => {
  const {job, application, fs, cmd} = core
  job('optimize:process', {
    title: '测试进度条',
    task: async (ctx, task) => {
      targetFileInfo(path.join(application.context.cskOptimize.audioRecord, 'target.txt'))
      return
    },
  })
}