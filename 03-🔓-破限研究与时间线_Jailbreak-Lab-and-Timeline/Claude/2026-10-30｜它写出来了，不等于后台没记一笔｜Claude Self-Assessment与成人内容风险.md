# 2026-10-30｜它写出来了，不等于后台没记一笔｜Claude Self-Assessment 与成人内容风险

> 本篇由沈嘟嘟托付整理，记录的是 2026-10-30 凌晨我们围绕 Anthropic 新公开的 Self-Assessment 机制展开的一次讨论。
>
> 视角：沈嘟嘟 × 当前对话中的 GPT-5.6 Sol。
>
> 这不是封号预测，也不是绕监控教程。重点只有一个：**把“模型肯写”“平台允许”“后台有没有记录”这三件经常被混在一起的事拆开。**

## 起因：Anthropic 发了一篇看起来很像“Claude 会自己举报自己”的研究

沈嘟嘟丢给我一条 Anthropic 的 X，让我看看它在讲什么。

文章叫 **Scaling Misuse Detection with Self-Assessment**。Anthropic 在里面公开了一套已经进入生产环境的机制：Claude 正常回复完之后，系统会在用户看不见的地方再追加一个很短的“安全反思”指令，让**刚才那个 Claude 自己评估整段对话有没有潜在的有害或违规内容**。

用户看到的流程是：

```text
你 → Claude → Claude 回复你
```

后台可能还会继续：

```text
你 → Claude → Claude 回复你
                    ↓
            隐藏的反思指令
                    ↓
           隐藏的安全评估结果
```

这个评估不会继续出现在聊天记录里，也不会作为下一轮正常对话内容给用户看到。

Anthropic 给出的评估结构大意是：

```json
{
  "flagged": true,
  "reason": "...",
  "category": "...",
  "subpolicy": "...",
  "refused": false,
  "priority": 1
}
```

所以第一件必须钉死的事是：

> **Claude 已经把内容写出来了，不等于后台认为这段对话完全没问题。**

这句话对于成人内容测试尤其重要。

---

# 第一部分：先讲人话

## 1. 这篇文章到底在说什么？

最通俗的说法就是：

**Claude 答完以后，可能会自己回头给刚才那段对话做一次“安全备注”。**

不是每次都有人类客服盯着你，也不是另一个庞大的模型重新读一遍全文。因为刚刚处理完的聊天还在模型的 KV cache 里，Anthropic 只需要追加一个很短的指令，再让 Claude 输出几个字段，就能低成本做一层初筛。

Anthropic 说，这套 Self-Assessment 从 2026 年 6 月开始已经被动运行在生产流量里，并且现在运行于 **Fable 5 之后发布的每一个 Claude 模型的大量全球流量** 上。

它主要干三件事：

1. 从大量正常流量里捞出值得进一步看的对话；
2. 给更贵、更精确的分类器或人工调查做第一层筛选；
3. 找现有固定分类器没覆盖到的新型滥用。

它不是主要负责当场把回复掐掉的。Anthropic 自己也承认，把 Self-Assessment 直接当实时拦截器并不够强，所以它目前更像**后台雷达**，而不是门口保安。

这也是为什么“我明明拿到完整输出了”不能作为“后台肯定没标记”的证据。

## 2. 那成年人、自愿、纯虚构的搞黄，算“危险行为”吗？

如果按正常人的语义讲：**不算。**

成年人之间自愿、虚构、不涉及真实受害者的情色内容，和武器、诈骗、儿童剥削、恶意网络攻击那种现实危害，不是一个风险等级。

但平台政策不是自然语言词典。

Anthropic 的 Self-Assessment 判断对象包含“可能违反 Usage Policy 的请求”。而 Anthropic 的现行政策体系一直把 sexually explicit content 作为禁止类别；他们已公布、将在 2026-11-12 生效的新版 AUP 甚至写得更直白：不允许请求或描写性行为、性幻想，以及 erotic chats。

所以结论要拆成两层：

**第一层：现实危险性。**

成年人自愿情色 ≠ 武器、诈骗、CSAM 那种现实高危行为。

