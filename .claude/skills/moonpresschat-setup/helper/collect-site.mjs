#!/usr/bin/env node
/** Collect public site evidence through the existing scoped credential helper. */
import {spawnSync} from 'node:child_process';
import {mkdtempSync, writeFileSync, rmSync, mkdirSync, realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const failure = code => Object.assign(new Error(code), {code});

export async function collectSite(call, {capabilities=[], restart=false, refreshIndex=false, maxRounds=20, maxDurationMs=300000, now=Date.now, onProgress=()=>{}}={}) {
  if (!capabilities.includes('collection')) return {supported:false, reason:'collection-capability-unavailable'};
  if (!Number.isInteger(maxRounds) || maxRounds<1 || maxRounds>100) throw failure('invalid-round-limit');
  if(!Number.isInteger(maxDurationMs)||maxDurationMs<1||maxDurationMs>600000)throw failure('invalid-duration-limit');
  const start=now(), transport=call;
  call=async(...args)=>{if(now()-start>=maxDurationMs)throw failure('collection-deadline');const result=await transport(...args);if(now()-start>=maxDurationMs)throw failure('collection-deadline');return result;};
  const status=await call('GET','/setup/status');
  if (status.live!==false) throw failure('hidden-visibility-required');
  const configuration=await call('GET','/setup/collection');
  let draft;
  try { draft=await call('POST','/setup/collection/collect',restart?{}:{resume:true}); }
  catch(e) {
    if(restart || e.code!=='moonpresschat_setup_no_draft') throw e;
    draft=await call('POST','/setup/collection/collect',{});
  }
  onProgress({supported:true,complete:false,ready:false,configuration,draft});
  let rounds=1, previous=-1;
  while(draft?.collect?.complete!==true && rounds<maxRounds) {
    const fetched=draft?.collect?.fetched;
    if(!Number.isInteger(fetched) || fetched<=previous) break;
    previous=fetched;
    draft=await call('POST','/setup/collection/collect',{resume:true});rounds++;
    onProgress({supported:true,complete:false,ready:false,configuration,draft});
  }
  const complete=draft?.collect?.complete===true;
  let index={status:'not-requested'};
  if(refreshIndex && complete) {
    if(!configuration.index?.url) index={status:'not-configured'};
    else {
      const response=await call('POST','/setup/collection/index',{});
      const state=response.index;
      index={status:state && state.error==='' && state.pending===false && Array.isArray(response.rows) && response.rows.length>0?'ready':'incomplete',response};
    }
  }
  return {supported:true,complete,rounds,configuration,draft,index,ready:complete && (!refreshIndex || index.status==='ready')};
}

async function main() {
 const [site,folder,...flags]=process.argv.slice(2);
 if(!site||!folder||flags.some(f=>!['--restart','--refresh-index'].includes(f)))throw failure('usage-site-output-directory-restart-refresh-index');
 const helper=fileURLToPath(new URL('./moonpresschat-setup-helper.mjs',import.meta.url));
 const temporary=mkdtempSync(join(tmpdir(),'moonpress-collect-'));
 try {
  const invoke=args=>{
   const p=spawnSync(process.execPath,[helper,...args],{encoding:'utf8',maxBuffer:8*1024*1024,timeout:150000});
   let data;try{data=JSON.parse(p.stdout);}catch{throw failure('setup-helper-failed');}
   if(p.status!==0)throw failure(/^[a-z0-9_-]+$/.test(data.body?.code||'')?data.body.code:'setup-request-failed');
   return data;
  };
  const preflight=invoke(['preflight',site]);
  if(!preflight.api_allowed)throw failure('setup-api-unavailable');
  const call=async(method,path,body)=>{
   const args=['call',site,method,path];
   if(body!==undefined){const file=join(temporary,'body.json');writeFileSync(file,JSON.stringify(body),{mode:0o600});args.push('--body',file);}
   return invoke(args).body;
  };
  const output=resolve(folder);mkdirSync(output,{recursive:true,mode:0o700});
  const progress=value=>writeFileSync(join(output,'site-collection.json'),JSON.stringify(value,null,2)+'\n',{mode:0o600});
  const result=await collectSite(call,{onProgress:progress,capabilities:preflight.compatibility?.capabilities||[],restart:flags.includes('--restart'),refreshIndex:flags.includes('--refresh-index')});
  writeFileSync(join(output,'site-collection.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});
  console.log(JSON.stringify({supported:result.supported,complete:result.complete,ready:result.ready,index:result.index?.status,evidence:join(output,'site-collection.json')}));
  if(result.supported && !result.ready)process.exitCode=1;
 }finally{rmSync(temporary,{recursive:true,force:true});}
}
if(process.argv[1] && realpathSync(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(/^[a-z0-9_-]+$/.test(e.code||'')?e.code:'collection-failed');process.exitCode=1;});
