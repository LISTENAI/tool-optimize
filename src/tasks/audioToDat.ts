import lisa from '@listenai/lisa_core'
import * as path from 'path'
import * as iconv from 'iconv-lite'
import targetFileInfo from '../utils/targetFileInfo'
import execTool from '../utils/execTool'
import ProgressBar from '../utils/progress'

export default (core = lisa) => {
  const {job, application, fs} = core
  const AudioToDatStep = {
    createToolCfgJSON(audioFilePath:string, ctx:any){
      const toolCfgPath = path.join(__dirname,'../../tool/toolCfg.json')
      const mainTrainPath = path.join(application.context.cskBuild.buildingPath, 'main_train.txt')
      const cmdTrainPath = path.join(application.context.cskBuild.buildingPath, 'cmd_train.txt')
      const mlpPath = path.join(application.context.cskBuild.buildingPath, 'mlp.bin')
      const cfgJson:any = {}
      const buildOneAuidoToDatJson:any = {}
      let canSwitch = true
      if (fs.existsSync(mainTrainPath)){
        buildOneAuidoToDatJson.keyword_text_main_path = mainTrainPath
      }else{
        canSwitch = false
      }
      if (fs.existsSync(cmdTrainPath)){
        buildOneAuidoToDatJson.keyword_text_asr_path = cmdTrainPath
      }else{
        canSwitch = false
      }
      if (fs.existsSync(mlpPath)){
        buildOneAuidoToDatJson.mlp_bin_path = mlpPath
      }else{
        canSwitch = false
      }
      buildOneAuidoToDatJson.out_dir = application.context.cskOptimize.audioRecordDat
      buildOneAuidoToDatJson.audio_path = audioFilePath
      buildOneAuidoToDatJson.mode_miniesr_type = 'asr'
      buildOneAuidoToDatJson.audio_format_type = ctx.recordFormat
      cfgJson.buildOneAuidoToDat = buildOneAuidoToDatJson
      fs.writeFileSync(toolCfgPath, iconv.encode(JSON.stringify(cfgJson),'gbk'))
      
      return canSwitch
    }
  }
  job('optimize:audioToDat', {
    title: '音频转dat',
    // 如果ctx.datReady为true，即dat文件已经准备好，则跳过该task
    skip: ctx => ctx.datReady === true,
    task: async (ctx, task) => {
      //判断mustToDat
      const mustToDat = ctx.mustToDat || false
      application.log(`mustToDat : ${mustToDat}`)
      if (!mustToDat){
        const datDirPath = path.join(application.context.cskOptimize.audioRecordDat, 'DAT')
        const datIsExit = fs.existsSync(datDirPath)
        const datFiles = fs.readdirSync(datDirPath)
        if (datIsExit && datFiles.length > 0){
          const regenerate = await task.prompt<boolean>({
            type: 'Toggle',
            message: '检查到资源异常，将重新生成Dat文件，是否继续？'
          })
          if (!regenerate){
            throw new Error('用户结束本次操作！')
          }
        }
      }

      const audioRecord = application.context.cskOptimize.audioRecord
      const audioRecordDat = application.context.cskOptimize.audioRecordDat
      // 1、清空application.context.cskOptimize.audioRecordDat目录
      await fs.remove(audioRecordDat)
      await fs.mkdirp(audioRecordDat)
      // 2、copy一份target.txt到audioRecordDat目录下
      await fs.copy(path.join(audioRecord, 'target.txt'), path.join(audioRecordDat, 'target.txt'))
      // 3、遍历ctx.target，拿audioFileName，然后转Dat文件

      // cmd调用那个工具，mini_esr_tool.exe buildOneAuidoToDat ./toolCfg.json
      // 命令自己拼

      // toolCfg.json 下面是例子, building那个是跟main.toml一个目录的,自己拼起来

      // 需要判断 是否存在 keyword_text_main_path,keyword_text_asr_path,mlp_bin_path 这些文件
      // audio_format_type就是前一个task存在ctx里的那个

      // {
      //     "buildOneAuidoToDat": {
      //         "keyword_text_main_path": "e:\\cskproject\\test17\\target\\building\\main_train.txt",
      //         "keyword_text_asr_path": "e:\\cskproject\\test17\\target\\building\\cmd_train.txt",
      //         "mlp_bin_path": "e:\\cskproject\\test17\\target\\building\\mlp.bin",
      //         "out_dir":"e:\\cskproject\\test17\\optimize\\audio_record_dat",
      //         "audio_path":"e:\\cskproject\\test17\\optimize\\audio_record\\1-打开灯光-ctm00010a87@hu174b1703159020c902#13753193-16k32bit6ch.pcm",
      //         "mode_miniesr_type":"asr",
      //         "audio_format_type": "16k32bit6ch"
      //     }
      // }

      // 模拟
      // const audioArray = []
      // const json = {'text':'打开灯光', 'audioFileName':'1-打开灯光-ctm0001aabb@hu1734c0a77ee020c902#5741886-16k32bit6ch.pcm'}
      // audioArray.push(json)
      // ctx.target = audioArray
      // ctx.recordFormat = '16k32bit6ch'
      // 拼好后, config.json 你先存到项目目录里,然后调用.

      let targetInfo
      if (!ctx.target) {
        targetInfo = await targetFileInfo(path.join(audioRecordDat, 'target.txt'))
        ctx.target = targetInfo?.list || []
        ctx.recordFormat = targetInfo.recordFormat
      }

      const targetList:Array<any> = ctx.target

      const pb = new ProgressBar(task, '音频转DAT')
      let completed = 0
      let total = 0
      if (targetList){
        total = targetList.length
      }
      pb.render({completed, total})
      for (let index = 0; index < total; index++) {
        const item = targetList[index];
        const audioFileName = item.audioFileName
        //判断文件是否存在
        const audioRecord_file = path.join(audioRecord, `${audioFileName}.pcm`)
        const audioRecord_fileExist = fs.existsSync(audioRecord_file)
        if (audioRecord_fileExist) {
          const canSwitch = AudioToDatStep.createToolCfgJSON(audioRecord_file, ctx)
          if (canSwitch){
            const res = await execTool('buildOneAuidoToDat', path.join(__dirname,'../../tool/toolCfg.json'), (opts) => {
              // console.log(opts.message)
              // console.log(opts.percent)
            })
            // console.log('成功->', res)
            if (res){
              completed = completed + 1
              pb.render({completed, total})
            }
          }
        }
      }
      // 记录下当前dat文件的algoVersion信息
      fs.writeFileSync(path.join(application.context.cskOptimize.audioRecordDat, 'algoVersion'), JSON.stringify(ctx.algoVersionJson))

      // pcm音频在 application.context.cskOptimize.audioRecord里
      // out的目录是application.context.cskOptimize.audioRecordDat
        
    },
  })
}