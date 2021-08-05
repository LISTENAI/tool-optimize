import lisa from '@listenai/lisa_core'
import * as path from 'path'

function taskLoader(core = lisa, dirPath?: string) {
    dirPath = dirPath || __dirname
    const dirs = core.fs.readdirSync(__dirname)
    dirs.forEach(item => {
        const filePath = path.join((dirPath as string), item)
        if (core.fs.statSync(filePath).isFile() && item.endsWith('.js') && filePath !== path.join(__dirname, 'index.js')) {
            require(filePath).default(core)
        } else if (core.fs.statSync(filePath).isDirectory()) {
            taskLoader(core, filePath)
        }
    })
}

export default taskLoader