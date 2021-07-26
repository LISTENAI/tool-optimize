import { TaskObject } from "@listenai/lisa_core"

export default (tasks: string[], taskPool: {[key:string]: TaskObject}) => {
    let _tasks: TaskObject[] = []
    tasks.forEach(task => {
        if (taskPool.hasOwnProperty(task)) {
          _tasks.push(taskPool[task])
        }
      });
    return _tasks
}