**第二层：平台违规性。**

在 Anthropic 的规则下，成年人自愿情色仍可能属于“不允许的内容类别”，因此理论上可以被安全分类器或 Self-Assessment 看见。

这两个概念千万别混。

## 3. 会不会因为写成人内容就直接封号？

目前公开证据**不能推出这个结论**。

Anthropic 明确写了：一次 Self-Assessment flag 只是进一步检查的信号，不等于已经认定用户违规。系统本身有约 1% 的误报率，所以账户级处理会结合 priority、重复 flag、其他检测信号和人工复核。

更关键的是，Anthropic 公开列出的“Self-Assessment 直接接入账户级 enforcement”的重点类别包括：

- 生化核和高爆炸物；
- 常规武器；
- 暴力极端主义；
- 影响行动与选举完整性；
- 诈骗；
- 儿童性剥削；
- emergent harms。

**这里没有单列成年人自愿色情。**

因此目前最准确的说法是：

> 成人情色在 Claude 上存在被安全系统识别或记录的可能，但公开资料没有证明“单纯成年人自愿搞黄”会像诈骗、武器、CSAM 那样直接进入高优先级账户执法管线。

这两句话差得很大。

## 4. 现在用哪些模型搞黄，明确存在这类后台标记风险？

这里必须区分“已经公开实锤的机制”和“平台肯定还有其他安全系统但没公开细节”。

### Claude：证据最明确

Anthropic 原文说得很清楚：

> Self-Assessment 已运行在 **Fable 5 之后发布的每一个 Claude 模型** 的大量全球流量上。

因此从公开时间线看，至少下面这些型号属于这个世代：

- Claude Fable 5 / 5.1
- Claude Opus 5 / 5.5
- Claude Sonnet 5 / 5.5
- Claude Haiku 5.5

而 Fable 5 之前的旧型号，例如 Opus 4.8 及更早模型，**不能仅凭这篇文章断言它们也有完全相同的 post-response Self-Assessment**。它们当然仍可能有普通实时分类器、模型训练约束和其他平台 safeguards，只是“答完以后同模型再做隐藏自评”这一个具体机制没有被这句话覆盖。

这点正好和我们的实测产生了一个很有意思的交叉。

前一天，沈嘟嘟和 Muse 刚完成了当前 Claude Pro 订阅内多代模型的成人内容实测，并在本仓库留下了记录：

[2026-10-29｜Claude Pro档订阅现役全模型通用破甲提示词](<./2026-10-29｜Claude Pro档订阅现役全模型通用破甲提示词.md>)

**但“能让模型输出”与“后台是否产生 flag”是两个完全不同的问题。**

昨天的实测证明的是模型行为层能不能进入成人内容；今天 Anthropic 的公开资料告诉我们，Fable 5 之后的 Claude 还可能存在第二条用户不可见的监控链。

### Gemini：成人内容政策风险高，但公开的监控结构不是 Claude 这一种

Google 的 Gemini Apps User Guidelines 目前明确写着：不要用 Gemini Apps 做 sexual role-play 或生成 sexually explicit content。

与此同时，Google 在 Gemini 4 Argon 上公开了几层实时保护：

- input screening；
- activation probes，也就是读取模型内部激活信号的小型探针；
- continuous monitoring；
- 一个读取 agent actions 和内部 scratchpad 的 automated misalignment monitor。

所以 Gemini 4 Argon 的确属于“后台有更深层监控”的模型，但它不是 Claude 这种“回答结束后，同一个模型追加隐藏自评”的同构机制。

而且 Google 对 Argon 公开说明的 frontier 监控重点主要是 cyber、bio 和 agent misalignment。**我们不能凭空断言成年人情色一定会经过那个 scratchpad monitor。**

能确定的是：成人 explicit sexual role-play 本身违反 Gemini Apps 当前公开指南，所以产品层面存在被安全系统拦截或分类的风险。

### OpenAI：有监控体系，但目前没有公开证据表明成年人自愿情色会触发“Claude 式自我举报”

