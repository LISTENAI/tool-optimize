import lisa from "@listenai/lisa_core"
import * as iconv from 'iconv-lite'

export default (targetTxtPath: string) => {
    const { fs } = lisa
    const info: {
        list: Array<any>;
        recordFormat: string;
    } = {
        list: [],
        recordFormat: ''
    }
    const recordFormatRegex = /([0-9]+k[0-9]+bit[0-9]+ch)/g
    if (!fs.existsSync(targetTxtPath)) {
        throw new Error(`该文件不存在: ${targetTxtPath}`)
    }
    const recordFormatSet = new Set()
    const targetTxt = iconv.decode(fs.readFileSync(targetTxtPath), 'gbk')
    info.list = targetTxt.split('\r').join('').split('\n').filter(str => str).map(str => {
        const item = str.split(',')
        const formatter = item[0].match(recordFormatRegex)
        if (formatter) {
            recordFormatSet.add(formatter[0])
        }
        return {
            audioFileName: item[0] || '',
            text: item[1] || ''
        }
    })
    if (recordFormatSet.size !== 1) {
        throw new Error('音频的格式不统一')
    }
    info.recordFormat = String(Array.from(recordFormatSet)[0])
    return info
}