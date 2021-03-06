import { JsonArray } from '@iarna/toml'
import lisa from '@listenai/lisa_core'
import {parsePackageJSON} from '@listenai/lisa_core'
import * as path from 'path'
import tomlHandler from '../utils/toml-handler'
import fileHandler from '../utils/file-handler'
import targetFileInfo from '../utils/targetFileInfo'

export default (core = lisa) => {
  const {job, application, fs} = core
  const ReadyStep = {
    mainTomlConfigCheck(ctx:any){
      const main_toml_config = tomlHandler.parse(path.join(application.context.cskBuild.buildingPath, 'main.toml'))
      const cmds: JsonArray = <JsonArray>main_toml_config['cmds']
      ctx.cmds = cmds
      return cmds
    },
    async datCheck(ctx:any){
      try {
        const projectPackageJson = parsePackageJSON()
        const algo = Object.keys(projectPackageJson.dependencies).find(item => item.indexOf('@algo/') >= 0)
        const algoPackageJson = parsePackageJSON(
          path.join(process.cwd(), `node_modules/${algo}/package.json`)
        )
        application.log(`datCheck algo :${algo} | ${JSON.stringify(algoPackageJson)}`)
        ctx.algoVersionJson = {
          name: algoPackageJson.name,
          version: algoPackageJson.version,
        }

        const targetInfo = await targetFileInfo(path.join(application.context.cskOptimize.audioRecordDat, 'target.txt'))
        ctx.target = targetInfo?.list || []
        ctx.recordFormat = targetInfo.recordFormat
        let datExist = true 

        const algoVersionFile = path.join(application.context.cskOptimize.audioRecordDat, 'algoVersion')
        if (!fs.existsSync(algoVersionFile)) {
          throw new Error('algo包版本缺失')
        }
        const algoVersionJson = JSON.parse(fs.readFileSync(algoVersionFile).toString())

        if (algoPackageJson.name !== algoVersionJson.name || algoPackageJson.version !== algoVersionJson.version) {
          throw new Error('algo包不一致')
        }

        ctx.target.forEach((item: {
          audioFileName: string;
          text: string;
        }) => {
          const audioFileName = item.audioFileName
          //判断文件是否存在
          const datDirPath = path.join(application.context.cskOptimize.audioRecordDat, 'DAT')
          const audioRecordDat_file = path.join(datDirPath, `dat_${audioFileName}__data.dat`)
          const audioRecordDat_fileExist = fs.existsSync(audioRecordDat_file)
          if (!audioRecordDat_fileExist) {
            application.log(`【-】该文件DAT缺失 ： ${audioFileName} | ${audioRecordDat_file} | ${audioRecordDat_fileExist}`)
            datExist = false
          }
          // else{
          //   application.log(`【+】 ： ${audioFileName} | ${audioRecordDat_file} | ${audioRecordDat_fileExist}`)
          // }
        })
        
        return {'exist':datExist, 'array':ctx.target}
      } catch (error:any) {
        application.log(`datCheck error :${error.message}`)
        return {'exist': false, 'array': []}
      }
    },
    formatterCheck(ctx:any, fileArray: Array<any>){
      if (!fileArray){
        return false
      }
      // 取audioFileName，解析取出音频格式(xxkxxbitxxch)，若存在不一致的，转3
      const recordFormatRegex = /([0-9]+k[0-9]+bit[0-9]+ch)/g;
      // 扔到 ctx.recordFormat

      let formatSame = true
      let newFormatter = ''
      fileArray.forEach((json: any) => {
        const name = json.audioFileName
        const formatter = name.match(recordFormatRegex)
        if (formatter && formatter.length > 0){
          newFormatter = formatter[0] 
        }
        if (newFormatter != formatter) {
          formatSame = false
        }
      })
      if (formatSame) {
        ctx.recordFormat = newFormatter
      }
      return formatSame
    },
    async audioCheck(ctx:any){
      const audioRecord_target = path.join(application.context.cskOptimize.audioRecord, 'target.txt')
      const audioRecordTargetArray = await fileHandler.readline(audioRecord_target)

      let audioExist = true
      const audioArray: Array<any> = []
      audioRecordTargetArray.forEach(item => {
        const audioFileNames = item.split(',')
        if (audioFileNames && audioFileNames.length > 0) {
          const audioFileName = audioFileNames[0]
          const audioFileText = audioFileNames[1]

          //判断文件是否存在
          const audioRecord_file = path.join(application.context.cskOptimize.audioRecord, `${audioFileName}.pcm`)
          const audioRecord_fileExist = fs.existsSync(audioRecord_file)
          if (!audioRecord_fileExist) {
            audioExist = false
          }
          const json = {'text':audioFileText, 'audioFileName':audioFileName}
          audioArray.push(json)
        }
      })
      if (audioExist) {
        ctx.target = audioArray
      }
      return {'exist':audioExist, 'array':ctx.target}
    }
  }

  job('optimize:ready', {
    title: '执行前准备',
    task: async (ctx, task) => {
        // 1、Load Text and PinYin from main.toml

        // tomlHandler.parse(path.join(application.context.cskBuild.buildingPath, 'main.toml'))
        // const cmds = main_toml_config['cmds'].map(cmd => ({ text: cmd['text'], pinyin: cmd['pinyin'] })).concat(
        //     main_toml_config['wakeup'].map(wakeup => ({ text: wakeup['text'], pinyin: wakeup['pinyin'] }))
        // );
        // 扔到 ctx.cmds = cmds
        const cmds = ReadyStep.mainTomlConfigCheck(ctx)

        // 2、查看是否存在dat文件（其中一个为否，不吐error，转去3）

        // Load Text and audioFileName from target.txt
        // path.join(application.context.cskOptimize.audioRecordDat, 'target.txt')
        // 扔到 ctx.target

        const datResult = await ReadyStep.datCheck(ctx)
        const datExist = datResult.exist
        const datArray: Array<any> = datResult.array

        // 取audioFileName，解析取出音频格式(xxkxxbitxxch)，若存在不一致的，转3
        // const recordFormatRegex = /([0-9]+k[0-9]+bit[0-9]+ch)/g;
        // 扔到 ctx.recordFormat
        const formatSame = ReadyStep.formatterCheck(ctx, datArray)
        
        // 判断cmds的Text跟target的Text是否完全不一样，若是，转3
        let cmdAndtargetSame = false
        if (cmds && datArray){
          cmds.forEach((cmdJson: any) => {
            const cmdText = cmdJson.text
            datArray.forEach((json: any) => {
              const targetText = json.text
              if (cmdText == targetText){
                cmdAndtargetSame = true
              }
            })
          })
        }
        
        // 查看target.txt中的audioFileName，是否存在dat文件
        // `dat_${audioFileName}__data.dat`
        // ctx.datReady = true
        application.log(`>>> ready message:: ${datExist} :: ${formatSame} :: ${cmdAndtargetSame}`)
        if (datExist && formatSame && cmdAndtargetSame){
          ctx.datReady = true
          // application.log(`>>> dat Ready ::${datArray.length} :: ${ctx.recordFormat}`)
        }else{
          const audioResult = await ReadyStep.audioCheck(ctx)
          const audioExist = audioResult.exist
          const audioArray: Array<any> = audioResult.array
          const audioFormatSame = ReadyStep.formatterCheck(ctx, audioArray)
          // application.log(`>>> dat not Ready ::${audioArray.length} :: ${ctx.recordFormat} :: ${audioFormatSame}`)
        // 3、查看是否存在音频文件

        // 重复2的步骤
        // path.join(application.context.cskOptimize.audioRecord, 'target.txt')

        // `${audioFileName}.pcm`
        }
    },
  })
}