# Dev Notes v0.0.18

## 关键 DOM 逻辑

ChatGPT 多图生成结果常见结构：左侧一个大图容器，右侧一个 `relative shrink-0` 缩略图列。每个缩略图按钮内有多层重复 `img`，但它们共享同一个原始 file URL。

v0.0.18 保留 v0.0.10/v0.0.11 的按 `file_...` 去重逻辑，并新增：

- `LEEGLE_FETCH_HIGHRES_URL`：从 ChatGPT 页面上下文读取原始图片 URL，fetch 后返回 full-size dataUrl、fileId、宽高、扩展名。
- popup 缩略图点击事件：优先通过 URL 拉取高清图，失败时 fallback 到 `LEEGLE_SELECT_GROUP_INDEX`。
- 高清预览弹窗：显示 full-size 图片，支持加入下载列表。

## 版本规则

v0.0.1 → v0.0.2 → ... → v0.0.999 → v0.1.0。


[v0.0.18]
Auto-fit larger panel on open; auto-capture visible high-res group on load; ZIP filename now uses conversation title + timestamp; downloads start directly with saveAs=false.


[v0.0.18]
Renamed extension/package display name to `leegle-gpt-image-downloader`.


[v0.0.18]
ASCII-safe archive naming. Removed conversation-title/prompt based ZIP root and group folder names. Download filename now uses `leegle-gpt-image_YYYYMMDD_HHMM.zip`; internal paths use `image_XX.ext` or `group_XX/image_XX.ext`.
