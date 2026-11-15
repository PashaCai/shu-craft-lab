# 蜀作 · 非遗互动工坊

使用 April Zhu 的 Colorfigures 绘图引擎与原创四川非遗模型，展示蜀锦、蜀绣、道明竹编、绵竹木版年画及自贡彩灯。

## 部署到 GitHub Pages

本项目是纯静态网站，不需要 API Key、后端、数据库或线上构建。已改为从分支直接发布 `index.html`，删除了原来的自定义 GitHub Actions 工作流。

当前仓库：[PashaCai/shu-craft-lab](https://github.com/PashaCai/shu-craft-lab)。`main` 保存项目源码；`gh-pages` 仅保存网站文件，根目录直接包含 `index.html`、`assets/`、`figures/` 和 `.nojekyll`。

1. 打开仓库 **Settings → Pages → Build and deployment**。
2. **Source** 选择 **Deploy from a branch**。
3. **Branch** 选择 **gh-pages**，目录选择 **/ (root)**，点击 **Save**。
4. 等待 GitHub Pages 发布完成，从 Settings → Pages 打开站点。预期地址为 `https://pashacai.github.io/shu-craft-lab/`，以 GitHub 实际发布结果为准。

网站路径均为相对路径。五个工坊以 `#jin`、`#xiu`、`#bamboo`、`#print`、`#lantern` 切换，支持刷新和分享直达链接。后续更新时，把 `dist/` 中的全部内容同步到 `gh-pages` 根目录即可，保留 `.nojekyll`。

如果使用“纯静态网页包”在自己的新仓库部署：解压后直接上传 `index.html`、`assets/`、`figures/` 和 `.nojekyll`，不要再套 `dist` 或其他外层目录；发布分支选择实际上传文件的分支（如 `main`）和 `/ (root)`。

GitHub 仍会运行平台内部的 Pages 发布任务。直接发布分支不需要自定义工作流，但不能保证绕过账号账单锁定等 GitHub 平台限制；若仍失败，应查看 Pages 发布错误。

公开部署后，课堂访问网站不需要登录。学生手记与作品依然保存在各自浏览器中，不会上传 GitHub；从原有站点换到 GitHub Pages 后，浏览器记录不会自动迁移，可提前导出手记及 SVG。

部署步骤参考 [GitHub 官方 Pages 文档](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

## 常见部署问题

- **打开网址是 404**：确认部署成功，网址包含仓库名和末尾 `/`；确认上传时没有多套一层目录。
- **找不到 gh-pages 分支**：刷新设置页面，确认静态发布分支已推送到仓库。
- **提示 Pages 未启用**：在 Settings → Pages 选择 Deploy from a branch、gh-pages 和 `/ (root)`，点击 Save。
- **提示账号因账单问题锁定**：需要账号所有者处理 GitHub 账单异常，静态 HTML 不会自行解除该限制。
- **模型无法操作**：使用部署后的 HTTP(S) 网址和较新的 Chrome、Edge、Firefox 或 Safari。不要直接双击本地 HTML 文件。

## 本地运行

安装 Node.js 20 或更高版本，在本目录运行 `npm run dev`，打开 `http://127.0.0.1:4173`。不需要 `npm install`。所有页面和素材都在 `dist/`，可整体部署到静态网站服务。使用 HTTP 访问可确保父页面与独立工坊之间的消息通信和浏览器存储正常工作。

运行 `npm run preview:pages`，打开 `http://127.0.0.1:4173/shu-craft-lab/`，可模拟 GitHub Pages 的仓库子路径。两种预览都使用 4173 端口，切换前用 Ctrl+C 停止之前的服务。

## 操作

- 左侧选择工坊，画布左上按四道工序制作；完成后收藏到学习手记。
- 拖动画布旋转，滚轮或缩放按钮缩放；支持方向键、自动旋转及正面复位。
- 透视外层、显示部件标签、动画拆解与组装。
- 五种配色、手绘线条强度、课堂演示模式。
- 读懂它：文化背景、结构观察任务、交互问答、官方资料。
- 学习记录只保存在当前浏览器；支持导出学习手记和已完成作品的 SVG。

## 内容边界

所有工坊是课堂简化示意，具体说明见网站内各工坊的“认识这门手艺”。绵竹年画强调木版印线后手工设色；蜀锦与蜀绣分别呈现织造与在底缎上刺绣。自贡灯会与彩灯制作技艺的国家级和省级名录归属分别注明。所有学习内容附有中国非遗网或中国彩灯博物馆来源。

## 署名

Colorfigures by April Zhu: https://april-zhu.com/colorfigures 。基于原引擎适配了中文标签的字号和宽度，许可证见 `dist/assets/COLORFIGURES-LICENSE.txt`。五个工坊模型与本站界面为本项目编写。

## 验证

`npm run check` 检查浏览器及 Node 脚本语法、本地资源的大小写与相对路径、五个课程内容及场景接入，并实际运行每个场景的四道制作工序，验证跳步、重复点击和制作中重置。该检查不依赖第三方包，在本地运行，不影响静态发布。

`node scripts/verify-figures.mjs` 是可选的几何验收：调用可用的 Sharp 或 Codex 自带运行时，为每个工坊生成 7 个角度的常规及透视拆解联系表，保存在 `qa/`。如没有 Sharp，可先运行 `npm install --no-save --package-lock=false sharp`；此依赖仅用于开发验收，线上网站与部署检查不需要它。浏览器另行检查制作、收藏、问答、课堂模式、手机布局与导出。

交付包包含 `验收报告.md` 和 `SHA256SUMS.txt`。不包含原部署平台配置、Git 历史、凭据、学生记录、node_modules 或验收图片。
