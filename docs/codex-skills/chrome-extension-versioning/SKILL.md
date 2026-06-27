---
name: chrome-extension-versioning
description: Maintain Chrome / Edge extension version numbers before every code, packaging, or release update. Use when modifying manifest.json, README, CHANGELOG, release ZIPs, browser extension permissions, or user-visible plugin behavior.
---

# Chrome Extension Versioning Skill

## 目标

每次插件更新都必须维护版本号，避免代码已改但 `manifest.json`、README、CHANGELOG、ZIP 文件名版本不一致。

适用项目：

- `leegle-gpt-image-downloader`
- `leegle-amazon-image-down`
- `ListingForge`
- `leegle-image-prompts`
- 其他 Chrome / Edge 插件项目

## 必须执行的检查

1. 找到 `manifest.json`。
2. 读取当前 `version`。
3. 判断本次任务是否属于插件更新：
   - 修 bug
   - 新增功能
   - 修改 UI 文案
   - 修改权限
   - 修改 API 请求逻辑
   - 修改打包文件
   - 修改安装教程或发布说明
4. 如果属于更新，必须递增版本号。
5. 同步检查 README、CHANGELOG、安装教程、ZIP 文件名中的版本号。

## 版本递增规则

### 通用补丁规则

```text
major.minor.patch
```

普通更新递增 `patch`：

```text
v1.0.1 -> v1.0.2
v0.0.29 -> v0.0.30
```

当 `patch` 超过 999 时，自动进位：

```text
v1.0.999 -> v1.1.0
v0.0.999 -> v0.1.0
```

## 项目固定规则

### ListingForge

当前基准：`v1.0.1`

```text
v1.0.1 -> v1.0.2 -> ... -> v1.0.999 -> v1.1.0
```

### leegle-image-prompts

当前基准：`v0.0.1`

```text
v0.0.1 -> v0.0.2 -> ... -> v0.0.999 -> v0.1.0
```

### leegle-gpt-image-downloader

当前已知版本：`v0.0.29`

```text
v0.0.29 -> v0.0.30 -> ... -> v0.0.999 -> v0.1.0
```

### leegle-amazon-image-down

每次代码更新都必须检查 `manifest.json`。如果 README 或 CHANGELOG 记录了版本，也必须同步。

## Codex 执行流程

1. 先运行文件搜索：

```text
manifest.json
CHANGELOG
README
INSTALL
package.json
```

2. 读取 `manifest.json` 的版本号。
3. 计算下一版本号。
4. 修改：
   - `manifest.json`
   - README 中标题版本号，如存在
   - CHANGELOG，如存在
   - 安装教程中的版本号，如存在
5. 输出：
   - 旧版本号
   - 新版本号
   - 修改文件清单
   - 是否存在未同步版本号

## 禁止行为

- 不允许修改了插件功能但不改版本号。
- 不允许只改 README 版本，不改 `manifest.json`。
- 不允许把版本号倒退。
- 不允许跳过用户固定的进位规则。
- 不允许把 `v` 前缀写进 `manifest.json` 的 `version` 字段；Manifest 里应使用 `0.0.30`，文档里可以写 `v0.0.30`。

## 输出模板

```text
版本检查完成：
- 项目：<project>
- 旧版本：v<old>
- 新版本：v<new>
- 已同步文件：<files>
- 风险：<risk or none>
```
