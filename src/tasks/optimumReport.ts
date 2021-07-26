import * as lisa from '@listenai/lisa_core'
import * as path from 'path'
import execTool from '../utils/execTool'

import { PassThrough } from 'stream';
import { createInterface } from 'readline';
import { once } from 'events';
import * as iconv from 'iconv-lite'
import * as os from 'os'
import execCompareTool from '../utils/execCompareTool'
import ProgressBar from '../utils/progress'
export default ({job, application, fs, cmd, ...core} = lisa) => {
  const OptimumReportStep = {
    async adaptionThreshold(task:any){
      const params:Array<string> = []
      const optimizingPath = application.context.cskOptimize.optimizingPath
      const cskTargetBuild = application.context.cskBuild.buildingPath
      const adaptionThresholdPath = path.join(optimizingPath,'adaptionThreshold')

      const optimumDevicePath = path.join(application.context.cskOptimize.testReportPath,'optimum_advice')
      await fs.mkdirp(optimumDevicePath)
      await fs.copy(path.join(adaptionThresholdPath,'keywords_asr_byOpt.txt'),path.join(optimumDevicePath,'cmd_optimize.txt'))
      await fs.copy(path.join(adaptionThresholdPath,'keywords_main_byOpt.txt'),path.join(optimumDevicePath,'main_optimize.txt'))

      const projectOutputPath = path.join(application.context.cskOptimize.optimumAdvicePath,'optimum_advice.csk')
      const mainPath = path.join(cskTargetBuild,'main.toml')
      const trainTestSetlog = path.join(application.context.cskOptimize.optimizingPath, 'trainTestSetlog')
      const optimuTestSetLog = path.join(application.context.cskOptimize.optimizingPath, 'optimumTestSetLog')
      const audioRecordDat_target = path.join(application.context.cskOptimize.audioRecordDat, 'target.txt')
      
      params.push('--out')
      params.push(projectOutputPath)
      params.push('--toml')
      params.push(mainPath)
      params.push('--old-log')
      params.push(trainTestSetlog)
      params.push('--current-log')
      params.push(trainTestSetlog)
      params.push('--optimize-log')
      params.push(optimuTestSetLog)
      params.push('--map')
      params.push(audioRecordDat_target)
      console.log(`生成调优报告<<< ${params}`)
      const pb = new ProgressBar(task, '生成调优报告')
      let completed = 0
      let total = 100
      pb.render({completed, total})
      const res = await execCompareTool(params, (opts) => {
        completed = opts.percent
        if (completed <= 100){
          pb.render({completed, total})
        }
      })
      return res
    }
  }
  job('optimize:optimumReport', {
    title: '生成调优报告',
    task: async (ctx, task) => {
      const res = await OptimumReportStep.adaptionThreshold(task)
    },
  })
}