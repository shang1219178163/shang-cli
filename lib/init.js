#!/usr/local/bin/node

import fs from 'fs';
import fse from 'fs-extra';
import ora from 'ora';
import shell from 'shelljs';
import chalk from 'chalk';
import symbol from 'log-symbols';
import inquirer from 'inquirer';
import clone from './clone.js';


const initAction = async (name, option) => {

  // const templatePath = `${shell.pwd()}/template/${name}`;
  // console.log('templatePath', templatePath);
  // return

  //获取 ci 项目 package.json 配置
  const jsonPath = `./package.json`;
  const data = fs.readFileSync(jsonPath, function(err, data) {
      console.log('读取文件:', jsonPath, err, data);
    })
  const packageObj = JSON.parse(data);

  // 默认仓库
  let repository = packageObj.repositorys[0];
  if (packageObj.repositorys.length > 2) {
    const answer = await inquirer.prompt([
      {
        name: "url",
        message: "请选择模板:",
        type: "list",
        choices: packageObj.repositorys
      }]);
    // console.log('url:', answer.url);
  
    repository = packageObj.repositorys.find(e => e.value === answer.url);
  }

  const remote = option.url ?? repository.value; // 远端仓库地址
  const branch = option.url ? '' : (repository.branch ?? 'master' ?? 'main');
  const registry = packageObj.registry; // npm 仓库地址

  // 检查控制台是否可运行git
  if (!remote) {
    console.log(symbol.error, '仓库地址无效!');
    shell.exit(1); // 退出
  }

  // 检查控制台是否可运行git
  if (!shell.which('git')) {
    console.log(symbol.error, 'git命令不可用！');
    shell.exit(1); // 退出
  }
  // 验证name输入是否合法
  if (name.match(/[^A-Za-z0-9\u4e00-\u9fa5_-]/g)) {
    console.log(symbol.error, '项目名称存在非法字符！');
    return;
  }

  // 下载模板
  let templatePath = `template/${name}`;
  // templatePath = name;
  // 验证name是否存在
  if (fs.existsSync(templatePath) && !option.force) {
    console.log(symbol.error, `已存在项目文件夹${templatePath}`);
    return;
  } else if (option.force) {
    // 强制覆盖
    const removeSpinner = ora(`${templatePath}已存在，正在删除文件夹…`).start();
    try {
      fse.removeSync(`./${templatePath}`);
      removeSpinner.succeed(chalk.green('文件删除成功'));
    } catch(err) {
      console.log(err);
      removeSpinner.fail(chalk.red('文件删除失败'));
      return;
    }
  }
  
  try {
    // const repo = `direct:${remote}` + (branch.length > 0 ? `#${branch}` : '#main');
    const repo = `direct:${remote}` + (branch.length > 0 ? `#${branch}` : '#main');
    console.log('repo:', repo);

    await clone(repo, templatePath, {clone: true});
    if(!fs.existsSync('template')) fse.mkdirSync('template');
    // fse.copySync(templatePath, `/Users/shang/Downloads/${name}`);
    // fse.copySync(templatePath, `${shell.pwd().toString()}/${name}`);

    // fs.opendirSync(`/Users/shang/Downloads/${name}`);
    console.log(symbol.success, chalk.green('代码已拷贝至下载目录!'));
  } catch (error) {
    console.log(error);
    return;
  }

  return
 
  // 下载完毕后，定义自定义问题
  let questions = [
    {
      type: 'input',
      message: '请输入项目关键词（,分割）：',
      name: 'keywords'
    },
    {
      type: 'input',
      message: '请输入项目简介：',
      name: 'description'
    },
    {
      type: 'input',
      message: '请输入您的名字：',
      name: 'author'
    },
  ];
  // 通过inquirer获取用户输入的回答
  let answers = await inquirer.prompt(questions);
  // 将用户配置信息打印一下，确认是否正确
  console.log('---------------------');
  console.log(answers);
  // 确认是否创建
  let confirm = await inquirer.prompt([{
    type: 'confirm',
    message: '是否确认创建项目',
    default: 'Y',
    name: 'isConfirm'
  }]);
  if (!confirm.isConfirm) {
    return false;
  }

  // 根据用户输入，调整配置文件
  const path = `./${name}/package.json`;
  // 调整 package.json 文件
  let obj = editJsonFile(path, (jsonData) => {
    Object.keys(answers).forEach(item => {
      if (item === 'name') {
        // 如果未输入项目名，则使用文件夹名
        jsonData[item] = answers[item] && answers[item].trim() ? answers[item] : name;
      } else if (answers[item] && answers[item].trim()) {
        jsonData[item] = answers[item];
      }
    });
    // console.log('jsonData', jsonData);
  });

  // 初始化 git
  if (shell.exec(`cd ${shell.pwd()}/${templatePath} && git init`).code !== 0) {
    console.log(symbol.error, chalk.red('git 初始化失败'));
    shell.exit(1);
  }

  // 自动安装依赖
  // installPackage(name, registry);

  console.log(chalk.green(
`
--------------------------------------------------------------------------------
🎉  Congrats
🚀  ${obj.name ?? '-'} (v${obj.version ?? '-'}) successfully created.
📅  ${new Date()}
🌎  ${registry}
👍  Start your job!
--------------------------------------------------------------------------------
`
  ));

  shell.exit(1);
}

// 编辑 package.json 文件
const editJsonFile = (path, cb) => {
  if (!fs.existsSync(path)) {
    console.log('*.json 文件不存在,请检查路径:', path);
    // throw new Error('*.json 文件不存在,请检查路径:', path);
    return;
  }

  let jsonData = fs.readFileSync(path, function(err, data) {
    console.log('读取文件:', path, err, data);
  })
  jsonData = JSON.parse(jsonData);
  cb && cb(jsonData);
  // 写入
  let obj = JSON.stringify(jsonData, null, '\t')
  fs.writeFileSync(path, obj, function(err, data) {
    console.log('写入文件:', path, err, data);
  });

  let jsonDataNew = fs.readFileSync(path, function(err, data) {
    console.log('读取文件:', path, err, data);
  })
  return JSON.parse(jsonDataNew);
}

// const jsonFileRead = (path, cb) => {
//   const jsonData = fs.readFileSync(path, cb ?? function(err, data) {
//     console.log('读取文件:', path, err, data);
//   })
//   return JSON.parse(jsonData);
// }

// const jsonFileWrite = (path, cb) => {
//   let obj = JSON.stringify(jsonData, null, '\t')
//   fs.writeFileSync(path, obj, cb ?? function(err, data) {
//     console.log('写入文件:', path, err, data);
//   });
// }

// 安装依赖
const installPackage = (name, registry = "https://registry.npmjs.org/") => {
  if (!name) {
    throw new Error('name 不能为空');
  }

  const installSpinner = ora('安装依赖中…').start();
  if (shell.exec(`cd ${shell.pwd()}/${name} && npm config set registry ${registry} && npm install -d`).code !== 0) {
    console.log(symbol.error, chalk.yellow('自动安装依赖失败，请手动安装'));
    shell.exit(1)
  }
  installSpinner.succeed(chalk.green('依赖安装成功!!!'))
}

export default initAction;