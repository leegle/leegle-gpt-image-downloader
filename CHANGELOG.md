# Changelog

## v0.0.18

- 新增高清预览：点击插件内缩略图，可自动读取对应 ChatGPT 原始 file 图片并弹出高清预览。
- 新增「查看当前组高清图」：自动采集当前可见图片组高清原图，并打开第一张高清预览。
- 下载逻辑明确为高清原图下载：优先使用每个右侧缩略图按钮内的 `backend-api/estuary/content?id=file_...` 原始图片链接。
- 高清预览弹窗支持「新标签打开」「加入下载」「关闭」。
- ZIP 下载按钮文案改为「下载已采集高清 ZIP」。

## v0.0.11

- 修复扫描列表默认显示占位图/看起来像图片为空的问题。
- content script 在 ChatGPT 页面上下文中生成真实缩略图，popup 优先显示 `thumbDataUrl`。
- 下载高清图仍按 `file_...` 原始图片 ID 去重。


## v0.0.18
- 默认打开插件后自动放大窗口。
- 默认自动采集当前可见高清组。
- ZIP 文件名改为会话名 + 时间。
- 下载按钮改为直接下载，不再弹出另存为。


## v0.0.18
- 插件名称统一改为 `leegle-gpt-image-downloader`。
- 同步更新 manifest name、short_name、action title、页面标题、README、DEV_NOTES 和源码包文件名。


## v0.0.18
- ZIP 下载文件名固定为 ASCII 安全格式：`leegle-gpt-image_YYYYMMDD_HHMM.zip`。
- ZIP 内部目录不再使用中文会话标题或提示词，避免 Windows 解压后乱码。
- 单组图片：`leegle-gpt-image_YYYYMMDD_HHMM/image_01.png`。
- 多组图片：`leegle-gpt-image_YYYYMMDD_HHMM/group_01/image_01.png`。
