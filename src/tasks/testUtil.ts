import * as lisa from '@listenai/lisa_core'
import ProgressBar from '../utils/progress'
import targetFileInfo from '../utils/targetFileInfo'
import * as path from 'path'
export default ({job, application, fs, cmd, ...core} = lisa) => {
  job('optimize:process', {
    title: '测试进度条',
    task: async (ctx, task) => {
      targetFileInfo(path.join(application.context.cskOptimize.audioRecord, 'target.txt'))
      return
      const pb = new ProgressBar(task, '测试一下')
      let completed = 0
      let total = 200
      pb.render({completed, total})
      let promiseRes: any = null
      const promise = new Promise((resolve, reject) => {
        promiseRes = resolve
      })
      const timeout = setInterval(function() {
        completed++
        pb.render({completed, total})
        if (completed === total) {
          clearInterval(timeout)
          promiseRes()
        }
      }, 500)
      await promise
    },
  })
}