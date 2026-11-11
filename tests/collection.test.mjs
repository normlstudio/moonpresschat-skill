import test from 'node:test';
import assert from 'node:assert/strict';
import {collectSite} from '../.claude/skills/moonpresschat-setup/helper/collect-site.mjs';
function fixture({live=false,noDraft=false,pending=false,error='',stalled=false}={}) {
 const calls=[];let n=0;
 const call=async(m,p,b)=>{calls.push([m,p,b]);if(p==='/setup/status')return {live};if(p==='/setup/collection')return {max_pages:3,index:{url:'https://example.test/sitemap.xml'}};
 if(p.endsWith('/index'))return {index:{pending,error},rows:[{url:'https://example.test/contact'}]};
 if(noDraft&&n++===0)throw Object.assign(new Error('no draft'),{code:'moonpresschat_setup_no_draft'});
 return {collect:{fetched:stalled?0:++n,complete:!stalled&&n>=3},pages:[],digest:'source'};};return {calls,call};
}
const opts={capabilities:['collection']};
test('old servers make no collection requests',async()=>{const f=fixture();assert.equal((await collectSite(f.call)).supported,false);assert.equal(f.calls.length,0);});
test('existing small limit is preserved and resume is the default',async()=>{const f=fixture();const r=await collectSite(f.call,{...opts,refreshIndex:true});assert.equal(r.ready,true);assert.equal(r.configuration.max_pages,3);assert.deepEqual(f.calls[2][2],{resume:true});assert(!f.calls.some(c=>/apply|provider|go-live/.test(c[1])));});
test('no draft starts once; other failures do not restart',async()=>{const f=fixture({noDraft:true});assert.equal((await collectSite(f.call,opts)).complete,true);assert.deepEqual(f.calls[3][2],{});const g=fixture();const call=async(m,p,b)=>{if(p.endsWith('/collect'))throw Object.assign(new Error('denied'),{code:'http-403'});return g.call(m,p,b)};await assert.rejects(collectSite(call,opts),/denied/);});
test('public or unknown visibility blocks collection',async()=>{for(const live of [true,null]){const f=fixture({live});await assert.rejects(collectSite(f.call,opts),/hidden-visibility-required/);assert.equal(f.calls.length,1);}});
test('stalled collection and round cap never report completion',async()=>{const f=fixture({stalled:true});const r=await collectSite(f.call,{...opts,maxRounds:4});assert.equal(r.ready,false);assert(r.rounds<=4);});
test('index errors or pending work are not success despite HTTP200',async()=>{for(const settings of [{pending:true},{error:'fetch-failed'}]){const f=fixture(settings);assert.equal((await collectSite(f.call,{...opts,refreshIndex:true})).ready,false);}});
test('elapsed deadline stops before further collection and preserves progress',async()=>{const f=fixture();let time=0;const progress=[];const call=async(...args)=>{const value=await f.call(...args);time+=10;return value};await assert.rejects(collectSite(call,{...opts,maxDurationMs:45,now:()=>time,onProgress:p=>progress.push(p)}),/collection-deadline/);assert(progress.length>0);assert.equal(progress[0].ready,false);});
