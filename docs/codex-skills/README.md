# Codex Skills for Leegle Chrome Extension Projects

这套文档用于给 Codex / GitHub 工作流提供稳定规则，适合复制到以下项目：

- `leegle-gpt-image-downloader`
- `leegle-amazon-image-down`
- `leegle-image-prompts`
- `ListingForge`
- 其他 Chrome / Edge 插件项目

## 推荐使用方式

每次让 Codex 修改插件前，先把本目录里的相关 `SKILL.md` 内容作为规则读取，或者把整个 `docs/codex-skills` 目录复制到目标项目中。

## 已包含 skill

| Skill | 作用 | 什么时候用 |
|---|---|---|
| `chrome-extension-versioning` | 插件版本号维护 | 每次修改 `manifest.json`、打包、发布前 |
| `chrome-extension-release` | 插件打包发布检查 | 每次生成 ZIP、准备 Chrome Web Store / Edge Add-ons 发布前 |
| `amz-api-auth-debug` | AMZ API 注册/登录/授权调试 | 插件请求 `/register.ashx`、`/login.ashx`、授权码、VIP 到期时间相关问题 |

## 一条通用提示词

```text
@GitHub 请按 docs/codex-skills 规则处理当前插件项目：
1. 先识别当前仓库、当前分支、最近修改文件。
2. 如果是插件更新，必须执行 chrome-extension-versioning。
3. 如果要打包发布，必须执行 chrome-extension-release。
4. 如果涉及注册、登录、授权码、VIP、AMZ API，必须执行 amz-api-auth-debug。
5. 修改前先说明问题和方案；修改后给出改动文件、验证方式、是否需要继续打包。
```

## 用户固定版本规则

### leegle-gpt-image-downloader

当前已知版本：`v0.0.29`。后续版本按补丁号递增：

```text
v0.0.29 -> v0.0.30 -> ... -> v0.0.999 -> v0.1.0
```

### leegle-image-prompts

从 `v0.0.1` 起递增：

```text
v0.0.1 -> v0.0.2 -> ... -> v0.0.999 -> v0.1.0
```

### ListingForge

当前已知版本：`v1.0.1`。递增规则：

```text
v1.0.1 -> v1.0.2 -> ... -> v1.0.999 -> v1.1.0
```

### leegle-amazon-image-down

每次更新必须检查并递增 `manifest.json` 版本号，同时保持 README / CHANGELOG / ZIP 文件名一致。

## 发布前固定检查清单

- `manifest.json` 版本号已递增。
- 插件名称、描述、权限、host_permissions 正确。
- 没有把测试 IP、密钥、调试日志误暴露到用户界面。
- ZIP 只包含插件运行所需文件，不包含 `.git`、临时文件、截图草稿、测试输出。
- README / 安装教程 / CHANGELOG 与当前版本一致。
- 注册、登录、授权逻辑必须走 background service worker，不允许 content script 直连后端 API。
