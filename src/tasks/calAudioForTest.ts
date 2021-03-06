import lisa from '@listenai/lisa_core'
import * as iconv from 'iconv-lite'
import * as path from 'path'
import * as os from 'os'
import execTool from '../utils/execTool'
import ProgressBar from '../utils/progress'

export default (core = lisa) => {
  const {job, application, fs} = core
  const CalAudioTestStep = {
    async createCalAudioTestJSON(testSetInfo?:any){
      const datDirPath = application.context.cskOptimize.audioRecordDat
      await fs.mkdirp(application.context.cskOptimize.optimizingPath)
      let outDirPath = path.join(application.context.cskOptimize.optimizingPath, 'trainTestSetlog')
      if (!fs.existsSync(datDirPath)){
        return false
      }
      await fs.mkdirp(outDirPath)
      const cpuThreadNum = os.cpus().length
      const calAudioTestPath = path.join(application.context.cskOptimize.optimizingPath, 'calAudioForTest.json')
      
      let mainTrainPath = path.join(application.context.cskBuild.buildingPath, 'main_finaly.txt')
      let cmdTrainPath = path.join(application.context.cskBuild.buildingPath, 'cmd_finaly.txt')
      let mlpPath = path.join(application.context.cskBuild.buildingPath, 'esr.bin')
      if (testSetInfo){
        if (testSetInfo.mainTxtPath){
          mainTrainPath = testSetInfo.mainTxtPath
        }
        if (testSetInfo.cmdTxtPath){
          cmdTrainPath = testSetInfo.cmdTxtPath
        }
        if (testSetInfo.outDirPath){
          outDirPath = testSetInfo.outDirPath
        }
      } 

      const calAudioForTestJson:any = {}
      const contentJson:any = {}
      contentJson.audio_dir = datDirPath
      let canSwitch = true
      if (fs.existsSync(mainTrainPath)){
        contentJson.keyword_text_main_path = mainTrainPath
      }else{
        canSwitch = false
      }
      if (fs.existsSync(cmdTrainPath)){
        contentJson.keyword_text_asr_path = cmdTrainPath
      }else{
        canSwitch = false
      }
      if (fs.existsSync(mlpPath)){
        contentJson.mlp_bin_path = mlpPath
      }else{
        canSwitch = false
      }
      contentJson.out_dir = outDirPath
      contentJson.audio_path = datDirPath
      contentJson.mode_miniesr_type = 'asr'
      contentJson.data_miniesr_type = 'usemlp'
      contentJson.audio_format_type = 'miniesrDat'
      contentJson.need_original = true
      contentJson.thread_num = cpuThreadNum
      calAudioForTestJson.calAudioForTest = contentJson
      fs.writeFileSync(calAudioTestPath,iconv.encode(JSON.stringify(calAudioForTestJson),'gbk'))
      return canSwitch
    },
    async calAudioTest(task: any){
      // mini_esr_tool.exe buildOneAuidoToDat ./toolCfg.json
      const toolExePath = path.join(__dirname,'../../tool/mini_esr_tool')
      const calAudioForTestPath = path.join(application.context.cskOptimize.optimizingPath, 'calAudioForTest.json')
      
      const pb = new ProgressBar(task, '???????????????')
      let completed = 0
      let total = 100
      pb.render({completed, total})

      const res = await execTool('calAudioForTest', calAudioForTestPath, (opts) => {
        completed = opts.percent
        if (completed <= 100){
          pb.render({completed, total})
        }
      })
    }
  }
  job('optimize:testSet', {
    title: '???????????????',
    task: async (ctx, task) => {
      const canMerge = await CalAudioTestStep.createCalAudioTestJSON(ctx.testSetInfo)
      if (canMerge) {
        await CalAudioTestStep.calAudioTest(task)  
      }  
      
        // cmd?????????????????????mini_esr_tool.exe calAudioForTest ./calAudioForTest.json
        // ???????????????

        // calAudioForTest.json ????????? application.context.cskOptimize.optimizing ???
        // calAudioForTest.json ???????????????

        // "calAudioForTest": {
	    // 	    "keyword_text_main_path": "./res/miniEsr1266/1266_xyxy_??????/keywords_main_sc.txt",
		//      "keyword_text_asr_path": "./res/miniEsr1266/1266_xyxy_??????/keywords_minglingci_mab.txt",
		//      "mlp_bin_path": "./res/miniEsr1266/1266_xyxy_??????/res_mva_output_haier0408_iter0_part9.bin",
		//      "audio_dir": "./audio/16k16bit2ch-??????",
		//      "out_dir":"./audio/log",
		//      "mode_miniesr_type":"asr", //?????????
		//      "data_miniesr_type":"usemlp", //?????????
		//      "audio_format_type": "miniesrDat", //?????????
		//      "need_original": true, //?????????
		//      "thread_num":8
	    // }

        // keyword_text_main_path ???building?????? main_finaly.txt
        // keyword_text_asr_path ???building?????? cmd_finaly.txt
        // mlp_bin_path ???building?????? esr.bin
        // audio_dir ???????????????DAT????????? application.context.cskOptimize.audioRecordDat
        // out_dir ?????? path.join(application.context.cskOptimize.optimizing, 'testSetlog') ?????????
        // thread_num ?????????????????????

        // const os = require('os');
        // Math.max(1, os.cpus().length / 2);
    },
  })
}