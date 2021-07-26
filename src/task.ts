import * as lisa from '@listenai/lisa_core'
import taskLoader from './tasks'
import tasksPipe from './utils/tasksPipe'
import * as path from 'path'
export default (core = lisa) => {
  taskLoader(core)

  core.job('optimize:test', {
    title: '效果测试',
    task: async (ctx, task) => {
      const tasks = [
        'optimize:ready',
        'optimize:audioToDat',
        'optimize:mergeDat',
        'optimize:testSet',
        'optimize:testReport'
      ]
      const _tasks: lisa.TaskObject[] = []
      tasks.forEach(task => {
        if (core.application.tasks.hasOwnProperty(task)) {
          _tasks.push(core.application.tasks[task])
        }
      });
      return new core.Tasks(_tasks)
    },
  })

  core.job('optimize:auto', {
    title: '自动调优',
    task: async (ctx, task) => {
      let _tasks: lisa.TaskObject[] = []
      _tasks = _tasks.concat([
        {
          title: '自动调优配置准备',
          task: async (ctx, task) => {
            ctx.optimizeType = 'auto'
          }
        }
      ])
      _tasks = _tasks.concat(tasksPipe([
        'optimize:ready',
        'optimize:audioToDat',
        'optimize:mergeDat'
      ], core.application.tasks))
      _tasks = _tasks.concat([
        {
          title: '冲击训练阈值准备',
          task: async (ctx, task) => {
            ctx.testSetInfo = {
              mainTxtPath: path.join(core.application.context.cskBuild.buildingPath, 'main_train.txt'),
              cmdTxtPath: path.join(core.application.context.cskBuild.buildingPath, 'cmd_train.txt'),
              outDirPath:  path.join(core.application.context.cskOptimize.optimizingPath, 'trainTestSetlog')
            }
            // ctx.adaptionThresholdInfo = {
            //   mainTrainPath: path.join(core.application.context.cskBuild.buildingPath, 'main_train.txt'),
            //   cmdTrainPath: path.join(core.application.context.cskBuild.buildingPath, 'cmd_train.txt'),
            //   mlpPath: path.join(core.application.context.cskBuild.buildingPath, 'esr.bin'),
            // }
          }
        }
      ])
      _tasks = _tasks.concat(tasksPipe([
        'optimize:testSet',
        'optimize:adaptionThreshold',
        'optimize:testSet',
        'optimize:optimumReport'
      ], core.application.tasks)) 

      return new core.Tasks(_tasks)
    },
  })

}