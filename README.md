@tool/optimize
====

@tool/optimize 是一个针对csk工程项目的效果优化工具，包含效果测试、自动调优等

* [Usage](#usage)
* [Commands](#commands)

# Usage
```sh-session
$ lisa install @tool/optimize
```

该工具包被@generator/csk所依赖，创建csk工程项目时，已自带该包，无需额外安装。

### 常用命令：

```sh-session
// 效果测试
$ lisa task optimize:test
```

```sh-session
// 自动测试
$ lisa task optimize:auto
```

# Tasks

## 效果测试自动调优

* [`optimize:test`](#optimize:test)
* [`optimize:auto`](#optimize:auto)

## `optimize:test`

效果测试，准备好测试音频等资源后，执行该task，可输出测试报告。(该task只支持使用三期@algo包的工程项目)

## `optimize:auto`

自动调优，准备好测试音频等资源后，执行该task，可输出调优报告。(该task只支持使用三期@algo包的工程项目)
