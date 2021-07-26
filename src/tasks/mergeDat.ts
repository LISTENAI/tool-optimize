import * as lisa from '@listenai/lisa_core'
import * as os from 'os'
import * as iconv from 'iconv-lite'
import * as path from 'path'
import targetFileInfo from '../utils/targetFileInfo'
import execTool from '../utils/execTool'
import ProgressBar from '../utils/progress'

export default ({job, application, fs, cmd, ...core} = lisa) => {
  const MergeDatStep = {
    createMergeDatJSON(){
      const datDirPath = application.context.cskOptimize.audioRecordDat
      fs.mkdirpSync(application.context.cskOptimize.optimizingPath)
      const outDirPath = path.join(application.context.cskOptimize.optimizingPath, 'DAT')
      fs.mkdirpSync(outDirPath)
      if (!fs.existsSync(datDirPath)){
        return false
      }
      
      const cpuThreadNum = os.cpus().length
      const mergeDatPath = path.join(application.context.cskOptimize.optimizingPath, 'mergeDat.json')
      const mergeDatJson:any = {}
      const contentJson:any = {}
      contentJson.audio_dir = datDirPath
      contentJson.out_dir = outDirPath
      contentJson.thread_num = cpuThreadNum
      mergeDatJson.mergeDat = contentJson
      fs.writeFileSync(mergeDatPath,iconv.encode(JSON.stringify(mergeDatJson),'gbk'))
      return true
    },
    async mergeDat(task:any){
      // mini_esr_tool.exe buildOneAuidoToDat ./toolCfg.json
      const toolExePath = path.join(__dirname,'../../tool/mini_esr_tool')
      const mergeDatPath = path.join(application.context.cskOptimize.optimizingPath, 'mergeDat.json')

      const pb = new ProgressBar(task, '生成测试集')
      let completed = 0
      let total = 100
      pb.render({completed, total})

      const res = await execTool('mergeDat', mergeDatPath, (opts) => {
        completed = opts.percent
        if (completed <= 100){
          pb.render({completed, total})
        }
      })
    }
  }
  job('optimize:mergeDat', {
    title: '合并Dat',
    task: async (ctx, task) => {
      const canMerge = MergeDatStep.createMergeDatJSON()
      if (canMerge) {
        await MergeDatStep.mergeDat(task)  
      }
      
        // cmd调用那个工具，mini_esr_tool.exe mergeDat ./mergeDat.json
        // 命令自己拼

        // mergeDat.json 存放到 application.context.cskOptimize.optimizing 去
        // mergeDat.json 下面是例子

        // "mergeDat": {
	    // 	    "audio_dir": "xxx",
	    // 	    "out_dir":"xxx",
	    //      "thread_num": 6
	    // }

        // audio_dir 就是那个放DAT的路径 application.context.cskOptimize.audioRecordDat
        // out_dir 放到 path.join(application.context.cskOptimize.optimizing, 'DAT') 目录下
        // thread_num 可以用下面去取

        // const os = require('os');
        // Math.max(1, os.cpus().length / 2);
    },
  })
}