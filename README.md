# YouTube Web Fullscreen

一个轻量级的 YouTube **网页全屏（Web Fullscreen）** 油猴脚本：让视频铺满浏览器网页内容区域，同时**保留浏览器的标签栏、地址栏和窗口边框**。它不同于 YouTube 自带的系统全屏模式。

> 版本：v18.0.0 · 适用页面：YouTube 桌面版视频播放页

## 功能

- 在 YouTube 原生播放器右侧控制栏增加「网页全屏」按钮。
- 点击同一按钮切换进入／退出网页全屏，保留 YouTube 的播放控制。
- 支持快捷键 `Alt + W` 切换、`Esc` 退出。
- 兼容 YouTube 站内跳转，播放器重新加载时尝试恢复按钮。
- 如果原生控制栏挂载失败，尝试在播放器右上角显示备用按钮。
- 不依赖外部脚本、网络接口或额外权限。

## 安装（油猴脚本管理器）

**推荐使用 Tampermonkey（篡改猴）等支持用户脚本的管理器。**

1. 在浏览器中安装并启用 [Tampermonkey](https://www.tampermonkey.net/)；如果已安装 Violentmonkey 等兼容管理器，也可以使用。
2. 打开本仓库的 [`YouTube-Web-Fullscreen.user.js`](./YouTube-Web-Fullscreen.user.js)。
3. 在脚本管理器中选择「添加新脚本 / 创建新脚本」，删除编辑器自带的示例代码。
4. 将 `YouTube-Web-Fullscreen.user.js` 的**完整内容**复制进去并保存、启用。注意不要复制 Markdown 代码块标记。
5. 打开 [YouTube](https://www.youtube.com/) 的普通视频播放页，**完整刷新页面**。
6. 鼠标移动到视频上显示播放控制栏，在右下角原生全屏按钮附近寻找新增的网页全屏图标。

如果你以前安装过同名脚本，请**先停用或删除旧版本**，避免多个版本同时修改播放器。

> 也可以尝试用脚本管理器的「从 URL 安装」功能导入 [脚本原始地址](https://raw.githubusercontent.com/xke123/YouTube-Web-FullScreen/main/YouTube-Web-Fullscreen.user.js)；是否直接打开安装界面取决于所用管理器。

## 使用方法

| 操作 | 效果 |
| --- | --- |
| 点击播放器新增的网页全屏按钮 | 视频铺满当前浏览器内容区域 |
| 再次点击该按钮 | 恢复正常 YouTube 页面 |
| `Alt + W` | 切换网页全屏 |
| `Esc` | 退出网页全屏 |
| 点击 YouTube 自带的全屏按钮 | 使用 YouTube／浏览器的原生全屏（与网页全屏不同） |

**网页全屏 vs. 原生全屏：** 前者只覆盖当前网页区域，浏览器顶部工具栏仍可见；后者通常会进入操作系统级全屏体验。

## Safari 安装（备选）

如果使用 macOS Safari，可通过支持用户脚本的扩展（例如 [Userscripts](https://github.com/quoid/userscripts)）安装：

1. 安装并启用 Safari 的 Userscripts 扩展。
2. 授予扩展访问 `www.youtube.com` 的网站权限。
3. 在扩展提供的脚本编辑位置新建 JavaScript 用户脚本，粘贴本仓库 `.user.js` 的完整内容。
4. 保存并启用脚本，重新加载 YouTube 视频播放页。

本项目的 Safari 兼容代码会使用原生 DOM API 创建 SVG，以避免 YouTube 的 Trusted Types 策略拦截 `innerHTML`。实际支持情况仍取决于 Safari、扩展版本和 YouTube 页面结构。

## 常见问题

**没有出现按钮？** 确认脚本已启用、管理器可访问 `www.youtube.com`、页面是 `/watch` 等视频播放页，并完整刷新。不要同时运行多个旧版本脚本。

**按钮在右上角？** 这是原生控制栏无法稳定挂载时采用的备用位置。

**脚本升级后没有变化？** 关闭重复的同名脚本，并对 YouTube 进行完整刷新；只在站内切换视频可能不足以重新加载用户脚本。

## 兼容性与反馈

- 当前实现以 YouTube **桌面网页**为目标，并针对 Safari Userscripts 中实际出现过的 `TrustedHTML` 和按钮插入问题进行了修复。
- 其他浏览器／用户脚本管理器尚未经过完整自动化兼容性测试。
- YouTube 经常调整播放器 DOM；如果按钮位置或全屏布局失效，请在 [Issues](https://github.com/xke123/YouTube-Web-FullScreen/issues) 提供浏览器版本、用户脚本管理器、复现步骤和控制台错误。

## License

尚未声明开源许可证。