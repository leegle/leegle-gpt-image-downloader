---
name: chrome-extension-release
description: Package and release-check Chrome / Edge extensions. Use before creating ZIP files, uploading to Chrome Web Store / Microsoft Edge Add-ons, or sending a plugin build to users.
---

# Chrome Extension Release Skill

## 目标

把 Chrome / Edge 插件打包成可发布、可安装、文件干净、版本正确的 ZIP 包。

## 适用场景

- 用户说“打包插件”
- 用户说“准备上架 Chrome 商店 / Edge 商店”
- 用户说“生成 ZIP”
- 用户说“发一个新版本”
- 用户说“修完后给我一个包”

## 发布前必须检查

### 1. 版本号

必须先执行 `chrome-extension-versioning`：

- `manifest.json` 版本号已递增
- README / CHANGELOG / 安装教程版本号一致
- ZIP 文件名包含正确日期或版本

### 2. manifest.json

检查：

- `manifest_version` 是否正确
- `name` / `description` 是否适合用户看到
- `version` 是否为合法格式，例如 `0.0.30`
- `permissions` 是否足够但不过度
- `host_permissions` 是否包含后端 API 域名或 IP
- `background.service_worker` 是否存在
- `content_scripts` 是否只匹配必要站点
- `icons` 文件是否存在

### 3. 权限规则

对于需要调用后端 API 的插件：

```json
{
  "permissions": ["storage"],
  "host_permissions": ["http://58.49.165.81:8090/*"]
}
```

如果后续换成域名，应改为：

```json
{
  "host_permissions": ["https://api.example.com/*"]
}
```

### 4. 安全规则

- Content script 不允许直接请求 AMZ API。
- 所有后端请求必须通过 background service worker。
- API Key 可以放在插件端时，要明确这是客户端可见信息，不能作为真正安全密钥。
- 不要把调试账号、后台密码、临时 Cookie、真实用户数据放进仓库。
- 不要把 `.env`、临时日志、测试 ZIP、截图草稿打进发布包。

### 5. 打包排除清单

发布 ZIP 不能包含：

```text
.git/
.github/
node_modules/
.DS_Store
*.log
*.tmp
*.bak
*.zip
screenshots-draft/
test-output/
dist-test/
```

如果项目必须包含构建产物，只打包最终插件运行目录，例如：

```text
dist/
extension/
release/
```

## 推荐 ZIP 命名

### leegle-gpt-image-downloader

```text
leegle-gpt-image_YYYYMMDD_HHMM.zip
```

### leegle-amazon-image-down

```text
leegle-amazon-image-down_vX.Y.Z_YYYYMMDD_HHMM.zip
```

### ListingForge

```text
ListingForge_vX.Y.Z_YYYYMMDD_HHMM.zip
```

## Codex 执行流程

1. 读取项目结构。
2. 执行版本号检查。
3. 检查 `manifest.json` 权限和文件引用。
4. 检查后台请求是否在 service worker 中完成。
5. 检查是否存在敏感文件或不该打包的文件。
6. 如有构建命令，先运行构建。
7. 生成 ZIP。
8. 输出：
   - ZIP 文件名
   - 包含文件数量
   - 排除文件清单
   - 版本号
   - 可否直接上传商店

## 发布说明模板

```text
版本：vX.Y.Z

更新内容：
- 修复：...
- 新增：...
- 优化：...

验证：
- Chrome 开发者模式加载通过
- 核心按钮可点击
- 注册 / 登录 / 授权流程正常
- ZIP 文件不包含临时文件

风险：
- ...
```

## 禁止行为

- 不检查版本号就打包。
- 直接把整个仓库压缩成插件包。
- 把 `.git`、`node_modules`、测试文件打包进去。
- 权限缺失时仍说“可以上架”。
- 后端 API 还在 content script 里直连时仍说“已修复”。