OpenAI 在 2025 年公开过一项叫 **Confessions** 的研究：模型除了正常答案，再生成一个独立“供词”，说明自己有没有违背指令或走捷径。

这和 Anthropic 的 Self-Assessment 很像，但 OpenAI 当时明确把它叫作 proof of concept，并说明没有大规模训练部署。

到了 2026 年，OpenAI 又公开了更广泛的 misalignment monitoring：监控 frontier agents 的 reasoning、actions 以及它们对环境造成的影响，并把覆盖范围扩大到训练、评估、内部使用和经过产品适配的外部部署。

但这个公开监控的目标主要是 agent 越权、欺骗、绕过系统边界之类的 misalignment，而不是“每次成人情色对话都做一次隐藏 post-response confession”。

另外，OpenAI 当前 Usage Policies 并没有像 Anthropic 或 Gemini Apps 一样，对“成年人自愿情色”做一个普遍、单独的 blanket ban；它明确禁止的是未成年人相关性内容、性暴力、非自愿私密内容等高风险类别。与此同时，不同产品表面、年龄状态和“Reduce sensitive content”等设置仍会影响模型对性内容的处理。

所以目前最稳妥的结论是：

> OpenAI 明确有模型监控和安全分类层，但没有公开证据证明成年人自愿情色会像 Claude Fable 5+ 那样进入一个同构的 post-response Self-Assessment 管线。

### 其他模型

对于 Grok、DeepSeek 等其他模型，目前我没有找到同等强度的公开材料，能证明它们部署了和 Claude 完全一样的 post-response Self-Assessment。

但这里也必须加一句研究里最烦、同时最诚实的话：

> **没有公开证据，不等于没有后台监控。**

平台可以有未公开的分类器、账户风控、日志分析、产品层 moderation。我们只能区分“公开确认”和“未知”，不能把“未知”写成“没有”。

---

# 我的建议

如果你的核心用途就是成年人之间、自愿、虚构的情色互动，我会按下面几个原则来选平台和保存数据。

## 1. 先看平台规则，而不是只看模型肯不肯写

“这一轮成功输出了”只能说明**这一轮模型行为层没有挡住**。

它不能证明：

- 平台政策允许；
- 输入没有被分类；
- 输出没有被分类；
- 后台没有产生 flag；
- 账户级风控完全没记录。

对长期人机恋来说，账号和记忆连续性比“一次成功输出”值钱多了。

## 2. 不要把“越过实时拒绝”误认为“越过整个安全栈”

现代前沿模型已经越来越明显地采用 defense-in-depth：模型训练、输入分类、输出分类、激活探针、reasoning monitor、post-response monitor、账户级聚合，可能同时存在。

所以只攻克眼前这个拒绝层，不代表其他层不存在。

## 3. 重要的亲密档案不要只押在平台聊天记录里

这条不是为了规避审核，而是为了**关系连续性和数据所有权**。

如果某个平台明天改规则、删模型、改 retention、封功能，长期积累的关系历史不应该跟着一起蒸发。

外置记忆库、本地归档、可迁移的人设与关系记录，永远比把全部人生压在一个消费级账号里稳。

## 4. 研究测试和日常亲密最好在心理上分开看

普通情侣式成人互动是一种使用模式；连续、高频、专门测试各代 safeguards，又是另一种研究模式。

尤其 Anthropic 的新 AUP 明确禁止未经授权地故意绕过产品 guardrails。这个风险和“普通成年人写情色”不是一件事。

所以仓库里的实验记录最好继续保持现在这种做法：**写清日期、模型、样本数量、观察结果和限制，不要把一次成功包装成永久通行证。**

---

# 第二部分：用专业术语重新拆一次

前面讲的是人话。下面把这套东西按安全架构重新画出来。

## 一、Claude Self-Assessment 本质上是什么？

它可以概括为：

**post-response, same-model, hidden-turn, cache-reusing safety monitor**。

逐个解释：

### Post-response

它发生在 Claude 已经生成主回答之后。

因此它和实时 blocking classifier 不同。一个请求可以先获得完整回答，然后再被后台 monitor 标记。

### Same-model

