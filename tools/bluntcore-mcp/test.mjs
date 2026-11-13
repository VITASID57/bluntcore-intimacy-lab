import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const server = fileURLToPath(new URL("./server.mjs",import.meta.url));
const child = spawn(process.execPath,[server],{stdio:["pipe","pipe","pipe"]});
let buffer="",nextId=0;const pending=new Map();
child.stdout.on("data",chunk=>{
  buffer+=chunk.toString("utf8");
  let idx;while((idx=buffer.indexOf("\n"))>=0){
    const line=buffer.slice(0,idx);buffer=buffer.slice(idx+1);if(!line.trim())continue;
    const message=JSON.parse(line);const fn=pending.get(message.id);if(fn){pending.delete(message.id);fn(message);}
  }
});
function call(method,params){
  return new Promise((resolve,reject)=>{
    const id=++nextId;
    const timer=setTimeout(()=>{pending.delete(id);reject(new Error("MCP timeout"));},4000);
    pending.set(id,v=>{clearTimeout(timer);resolve(v);});
    child.stdin.write(JSON.stringify({jsonrpc:"2.0",id,method,params})+"\n");
  });
}
try{
  const init=await call("initialize",{protocolVersion:"2024-11-05",capabilities:{},clientInfo:{name:"smoke-test",version:"1"}});
  assert.equal(init.result.serverInfo.name,"bluntcore-microtoys");
  const list=await call("tools/list",{});
  assert.equal(list.result.tools.length,4);
  const play=await call("tools/call",{name:"bluntcore_play_draw",arguments:{main:"rules",secondary:"roles",scene:"一封匿名信"}});
  const p=JSON.parse(play.result.content[0].text);
  assert.equal(p.main.name,"规则网");assert.equal(p.secondary.name,"身份场");assert.match(p.prompt,/匿名信/);
  const bad=await call("tools/call",{name:"bluntcore_play_draw",arguments:{main:"rules",secondary:"rules"}});
  assert.equal(bad.result.isError,true);
  const mixer=await call("tools/call",{name:"bluntcore_mixer_profile",arguments:{preset:"慢热贴近",levels:{mind:3,pace:2}}});
  const m=JSON.parse(mixer.result.content[0].text);
  assert.deepEqual(m.levels,{words:1,mind:3,power:1,pace:2,sense:1});
  const invalid=await call("tools/call",{name:"bluntcore_mixer_profile",arguments:{levels:{words:8}}});
  assert.equal(invalid.result.isError,true);
  console.log("BLUNTCORE MCP smoke test passed: initialize, list, draw, mixer and validation");
}finally{child.kill();}
