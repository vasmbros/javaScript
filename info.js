const childProcess = require("child_process");
const os = require("os");
const cpuCount = os.cpus().length;
console.log(cpuCount);

for (var i = 0; i < cpuCount; i++) {
    var child = childProcess.fork("child2.js", [i]);
    // console.log(`Child Process ID is ${child.pid}`);
    child.send(child.pid);
}