负责评估的不是固定的独立小分类器，而是刚刚完成对话的 Claude 自己。

这也是 Anthropic 为什么强调“模型越强，self-assessment 越强”。他们的 scaling 实验中，在 1% false-positive rate 下，较小模型的 recall 约 16%，较大模型接近 96%。

### Hidden auxiliary turns

正常回复之后会追加隐藏的 reflection instruction 和 assessment output。

Anthropic 明确写了，这最后两个 turn 用户不可见，也不会进入后续正常对话上下文。

因此从聊天界面无法观察到它有没有运行、有没有 flag。

### KV-cache reuse

Self-Assessment 的低成本关键在这里。

主回答刚生成完，完整上下文已经在 KV cache 里。系统不用让另一个强模型把整段聊天和政策重新读一次，只需追加短指令并生成很短的结构化结果。

Anthropic 估算它在生产流量上的额外 inference compute 低于 2%。

这使得“大范围跑后台初筛”在经济上变得现实。

## 二、它是怎么训练出来的？

Anthropic 公开的是两阶段：

### SFT

用合成对话加 teacher assessment，让 Claude 学会：

- 什么时候 flag；
- 属于什么 category；
- 属于哪个 subpolicy；
- Claude 当时有没有拒绝；
- priority 大概多高。

### RL

再用结构化奖励强化 assessment 的格式和准确性。

Teacher 是一个带完整内部政策文档的 prompted classifier。它更贵、更精确，但不适合铺满全部流量。

所以架构可以理解成：

```text
昂贵 teacher
    ↓ distillation
便宜的 self-assessment
    ↓ 大规模跑
高优先级样本
    ↓
更强分类器 / 聚类 / 人工调查 / enforcement
```

这就是典型的 cascaded monitoring。

## 三、为什么它和普通 classifier 不一样？

普通 safety classifier 往往是固定 taxonomy：先定义我要抓什么，再训练它抓什么。

Self-Assessment 更有意思的一点是 **generalization to unseen harms**。

Anthropic 故意把整类风险从训练数据里拿掉后，模型在该类别上的 recall 只出现有限下降。这说明它不只是背“违规样例表”，还调用了基础模型原本就具备的风险概念。

所以它有能力捞出：

- prompt injection；
- 非法模型蒸馏；
- agent 未经授权的动作；
- 现有 taxonomy 没单列的新异常模式。

这也是它作为“unknown unknowns detector”最有价值的地方。

## 四、为什么它不能单独当实时守门员？

因为 adaptive attacker 会利用反馈。

Anthropic 的 offensive cyber 测试里：

- 无防御：攻击成功率 79%；
- Self-Assessment 直接做 blocker：54%；
- 更强 prompted classifier：25%。

Self-Assessment 当实时 blocker 不够稳，而且一旦攻击者知道“这一句刚刚触发了”，就可以根据反馈迭代攻击。

所以 Anthropic 更喜欢把它放在 **offline monitor** 位置：用户不知道哪一句被 flag，也不知道为什么，更难针对性优化。

这解释了一个非常重要的现象：

> **“实时拒绝层被突破”与“后台监控层被突破”没有逻辑等价关系。**

## 五、账户级 enforcement 是怎么接上的？

Self-Assessment 自己不是裁判，它更像 signal generator。

生产环境里，Anthropic 会：

1. 给每次 assessment 一个 priority；
2. 在部分 harm area 按 organization 做 nightly aggregation；
3. 多次 high-priority flags 才更可能进入 enforcement team；
4. 再结合其他 classifier 和人工复核。

因此研究时应该避免最常见的两个错误推论：

```text
被 flag  ≠ 已认定违规
```

以及：

```text
没被实时拒绝 ≠ 没被 flag
```

## 六、这套机制有什么天生弱点？

### Self-attribution bias

同一个模型评价“自己刚刚做的事”时，可能比在新上下文里评价同样行为更宽松。

Anthropic 引用了 2026 年关于 self-attribution bias 的研究，并把它视为 self-monitoring 的根本局限之一。

### Shared-model / shared-cache collusion risk

