# 蜀作 · 非遗互动工坊

使用 April Zhu 的 Colorfigures 绘图引擎与原创四川非遗模型，展示蜀锦、蜀绣、道明竹编、绵竹木版年画及自贡彩灯。

## 部署到 GitHub Pages

本项目是纯静态网站，不需要 API Key、后端或数据库。已附带 `.github/workflows/deploy-pages.yml`：每次更新 `main` 分支，先自动检查，再将 `dist/` 发布到 GitHub Pages。Pull Request 只检查，不发布。

1. 解压交付的 ZIP，在 GitHub 新建仓库，例如 `shu-craft-lab`，默认分支使用 `main`。免费账号可使用公开仓库。
2. 把解压后的**全部内容上传到仓库根目录**，包括 `.github` 文件夹；不要把 ZIP 本身上传，也不要再套一层文件夹。仓库首页应直接看到 `dist/`、`scripts/`、`package.json`、`README.md` 和 `.github/workflows/deploy-pages.yml`。
3. 打开仓库 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。
4. 打开 **Actions → Check and deploy GitHub Pages → Run workflow**，选择 `main` 运行。首次上传若早于启用 Pages，先启用再手动运行即可。
5. 等待 `check` 和 `deploy` 都变绿，在部署结果或 Settings → Pages 中打开网址。通常为 `https://你的用户名.github.io/仓库名/`。后续提交到 `main` 会自动更新。

如果网页上传漏掉 `.github`，可在 GitHub 点击 **Add file → Create new file**，文件名填写 `.github/workflows/deploy-pages.yml`，粘贴压缩包内同名文件的完整内容后提交。

此交付使用 GitHub Actions 发布 `dist/`，Pages 的 Source 应选择 GitHub Actions。网站路径均为相对路径，仓库可自行命名，不需要修改网址前缀。页面入口是 `dist/index.html`，发布时会成为站点根目录的 `index.html`。五个工坊以 `#jin`、`#xiu`、`#bamboo`、`#print`、`#lantern` 切换，支持刷新和分享直达链接。

公开部署后，课堂访问网站不需要登录。学生手记与作品依然保存在各自浏览器中，不会上传 GitHub；从原有站点换到 GitHub Pages 后，浏览器记录不会自动迁移，可提前导出手记及 SVG。

部署步骤参考 [GitHub 官方 Pages 文档](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

## 常见部署问题

- **打开网址是 404**：确认部署成功，网址包含仓库名和末尾 `/`；确认上传时没有多套一层目录。
- **Actions 没有工作流**：确认 `.github/workflows/deploy-pages.yml` 已上传，分支是 `main`。
- **提示 Pages 未启用**：先在 Settings → Pages 选择 GitHub Actions，再手动 Run workflow。
- **提示分支不能部署到环境**：确认 `github-pages` 环境的部署规则允许 `main`，详见仓库 Settings → Environments。
- **机构限制了 Actions**：仓库或组织需要允许配置中使用的 GitHub 官方 `actions/*` 工作流。
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

`npm run check` 检查浏览器及 Node 脚本语法、本地资源的大小写与相对路径、五个课程内容及场景接入，并实际运行每个场景的四道制作工序，验证跳步、重复点击和制作中重置。该检查不依赖第三方包，已接入 GitHub Actions。

`node scripts/verify-figures.mjs` 是可选的几何验收：调用可用的 Sharp 或 Codex 自带运行时，为每个工坊生成 7 个角度的常规及透视拆解联系表，保存在 `qa/`。如没有 Sharp，可先运行 `npm install --no-save --package-lock=false sharp`；此依赖仅用于开发验收，线上网站与部署检查不需要它。浏览器另行检查制作、收藏、问答、课堂模式、手机布局与导出。

交付包包含 `验收报告.md` 和 `SHA256SUMS.txt`。不包含原部署平台配置、Git 历史、凭据、学生记录、node_modules 或验收图片。
