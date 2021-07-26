import * as lisa from '@listenai/lisa_core'
import * as path from 'path'
import execTool from '../utils/execTool'

import { PassThrough } from 'stream';
import { createInterface } from 'readline';
import { once } from 'events';
import * as iconv from 'iconv-lite'

export default ({job, application, fs, cmd, ...core} = lisa) => {
  const TestReportStep = {
    async testReport(){
      const transferLogPath = path.join(__dirname,'../../tool/transfer_log')
      const projectOutputPath = path.join(application.context.cskOptimize.testReportPath,'optimize_report.csk')
      const mainTomlPath = path.join(application.context.cskBuild.buildingPath, 'main.toml')
      const testSet = path.join(application.context.cskOptimize.optimizingPath, 'trainTestSetlog')
      const audioRecordDat = path.join(application.context.cskOptimize.audioRecordDat, 'target.txt')

      await fs.mkdirp(application.context.cskOptimize.testReportPath)

      const exec = cmd(transferLogPath, ['--out',projectOutputPath,'--toml',mainTomlPath,'--dir',testSet,'--map',audioRecordDat])

      const mixer = new PassThrough();
      exec.stdout?.pipe(mixer);
      exec.stderr?.pipe(mixer);

      const rl = createInterface({
          input: mixer.pipe(iconv.decodeStream('gbk')),
          historySize: 0,
          crlfDelay: Infinity,
      });
      rl.on('line', (line) => {
          try {
            console.log(`> ${line}`)
          } catch (error) {
              
          }
      });

      await once(exec, 'exit');
    }
  }
  job('optimize:testReport', {
    title: '生成测试报告',
    task: async (ctx, task) => {
        const testReport = await TestReportStep.testReport()
    },
  })
}