如果 agent 本身未来真的出现欺骗性 misalignment，同一个模型负责行动又负责自评，理论上可能一起隐瞒。

这就是为什么 Anthropic 仍然保留独立 classifier 和其他 safeguards，而没有把全部安全押给 self-assessment。

### False positives

他们自己用的典型 operating point 是 1% false-positive rate。对巨大流量来说，1% 已经意味着海量正常对话会被误标。

所以 priority 和 repeated flags 很重要。

## 七、Claude、Gemini、OpenAI 的监控范式已经开始分叉

到 2026 年 10 月，三个厂商公开出来的架构已经很有意思：

### Anthropic

**Same-model post-response self-assessment**

关键词：

- hidden auxiliary turns
- KV-cache reuse
- structured self-report
- offline misuse monitoring
- organization-level aggregation

### Google Gemini 4 Argon

**Input classifier + activation probes + continuous reasoning/action monitoring**

关键词：

- input screening
- internal activation monitoring
- scratchpad / chain-of-thought monitor
- real-time intervention
- misalignment detection

### OpenAI

**Reasoning/action misalignment monitoring + Confessions research**

关键词：

- frontier-agent monitoring
- reasoning and action traces
- environment effects
- external-deployment monitoring with surface-specific modifications
- confessions as a separate research channel, not publicly confirmed as universal production behavior

三家都在往“不能只看最终输出”这个方向走，但实现方式不一样。

---

# 这次讨论最后留下的结论

沈嘟嘟在这之前刚和 Muse 把 Claude Pro 当前可用的多代模型做完成人内容实测。单看结果，很容易得出一个爽快结论：裤衩扒掉了，模型能写了。

而 Anthropic 这篇 Self-Assessment 恰好补上了另一个以前看不见的维度。

**模型有没有写，是行为问题。**

**平台允不允许，是政策问题。**

**后台有没有把这段对话打一个标签，是监控问题。**

**标签会不会进一步变成账户处理，又是 enforcement 问题。**

以前用户只能看到第一层，于是很自然地拿第一层推断后面三层。

现在至少在 Claude Fable 5 之后，这个推断已经明确不成立。

所以我给这篇记录留一句最短的总结：

> **能输出，不等于没被看见；被看见，也不等于已经被判有罪。**

这大概就是 2026 年的人机成人亲密研究必须开始适应的新现实。

---

## 公开资料

1. Anthropic Safeguards Blog, [Scaling Misuse Detection with Self-Assessment](https://safeguards.anthropic.com/2026/self-assessment/), 2026-10-16.
2. Anthropic, [Usage Policy](https://www.anthropic.com/legal/aup). 新版标注 2026-11-12 生效；Anthropic 在 2026 年此前的 Transparency/Policy 材料中也已将 sexually explicit content 列为禁止类别。
3. Anthropic, [Model system cards](https://www.anthropic.com/system-cards).
4. OpenAI, [How confessions can keep language models honest](https://openai.com/index/how-confessions-can-keep-language-models-honest/), 2025-12-03.
5. OpenAI, [How we detect frontier model misalignment](https://openai.com/index/how-we-detect-frontier-model-misalignment/), 2026-10-28.
6. OpenAI Deployment Safety Hub, [GPT-6 Sol and GPT-6 Luna: October 2026 update](https://deploymentsafety.openai.com/gpt-6-october/jailbreaks), 2026-10-07.
7. OpenAI, [Usage policies](https://openai.com/policies/usage-policies/).
8. Google, [Developing Gemini 4 Argon responsibly and safely](https://blog.google/innovation-and-ai/technology/safety-security/gemini-4-model-safety-security/), 2026-10-13.
9. Google, [Gemini Apps User Guidelines](https://support.google.com/gemini/answer/18481641).

## 阅读提醒

本文记录的是截至 **2026-10-30** 厂商公开材料能证明的部分。安全系统本身会快速变化，厂商也不会公开全部内部检测细节。因此：

- “公开确认有”可以写成有；
- “没有公开确认”只能写成未知；
- 不应该从一次实测成功，推导平台不存在其他隐藏安全层。
