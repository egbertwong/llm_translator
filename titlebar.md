1. 隐藏默认标题栏
   在实例化 BrowserWindow 的参数中，设置 titleBarStyle 为 hidden：

const mainWindow = new BrowserWindow({
titleBarStyle: 'hidden',
});
该属性设置了窗口的标题栏样式为隐藏，具体可参考：BrowserWindow | Electron (electronjs.org)。设置完毕后系统自带标题栏将被隐藏，内容区会上移填充原本标题栏的位置：

2. 显示系统自带窗口控制按钮
   添加 titleBarOverlay 属性并设置相关参数，以显示系统自带窗口控制按钮，代码如下：

// main.js
const mainWindow = new BrowserWindow({
titleBarStyle: 'hidden',
titleBarOverlay: {
color: 'rgba(0,0,0,0)',
height: 35,
symbolColor: 'white'
}
});
参数说明：

color: 控制按钮区域背景颜色（CSS 颜色）。这里设置为透明色。（仅 Windows）
height: 控制按钮高度（单位 px）。不宜太小，这里设置为 35 是比较合适的。（Windows、MacOS）
symbolColor: 控制按钮颜色（CSS 颜色）。如果你想要暗色背景，那么这里应该设置为亮色，反之亦然。（仅 Windows）
设置后窗口右上角将显示系统自带的控制按钮样式，在 Win11 上可以将光标放在“最大化”按钮上验证是否为系统自带控制按钮

3. 编写自定义标题栏样式
   首先可能想到的是，给标题栏容器设置为 position: fixed 将其脱离文档流并固定在视口的顶部，但这么做会产生一个问题：当内容区产生滚动后，右侧的滚动条会覆盖标题栏，示意图如下：

因此，我们应该让内容区容器内部滚动而不是文档整体滚动，推荐使用 flex 来进行实现，相关代码如下：

<style>
  html,body {
    margin: 0;
    /* 禁止 html,body 滚动，避免滚动条出现在标题栏右边 */
    overflow: hidden;
    height: 100%;
  }
  .root {
    /* 使用 flex 来实现 */
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: black;
    color: white;
  }
  .custom-titlebar {
    display: flex;
    align-items: center;
    /* 避免被收缩 */
    flex-shrink: 0;
    /* 高度与 main.js 中 titleBarOverlay.height 一致  */
    height: 35px;
    width: 100%;
    /* 标题栏始终在最顶层（避免后续被 Modal 之类的覆盖） */
    z-index: 9999;
​
    background-color: #23272e;
    color: white;
    padding-left: 12px;
    font-size: 14px;
  }
  .content {
    /* 内容区需要设置可滚动 */
    overflow: auto;
  }
</style>

​

<div class="root">
  <div
    class="custom-titlebar"
  >
    自定义标题栏
  </div>
  <div class="content">
    <p>content</p>
  </div>
</div>
这样，内容区产生的滚动条就不会覆盖标题栏了：

4. 让标题栏可拖拽移动窗口
   接下来还需要让标题栏通过拖拽移动窗口，需要给标题栏样式设置一个特殊的 CSS 值：-webkit-app-region: drag;，并且设置 user-select: none; 来避免标题栏内容被选中：

.custom-titlebar {
/_ ... 省略其他样式 _/
/_ 避免选中窗口标题 _/
user-select: none;
/_ 设置该属性表明这是可拖拽区域，用来移动窗口 _/
-webkit-app-region: drag;
}
设置完成后，标题栏就可以进行拖拽了，至此，在 Windows 上的自定义标题栏就编写完成了。

5. MacOS 适配
   标题栏居中显示
   在 MacOS 上，窗口控制按钮（又叫 “红绿灯（traffic light）”）默认位于左上角，窗口标题默认位于标题栏中部。因此我们需要判断，如果系统是 MacOS，就要窗口将标题居中显示：

// renderer.js
;(async () => {
// MacOS 上红绿灯默认在标题栏左侧，因此需要将窗口标题文字让开以避免遮挡，这里设为居中。
// 需要注意这里使用了 electron-vite 框架，如果你没有使用该框架，可在 Node 后端将 process.platform 传递给前端进行判断。
// 'darwin' 代表 MacOS
if (window.electron.process.platform === 'darwin') {
document.querySelector('.custom-titlebar').classList.add('darwin')
}
})()
.custom-titlebar.darwin {
justify-content: center;
}

6. Linux 适配
   经过在 Ubuntu 上测试，Ubuntu 目前不支持自定义标题栏，因此只能使用系统默认的标题栏。其他 Linux 发行版没有进行测试。

// renderer.js
;(async () => {
if (window.electron.process.platform === 'linux') {
document.querySelector('.custom-titlebar').classList.add('linux')
}
})()
.custom-titlebar.linux {
display: none;
}
