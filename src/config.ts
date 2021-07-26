import * as lisa from '@listenai/lisa_core'
import * as path from 'path'

module.exports = ({application, fs, ...core} = lisa) => {
  // 更多applicaton的用法，请到核心库文档查阅 https://open.listenai.com/lisacore/index.html
  application.configuration(config => {
    config.addContext('cskOptimize', {
      audioRecordDat: path.join(application.root, 'optimize/audio_record_dat'),
      audioRecord: path.join(application.root, 'optimize/audio_record'),
      optimizingPath: path.join(application.root, 'target/optimizing'),
      testReportPath: path.join(application.root, 'test_report'),
      optimumAdvicePath: path.join(application.root, 'test_report/optimum_advice'),
    })
  })

  application.addContext('cskBuild', {
    buildingPath: path.join(application.root, 'target/building'),
  });
  // application.pipeline.custom = {
  //   desc: '自定义pipeline',
  //   tasks: []
  // }
}