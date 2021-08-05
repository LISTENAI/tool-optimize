import lisa from "@listenai/lisa_core"
import * as path from 'path'
import { PassThrough } from 'stream';
import { createInterface } from 'readline';
import { once } from 'events';
import * as iconv from 'iconv-lite'

export default async (params: Array<string>, onProcess?: (opts: {
    message: string;
    percent: number;
}) => void) => {
    const { cmd } = lisa
    let success = false
    const toolExe = path.join(__dirname, '../../tool/compare_log.exe')
    const exec = cmd(toolExe, params)

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
            const result = JSON.parse(line)
            if (result.type === 'callback') {
                onProcess && onProcess({
                    message: result.message,
                    percent: result.percent
                })
            }
            if (result.type === 'result' && result.result === 0) {
                success = true
            }
        } catch (error) {
            
        }
    });

    await once(exec, 'exit');
    return success
}