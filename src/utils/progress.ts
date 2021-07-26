// import { stdout as slog } from "single-line-log";
class ProgressBar {
    private _task: any
    private _description: string
    private _barLen: number = 25
    constructor(task: any, description: string, barLen?: number) {
        this._task = task
        this._description = description
        this._barLen = barLen || 25
    }

    render(opts: {
        completed: number;
        total: number;
    }) {
        const percent = parseFloat((opts.completed / opts.total).toFixed(4))
        const cell_num = Math.floor(percent * this._barLen)

        // 拼接黑色条
        let cell = ''
        for (let i = 0; i < cell_num; i++) {
            cell += '█'
        }

        // 拼接灰色条
        let empty = ''
        for (let i = 0; i < this._barLen - cell_num; i++) {
            empty += '░'
        }

        // 拼接最终文本
        const cmdText = `${this._description}: ${(100*percent).toFixed(2)}% ${cell}${empty} ${opts.completed}/${opts.total}`
        
        this._task.output = cmdText
    }

}

export default ProgressBar