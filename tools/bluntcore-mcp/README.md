# BLUNTCORE Microtoys MCP · 本地 AI 工具接口

将《关系机关局》和《亲密调音台》的网页逻辑做成**无外部依赖的 Node.js stdio MCP 服务**，供支持 MCP 的客户端（Codex、Claude Code、桌面客户端等）调用。

## 启动

Node.js 18+，无需 npm install：

```bash
node tools/bluntcore-mcp/server.mjs
```

启动后服务在标准输入读取**每行一条 JSON-RPC 消息**，向标准输出写回 MCP 响应；不是网页服务，也不是公网地址。

## 客户端配置

将下方 `/absolute/path/to/...` 改成你本机克隆后的绝对路径：

```json
{
  "mcpServers": {
    "bluntcore_microtoys": {
      "command": "node",
      "args": ["/absolute/path/to/bluntcore-intimacy-lab/tools/bluntcore-mcp/server.mjs"]
    }
  }
}
```

## 工具

- `bluntcore_play_draw`：指定或随机主机关、可选辅机关、情境和变轨，输出开局 Prompt + JSON。
- `bluntcore_play_catalog`：查看七种发动机定义。
- `bluntcore_mixer_profile`：五轴预设与部分覆盖，输出 Prompt + JSON。
- `bluntcore_mixer_presets`：查看五轴含义和默认预设。

示例：`bluntcore_mixer_profile({"preset":"慢热贴近","levels":{"mind":3,"pace":2}})`

## 隐私

该工具不访问网络、磁盘上的私人资料、聊天记录或 DuduLove；MCP 返回的是结构和文本，不会主动给任何人发送消息。由用户/AI 自主选择是否把返回内容加入当前聊天。

## 三种不同的发布形态

1. **GitHub Pages**：两个可分享的独立 HTML 网页，给普通用户点开就玩。
2. **本地 MCP**：此目录的 `server.mjs`，供能启动 Node 子进程的 MCP 客户端使用。
3. **插件 / Skill**：`plugins/bluntcore-microtoys/` 提供指导 AI 使用该套方法的插件骨架；ChatGPT 网页版远程 MCP 工具需要单独托管 HTTPS 服务和注册，不能直接使用本地 stdio。

原始理论：`07-🎮-跟机玩什么_Playbooks-and-Games/理论原文/`
