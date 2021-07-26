import * as lisa from '@listenai/lisa_core'
import * as path from 'path'
import * as iconv from 'iconv-lite'
import * as os from 'os'
import targetFileInfo from '../utils/targetFileInfo'
import execTool from '../utils/execTool'
import ProgressBar from '../utils/progress'

export default ({job, application, fs, cmd, ...core} = lisa) => {
  const AdaptionStep = {
    async createAdaptionThresholdJSON(){
      await fs.mkdirp(application.context.cskOptimize.optimizingPath)
      const outDirPath = path.join(application.context.cskOptimize.optimizingPath, 'adaptionThreshold')
      await fs.mkdirp(outDirPath)

      const cpuThreadNum = os.cpus().length
      const adaptionThresholdJsonPath = path.join(application.context.cskOptimize.optimizingPath, 'adaptionThreshold.json')
      let mainTrainPath = path.join(application.context.cskBuild.buildingPath, 'main_train.txt')
      let cmdTrainPath = path.join(application.context.cskBuild.buildingPath, 'cmd_train.txt')
      let mlpPath = path.join(application.context.cskBuild.buildingPath, 'esr.bin')

      const adaptionThresholdJson:any = {}
      const seniorParam:any = {}
      seniorParam.bool_enable = true
      seniorParam.bool_use_disturb = false
      seniorParam.weight_crosstalk_limit_roof = 2.0
      seniorParam.weight_crosstalk_limit_floor = 0.5
      seniorParam.weight_robot_limit_roof = 1.5
      seniorParam.weight_robot_limit_floor = 0.5
      seniorParam.weight_robot_crosstalk_roof = 2.0
      seniorParam.weight_robot_disturb_roof = 1.5
      seniorParam.weight_attack_threshold_reduce = 0.7
      seniorParam.weight_attack_initialization_reduce = 0.8
      seniorParam.weight_optimization_sil_reduce = 0.8
      seniorParam.weight_disturb_tolerate_roof = 4.0
      seniorParam.weight_crosstalk_cal_self = 5.0
      seniorParam.weight_crosstalk_cal_add = 1.5
      seniorParam.weight_final_compare_avg = 0.8
      seniorParam.weight_word_than_sent_threshold_roof = 1.2
      seniorParam.num_state_threshold_floor = 500
      seniorParam.num_state_threshold_roof = 1000
      seniorParam.num_final_round_callback = 5
      seniorParam.string_word_exclude_threshold = ''
      seniorParam.string_sent_ignore_exclude = ''
      seniorParam.string_word_must_threshold = ''

      const contentJson:any = {}
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
      
      contentJson.test_log_dir = path.join(application.context.cskOptimize.optimizingPath, 'trainTestSetlog')
      contentJson.out_dir = outDirPath
      contentJson.special_word = ''
      contentJson.thread_num = cpuThreadNum

      adaptionThresholdJson.seniorParam = seniorParam
      adaptionThresholdJson.selfAdaptionThreshold = contentJson

      fs.writeFileSync(adaptionThresholdJsonPath, iconv.encode(JSON.stringify(adaptionThresholdJson),'gbk'))
      return canSwitch
    },
    async adaptionThreshold(task:any){
      const selfAdaptionThresholdPath = path.join(application.context.cskOptimize.optimizingPath, 'adaptionThreshold.json')
      
      const pb = new ProgressBar(task, '自动寻门限')
      let completed = 0
      let total = 100
      pb.render({completed, total})
      const res = await execTool('selfAdaptionThreshold', selfAdaptionThresholdPath, (opts) => {
        completed = opts.percent
        if (completed <= 100){
          pb.render({completed, total})
        }
      })
    }
  }
  job('optimize:adaptionThreshold', {
    title: '自动寻门限',
    task: async (ctx, task) => {
      
        const canAdaption = await AdaptionStep.createAdaptionThresholdJSON()
        if (canAdaption){
          await AdaptionStep.adaptionThreshold(task)

          const outPath = path.join(application.context.cskOptimize.optimizingPath, 'adaptionThreshold')
          const testSetInfo:any = {}
          testSetInfo.mainTxtPath = path.join(outPath,'keywords_main_byOpt.txt')
          testSetInfo.cmdTxtPath = path.join(outPath,'keywords_asr_byOpt.txt')
          testSetInfo.outDirPath = path.join(application.context.cskOptimize.optimizingPath,'optimumTestSetLog')
          ctx.testSetInfo = testSetInfo
        }
    },
  })
}