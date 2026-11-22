# YouTube Web Fullscreen

YouTube 网页化全屏油猴脚本：视频填满浏览器**内容区域**，保留浏览器标签栏和地址栏，不使用系统原生全屏。

## 安装

在 Safari 的 Userscripts（或兼容的用户脚本管理器）中新建脚本，粘贴 [YouTube-Web-Fullscreen.user.js](./YouTube-Web-Fullscreen.user.js) 内容并启用。确保已允许扩展访问 `www.youtube.com`。停用旧版本后完整刷新 YouTube 视频页面。

## 使用

- 点击 YouTube 播放器右下角、原生全屏按钮附近的新增按钮，进入或退出网页全屏。
- `Alt + W` 切换网页全屏，`Esc` 退出。
- 如果 YouTube 重建原生控制栏，脚本会尝试在播放器右上角使用备用按钮。
- 支持 YouTube 单页导航时的状态恢复。

## 兼容性与实现

v18.0 面向 Safari Userscripts 调整：使用 DOM API 创建 SVG，避免 Trusted Types 对 `innerHTML` 的限制；避免反复移动按钮引发闪烁；处理 `insertBefore` 需要直接子节点的问题；使用 DOM 属性作为跨注入环境的单实例标记。

脚本依赖 YouTube 当前的播放器 DOM 结构，YouTube 改版可能导致部分功能失效。Safari 下的初始化和原生控制栏挂载曾由控制台日志确认，其他交互及浏览器兼容性尚未建立自动化测试。