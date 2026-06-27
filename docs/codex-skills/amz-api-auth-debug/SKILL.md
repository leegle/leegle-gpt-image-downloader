---
name: amz-api-auth-debug
description: Debug AMZ API register/login/auth/license issues in Chrome extension projects. Use when a task mentions register.ashx, login.ashx, login_fast.ashx, authorization code, VIP, trial days, 502 Bad Gateway, device ID, background service worker, or AMZ API headers.
---

# AMZ API Auth Debug Skill

## 目标

专门处理 Leegle 插件中的注册、登录、授权码、VIP 到期时间、设备 ID、AMZ API 请求失败等问题。

## 适用项目

- `leegle-amazon-image-down`
- `leegle-gpt-image-downloader`
- `ListingForge`
- 其他接入 AMZ API 授权体系的插件或 GUI

## 已知 AMZ API 信息

基础地址：

```text
http://58.49.165.81:8090/amzapi/
```

常用接口：

```text
/register.ashx
/login.ashx
/login_fast.ashx
/ping.ashx
/db_schema_check.ashx
```

固定请求头：

```http
X-AMZ-API-KEY: azdorMXN0v2tHAWBLoezbOPxycN4UQNU
Content-Type: application/json
Accept: application/json
```

POST 请求必须使用 JSON：

```js
body: JSON.stringify(payload)
```

禁止使用：

```text
GET
form-data
URLSearchParams
content script 直接 fetch AMZ API
```

## Chrome 插件端硬性规则

### 1. Content script 不直接请求 AMZ API

错误方式：

```js
// content script 中直接 fetch 后端 API：禁止
fetch('http://58.49.165.81:8090/amzapi/login.ashx', ...)
```

正确方式：

```js
// content script / popup
chrome.runtime.sendMessage({
  type: 'AMZ_API_REQUEST',
  endpoint: 'login.ashx',
  body: payload
});
```

```js
// background service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'AMZ_API_REQUEST') {
    requestAmzApi(message.endpoint, message.body)
      .then(data => sendResponse({ ok: true, data }))
      .catch(error => sendResponse({ ok: false, error: String(error.message || error) }));
    return true;
  }
});
```

### 2. manifest.json 必须包含权限

```json
{
  "permissions": ["storage"],
  "host_permissions": ["http://58.49.165.81:8090/*"]
}
```

如果未来换域名：

```json
{
  "host_permissions": ["https://你的域名/*"]
}
```

### 3. 统一请求函数

推荐后台统一封装：

```js
const AMZ_API_BASE = 'http://58.49.165.81:8090/amzapi/';
const AMZ_API_KEY = 'azdorMXN0v2tHAWBLoezbOPxycN4UQNU';

async function requestAmzApi(endpoint, body, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(new URL(endpoint, AMZ_API_BASE).toString(), {
      method: 'POST',
      headers: {
        'X-AMZ-API-KEY': AMZ_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body || {}),
      signal: controller.signal
    });

    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_) {
      data = { raw: text };
    }

    if (!res.ok) {
      throw new Error(`AMZ API HTTP ${res.status}: ${text.slice(0, 300)}`);
    }

    return data;
  } finally {
    clearTimeout(timer);
  }
}
```

## 502 Bad Gateway 排查顺序

当 Apifox 成功、插件 8.2 秒左右返回 502 时，Codex 必须按这个顺序查：

1. 插件是不是 content script 直连 API。
2. `manifest.json` 是否缺少 `host_permissions`。
3. 请求是否误用了 GET / form-data / URLSearchParams。
4. 请求头是否缺少 `X-AMZ-API-KEY`。
5. 请求体是否没有 `JSON.stringify`。
6. 后台 service worker 是否被自动休眠或消息未 `return true`。
7. IIS / 反代是否对浏览器插件请求来源做了限制。
8. 服务器是否对 OPTIONS / CORS / 预检请求处理异常。
9. 是否超时太短，建议 30000ms。
10. 设备 ID 是否频繁变化导致登录/授权异常。

## 设备 ID 规则

设备 ID 必须稳定，优先从 `chrome.storage.local` 读取；不存在时创建并保存。

```js
async function getStableDeviceId() {
  const key = 'leegle_device_id';
  const existing = await chrome.storage.local.get(key);
  if (existing[key]) return existing[key];

  const id = crypto.randomUUID();
  await chrome.storage.local.set({ [key]: id });
  return id;
}
```

禁止每次打开插件都重新生成设备 ID。

## 注册 / 登录 / 授权检查清单

- 注册成功后是否保存 token / user_id / expire_time。
- 登录成功后是否更新本地用户信息。
- 授权码成功后是否只显示到期时间，不暴露内部字段。
- 到期后是否进入授权提示页。
- 免费试用天数是否符合后台设置。
- 产品编码 `product_code` 和产品名称 `product_name` 是否来自后台关联选择。
- 用户信息和密码是否可以修改。

## Codex 输出模板

```text
AMZ API 授权调试结果：

问题定位：
- ...

已检查文件：
- manifest.json
- background.js / service_worker.js
- popup.js / content.js

修复方案：
1. ...
2. ...
3. ...

验证步骤：
1. Chrome 开发者模式重新加载插件
2. 打开 background service worker 控制台
3. 测试 ping.ashx
4. 测试 register.ashx
5. 测试 login.ashx
6. 检查 chrome.storage.local 中的 token / device_id / expire_time
```

## 禁止行为

- 不允许继续在 content script 里直接 fetch AMZ API。
- 不允许把登录接口改成 GET。
- 不允许删除 `X-AMZ-API-KEY`。
- 不允许用 form-data 替代 JSON。
- 不允许忽略 502，只提示“服务器问题”。
- 不允许每次打开插件都生成新设备 ID。
