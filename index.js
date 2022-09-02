#!/usr/local/bin/node
// 必须在文件头添加如上内容指定运行环境为node
import initAction from './init.js'
// import commander from 'commander' // 处理用户输入的命令

import { Command } from 'commander';
const commander = new Command();
// console.log(commander);

commander
  .command('create <name>') // 定义create子命令，<name>为必需参数，可在action的function中接收；如果需要设置为非必需参数，可使用[]
  .option('-f, --force', '强制覆盖本地同名项目', '-f') // 配置参数
  .option('--url <items1>', '强制覆盖本地同名项目', ) // 配置参数
  .description('使用脚手架创建项目') // 命令描述说明
  .action(initAction) // 执行函数
  .parse(process.argv)