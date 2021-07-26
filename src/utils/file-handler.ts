import {fs} from '@listenai/lisa_core'
import * as TOML from '@iarna/toml'
import * as iconv from 'iconv-lite'
var readLine = require("readline")

const fileHandler =  {
    /**
     * 按行读取文件内容
     *
     * @param filePath 文件名路径
     *
     * @return 字符串数组
     */
    readline: async (filePath: string) => {
        const arr:Array<string> = [];
        const audioRecord_fileExist = fs.existsSync(filePath)
        if (!audioRecord_fileExist) {
            return arr
        }
        const readObj = readLine.createInterface({
            input: fs.createReadStream(filePath, {encoding:'binary'})
        })

        let excuteResolve: any = null
        const excutePromise = new Promise((resolve, _reject) => {
        excuteResolve = resolve
        })
    
        readObj.on('line', (line: any) =>{
            const lineBuff = Buffer.from(line,'binary')
            const lineStr = iconv.decode(lineBuff, 'gbk')
            arr.push(lineStr);
        });
        readObj.on('close', function () {
            excuteResolve()
        })
         
        await excutePromise
        return arr
    }
}
export default fileHandler