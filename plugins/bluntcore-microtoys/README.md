# BLUNTCORE Microtoys｜插件包装

这是可复用的**技能型插件**：让 ChatGPT / Codex 等支持 Agent Plugins 的环境知道如何组合「七种互动发动机」与「五轴强度旋钮」。单独安装后可按理论生成 Prompt。

本目录暂未自动绑定远程 MCP。想让模型自动抽取结构化结果，请在支持本地 stdio MCP 的客户端另行连接 `tools/bluntcore-mcp/server.mjs`；ChatGPT 网页版远程 MCP 需要自己托管 HTTPS 服务后注册，不能直接指向 GitHub Pages 或本地子进程。

- `plugin.json`：便携 Agent Plugin 清单
- `skills/play-and-mix/SKILL.md`：技能说明
- `.agents/plugins/marketplace.json`：仓库侧可选的 Codex 插件目录入口

网页供访客直接使用，MCP 供代理调用，Skill 负责教代理选择与运用。三者可以分别分享。

本仓库来源于沈嘟嘟的旧 DUDU-X 理论；不包含任何私人完整人物档案或历史会话。
