import download from "download-git-repo";
import ora from "ora";
import chalk from "chalk";
import logSymbols from "log-symbols";

export default function (remote, name, option) {
  const cloneSpinner = ora('正在拉取项目…').start();
  return new Promise((resolve, reject) => {
    download(remote, name, option, err =>{
      if (err) {
        cloneSpinner.fail();
        console.log(logSymbols.error, chalk.red(err));
        reject(err)
        return
      }
      cloneSpinner.succeed(chalk.green('代码拉取成功'))
      resolve();
    })
  })
}