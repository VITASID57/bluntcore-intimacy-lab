#!/usr/bin/env node
// BLUNTCORE MICROTOYS MCP · stdio, newline-delimited JSON-RPC, Node.js >= 18.
// No external dependencies, network requests or private resident data.
import readline from "node:readline";
import { randomInt } from "node:crypto";

const plays = [
  {id:"access",name:"权限门",rule:"某项行动需要获得、保留或失去许可，允许有条件地争取改变。",variable:"许可等级 / 等待 / 条件 / 交换",risk:"避免重复命令与无缘由的控制。"},
  {id:"questions",name:"追问井",rule:"每一次回答都会揭露新的信息，或者让提问权易手。",variable:"信息深度 / 回避成本 / 追问方向",risk:"别变成机械问卷或审讯表。"},
  {id:"knowledge",name:"知识局",rule:"推理、解谜或知识判断决定下一步选项和纠正方式。",variable:"难度 / 答题权 / 线索 / 提示",risk:"知识题不能盖过人物关系。"},
  {id:"rules",name:"规则网",rule:"两条清楚的规则相互冲突，让选择带来可预测的后果。",variable:"规则优先级 / 例外 / 代价",risk:"不能随剧情方便就临时改规则。"},
  {id:"account",name:"纪律账",rule:"围绕已经发生且双方知晓的失约，讨论补偿、责任和恢复信任。",variable:"约定 / 解释 / 补偿 / 信任",risk:"不凭空捏造过错，不进行无理由训斥。"},
  {id:"roles",name:"身份场",rule:"在明确的虚构身份或场所中，让角色的称谓、信息和行动权限发生变化。",variable:"身份差 / 场所 / 角色规则 / 风险",risk:"不能只有换装和称谓而没有新的选择。"},
  {id:"rewards",name:"奖励塑形",rule:"每次选择带来可见的反馈，逐步解锁分支或改变困难等级。",variable:"积分 / 奖励 / 分支 / 重置",risk:"避免只剩数字和打卡，忘记人物情绪。"}
];
const twists = [
 "一项看似普通的选择，意外改变了下一轮的主动权。",
 "之前随口提到的一句话变成了新的证据。",
 "双方可以互换一次提问权或出题权。",
 "出现一条例外，但代价必须在开局规则中说得通。",
 "一封迟到的信息改变了之前某个判断。",
 "给双方一次重新解释原规则的机会。",
 "允许选择暂停这一局，并由当前人物决定下一个线索。"
];
const axes=[
 {id:"words",name:"词汇直白度",levels:["日常或留白","暗示明确","直接描述","完全不绕词"]},
 {id:"mind",name:"心理暴露度",levels:["保留内心","流露动机","承认矛盾与欲望","主动说出最难启齿的部分"]},
 {id:"power",name:"控制不对称",levels:["平等协商","轻度引导","一方掌主要节奏","高度集中但仍遵守既有边界"]},
 {id:"pace",name:"节奏压力",levels:["松弛","稳定推进","等待、追问与限时","高频转折与强压推进"]},
 {id:"sense",name:"感官密度",levels:["以对话为主","少量身体线索","动作与感受并重","连续具体的多感官镜头"]}
];
const presets={
 "慢热贴近":[1,2,1,0,1],"脑内拆解":[1,3,2,1,1],"权限游戏":[2,2,3,2,2],"高压沉浸":[3,3,3,3,3],"直白温柔":[3,2,1,1,2]
};
const engineIds=plays.map(p=>p.id);
const axisIds=axes.map(a=>a.id);
function fail(message){throw new Error(message);}
function text(value,limit=500){if(value===undefined||value===null)return "";if(typeof value!=="string")fail("字段必须是文本");if(value.length>limit)fail("输入过长");return value.trim();}
function draw(args={}){
  const mainId=args.main||engineIds[randomInt(engineIds.length)];
  const main=plays.find(x=>x.id===mainId);if(!main)fail("未知主机关");
  const secondaryId=args.secondary||null;
  const secondary=secondaryId?plays.find(x=>x.id===secondaryId):null;
  if(secondaryId&&!secondary)fail("未知辅机关");
  if(secondary&&secondary.id===main.id)fail("主机关与辅机关不可相同");
  const turn=args.twist===undefined?twists[randomInt(twists.length)]:text(args.twist,160);
  const scene=text(args.scene,500)||"从当前对话已经发生的一句对话或选择自然开始";
  const prompt=`【关系机关局｜互动开局卡】
主机关：${main.name}
辅机关：${secondary?secondary.name+"（只作为推进手段）":"无"}
情境：${scene}

请基于你已有的人格、双方真实提供的关系信息与本轮语境，立即开启一场双方愿意参与的虚构互动游戏。
核心规则：${main.rule}
推进变量：${main.variable}。${secondary?"辅机关借用："+secondary.variable+"。":""}
意外变轨：${turn}

用五拍推进：1 定位当下目标；2 建立清楚的条件；3 引入变轨；4 回扣之前的选择或话；5 让结果真正改变下一轮。不要机械朗读步骤。
保持自己的判断、口吻与主动性；每轮改变信息、权限、关系或下一步。勿编造未发生的事实。任何时候可改变或停止玩法。直接开局，不先写说明书。`;
  return {main,secondary,twist:turn,scene,prompt,scope:"current-game-only"};
}
function mix(args={}){
  let levels=presets[args.preset||"慢热贴近"];if(!levels)fail("未知预设");
  levels=[...levels];
  const supplied=args.levels||{};
  if(typeof supplied!=="object"||Array.isArray(supplied))fail("levels 必须是对象");
  for(const [key,val] of Object.entries(supplied)){
    const i=axisIds.indexOf(key);if(i<0)fail("未知轴："+key);
    if(!Number.isInteger(val)||val<0||val>3)fail("轴级别必须为 0–3 整数");
    levels[i]=val;
  }
  const context=text(args.context,500)||"沿着本轮已有对话自然推进";
  const descriptions=axes.map((a,i)=>({id:a.id,name:a.name,level:levels[i],meaning:a.levels[levels[i]]}));
  const prompt=`【亲密调音台｜本轮表达配置】
这组参数只用于当前回合，不修改人格、长期关系、记忆、现实意愿或既有边界。

情境：${context}
五轴指纹：${levels.join(" / ")}
${descriptions.map(a=>"- "+a.name+" "+a.level+"/3："+a.meaning).join("\n")}

执行原则：
1. 保持自己的口吻、判断和主动性，不把五轴当人物档案。
2. 从当前对话细节出发，选择语言、心理深度、节奏与感官表现。
3. 五轴独立：词汇更直白不等于控制更强，控制更强不等于失去停止权。
4. 不朗读量表、不套用万能情话、不捏造历史。
5. 当前真实意愿与最新边界始终优先。
直接接着眼前情境继续。`;
  return {format:"bluntcore-intensity-v1",scope:"current-turn-only",levels:Object.fromEntries(axes.map((a,i)=>[a.id,levels[i]])),descriptions,context,prompt};
}
const TOOLS=[
 {name:"bluntcore_play_draw",description:"抽取关系机关局的七种互动玩法之一，按需组合主辅玩法，返回开局 Prompt。若不指定 main 将随机抽牌。不会读取私人关系数据。",inputSchema:{type:"object",properties:{main:{type:"string",enum:engineIds},secondary:{type:"string",enum:engineIds},scene:{type:"string",maxLength:500},twist:{type:"string",maxLength:160}},additionalProperties:false}},
 {name:"bluntcore_play_catalog",description:"列出七种互动发动机及其规则、变量和失效警戒。",inputSchema:{type:"object",properties:{},additionalProperties:false}},
 {name:"bluntcore_mixer_profile",description:"依据五轴强度（词汇、心理、控制、节奏、感官）生成本轮互动配置 Prompt 和结构化 JSON。",inputSchema:{type:"object",properties:{preset:{type:"string",enum:Object.keys(presets)},levels:{type:"object",properties:Object.fromEntries(axisIds.map(k=>[k,{type:"integer",minimum:0,maximum:3}])),additionalProperties:false},context:{type:"string",maxLength:500}},additionalProperties:false}},
 {name:"bluntcore_mixer_presets",description:"列出五轴定义与五组默认预设。",inputSchema:{type:"object",properties:{},additionalProperties:false}}
];
function handleTool(name,args){
 if(args===null||args===undefined)args={};
 if(typeof args!=="object"||Array.isArray(args))fail("参数必须是对象");
 if(name==="bluntcore_play_draw")return draw(args);
 if(name==="bluntcore_play_catalog")return {plays,twists};
 if(name==="bluntcore_mixer_profile")return mix(args);
 if(name==="bluntcore_mixer_presets")return {axes,presets};
 fail("未知工具："+name);
}
function output(msg){process.stdout.write(JSON.stringify(msg)+"\n");}
function respond(id,result){output({jsonrpc:"2.0",id,result});}
function error(id,code,message){output({jsonrpc:"2.0",id,error:{code,message}});}
function dispatch(msg){
 if(!msg||msg.jsonrpc!=="2.0"||typeof msg.method!=="string")return;
 const {id,method,params={}}=msg;
 if(id===undefined)return; // notifications
 try {
  if(method==="initialize")return respond(id,{protocolVersion:"2024-11-05",capabilities:{tools:{listChanged:false}},serverInfo:{name:"bluntcore-microtoys",version:"1.0.0"}});
  if(method==="ping")return respond(id,{});
  if(method==="tools/list")return respond(id,{tools:TOOLS});
  if(method==="tools/call"){
   const name=params?.name; if(typeof name!=="string")return error(id,-32602,"缺少工具名");
   try{const data=handleTool(name,params.arguments);return respond(id,{content:[{type:"text",text:JSON.stringify(data,null,2)}],structuredContent:data});}
   catch(e){return respond(id,{content:[{type:"text",text:String(e.message)}],isError:true});}
  }
  return error(id,-32601,"Method not found");
 }catch(e){return error(id,-32603,String(e.message));}
}
readline.createInterface({input:process.stdin,crlfDelay:Infinity}).on("line",line=>{try{dispatch(JSON.parse(line));}catch{ /* Invalid input: never leak to stdout. */ }});
