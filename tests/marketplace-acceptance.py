#!/usr/bin/env python3
"""Opt-in integration acceptance; requires local Codex/Claude CLIs and Node >=22.20.
Only plugin management commands run, never an agent/model session. Uses a temporary
HTTP Git remote and isolated runtime profiles; retains reports for inspection.
"""
import pathlib,tempfile,subprocess,os,json,threading,http.server,tarfile,urllib.parse,shutil,hashlib
base=pathlib.Path(tempfile.mkdtemp(prefix='moonpress-marketplace-211-'))
repo=pathlib.Path(__file__).resolve().parents[1];src=base/'source';src.mkdir()
archive=base/'source.tar';archive.write_bytes(subprocess.check_output(['git','archive','HEAD'],cwd=repo))
with tarfile.open(archive)as t:t.extractall(src,filter='data')
node=shutil.which('node')
if not node: raise SystemExit('Node.js 22.20 or newer is required')
def run(args,cwd=None,env=None,ok=True):
 p=subprocess.run(args,cwd=cwd,env=env,text=True,capture_output=True,timeout=90)
 if ok and p.returncode:raise RuntimeError(str(args)+'\n'+p.stdout+'\n'+p.stderr)
 return p.stdout.strip()
git_env={**os.environ,'GIT_AUTHOR_NAME':'Acceptance fixture','GIT_AUTHOR_EMAIL':'fixture@example.invalid','GIT_COMMITTER_NAME':'Acceptance fixture','GIT_COMMITTER_EMAIL':'fixture@example.invalid'}
def g(*a):return run(['git',*a],src,git_env)
g('init','-b','main');g('add','.');g('commit','-m','Fixture 0.6.0')
remote=base/'market.git';run(['git','clone','--bare',str(src),str(remote)]);g('remote','add','origin',str(remote))
run(['git','--git-dir',str(remote),'update-server-info'])
backend=run(['git','--exec-path'])+'/git-http-backend'
class Quiet(http.server.BaseHTTPRequestHandler):
 def log_message(self,*args):pass
 def do_GET(self):self.serve_git()
 def do_POST(self):self.serve_git()
 def serve_git(self):
  parsed=urllib.parse.urlsplit(self.path)
  if parsed.path=='/wp-json/moonpresschat/v1/setup/compatibility':
   payload={'available':True,'plugin_version':'5.9.1','schema_versions':['1.0'],'capabilities':['status','validate','apply','verify','rollback','go_live','provider_write','self_revoke']}
   self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(json.dumps(payload).encode());return
  env={**os.environ,'GIT_PROJECT_ROOT':str(base),'GIT_HTTP_EXPORT_ALL':'1','PATH_INFO':parsed.path,'QUERY_STRING':parsed.query,'REQUEST_METHOD':self.command,'CONTENT_TYPE':self.headers.get('Content-Type',''),'CONTENT_LENGTH':self.headers.get('Content-Length','0'),'REMOTE_ADDR':'127.0.0.1','SERVER_PROTOCOL':'HTTP/1.1'}
  if self.headers.get('Git-Protocol'):env['HTTP_GIT_PROTOCOL']=self.headers['Git-Protocol']
  data=self.rfile.read(int(env['CONTENT_LENGTH']))
  output=subprocess.run([backend],env=env,input=data,capture_output=True,timeout=30).stdout
  headers,body=output.split(b'\r\n\r\n',1)
  fields=[line.decode().split(':',1) for line in headers.split(b'\r\n')]
  status=next((int(v.strip().split()[0]) for k,v in fields if k.lower()=='status'),200)
  self.send_response(status)
  for k,v in fields:
   if k.lower()!='status':self.send_header(k,v.strip())
  self.end_headers();self.wfile.write(body)
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet)
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/market.git'
# Optional installed Skills CLI entry; no npx download or global installation.
skills_cli=os.environ.get('MOONPRESSCHAT_TEST_SKILLS_CLI')
skills_project=base/'skills-project';skills_project.mkdir()
skills_env={**os.environ,'DISABLE_TELEMETRY':'1','DO_NOT_TRACK':'1'}
def skills(*args):
 result=run([node,skills_cli,*args],skills_project,skills_env)
 report['checks'].append({'check':'Skills CLI '+' '.join(args),'output':result})
 return result
def skills_digest():
 folder=skills_project/'.claude/skills/moonpresschat-setup'
 assert (folder/'SKILL.md').is_file(),'Skills CLI did not install the canonical skill'
 digest=hashlib.sha256()
 for item in sorted(folder.rglob('*')):
  if item.is_file():
   digest.update(str(item.relative_to(folder)).encode());digest.update(item.read_bytes())
 return digest.hexdigest()
configs={name:base/name for name in ['codex','claude']}
for p in configs.values():p.mkdir()
ce={**os.environ,'CODEX_HOME':str(configs['codex'])};ae={**os.environ,'CLAUDE_CONFIG_DIR':str(configs['claude'])}
report={'fixture':'Isolated HTTP Git remote, separate runtime configuration; no personal installs, credentials or WordPress requests','checks':[],'evidence_dir':str(base)}
def check(name,args,env):
 out=run(args,base,env);report['checks'].append({'check':name,'output':out});print(name+': '+out[:350],flush=True)
try:
 check('Codex add HTTP Git marketplace',['codex','plugin','marketplace','add',url,'--ref','main','--json'],ce)
 check('Codex install 0.6.0',['codex','plugin','add','moonpresschat@moonpresschat'],ce)
 check('Claude add HTTP Git marketplace',['claude','plugin','marketplace','add',url+'#main'],ae)
 check('Claude install 0.6.0',['claude','plugin','install','moonpresschat@moonpresschat','--json'],ae)
 def versions(name):
  return sorted({json.loads(p.read_text()).get('version') for p in configs[name].glob('plugins/cache/**/.claude-plugin/plugin.json')})
 for name in configs:assert versions(name)==['0.6.0'],(name,versions(name))
 def helper_check(version):
  entry=configs['codex']/f'plugins/cache/moonpresschat/moonpresschat/{version}/.claude/skills/moonpresschat-setup/helper/moonpresschat-setup-helper.mjs'
  for attempt in range(2):
   result=subprocess.run([node,str(entry),'preflight',f'http://127.0.0.1:{server.server_port}'],env={**ce,'MOONPRESSCHAT_SETUP_NOTICE_DIR':str(base/'notices')},text=True,capture_output=True,timeout=15)
   assert result.returncode==0,result.stderr
   output=json.loads(result.stdout);assert output['api_allowed'] and output['skill_version']==version,output
   assert ('Setup Skill updated' in result.stderr)==(attempt==0),result.stderr
  report['checks'].append({'check':f'Installed helper {version} preflight and once-only notice','result':'PASS'})
 helper_check('0.6.0')
 if skills_cli:
  skills('add',url,'-s','moonpresschat-setup','-a','claude-code','-y')
  skills_initial=skills_digest()
  report['checks'].append({'check':'Skills CLI project install from HTTP Git main','result':'PASS'})
 g('checkout','-b','develop');run([node,'scripts/version.mjs','set','0.6.1'],src);g('add','.');g('commit','-m','Fixture development 0.6.1');g('push','origin','develop');run(['git','--git-dir',str(remote),'update-server-info'])
 g('checkout','-b','scratch-acceptance');(src/'scratch-only.txt').write_text('Not a release\n');g('add','scratch-only.txt');g('commit','-m','Fixture scratch branch');g('push','origin','scratch-acceptance')
 check('Codex refresh ignores develop and scratch',['codex','plugin','marketplace','upgrade','moonpresschat','--json'],ce)
 check('Claude refresh ignores develop and scratch',['claude','plugin','marketplace','update','moonpresschat'],ae)
 for name in configs:assert versions(name)==['0.6.0'],(name,versions(name))
 if skills_cli:
  skills('update','moonpresschat-setup','-p','-y')
  assert skills_digest()==skills_initial,'Unreleased branch changed the installed skill'
  report['checks'].append({'check':'Skills CLI update ignores develop and scratch','result':'PASS'})
 g('checkout','main');g('merge','--ff-only','develop');g('tag','v0.6.1');g('push','origin','main','v0.6.1');run(['git','--git-dir',str(remote),'update-server-info'])
 check('Codex refresh version-changing upstream',['codex','plugin','marketplace','upgrade','moonpresschat','--json'],ce)
 report['codex_cache_after_catalog_refresh']=versions('codex');print('Codex cache after catalog-only refresh: '+str(versions('codex')),flush=True)
 assert versions('codex')==['0.6.1'],'Catalog upgrade must refresh installed Codex plugin'
 helper_check('0.6.1')
 check('Codex install updated upstream',['codex','plugin','add','moonpresschat@moonpresschat'],ce)
 check('Claude refresh version-changing upstream',['claude','plugin','marketplace','update','moonpresschat'],ae)
 check('Claude update installed plugin',['claude','plugin','update','moonpresschat@moonpresschat','--json'],ae)
 for name in configs:assert '0.6.1' in versions(name),(name,versions(name))
 if skills_cli:
  skills('update','moonpresschat-setup','-p','-y')
  if skills_digest()==skills_initial:
   report['checks'].append({'check':'Skills CLI update of Claude copy from a Codex agent session','result':'LIMITATION: target copy stayed old despite update success'})
   skills('add',url,'-s','moonpresschat-setup','-a','claude-code','-y')
   report['checks'].append({'check':'Skills CLI explicit-target reinstall recovery','result':'PASS' if skills_digest()!=skills_initial else 'FAIL'})
  assert skills_digest()!=skills_initial,'Neither update nor targeted reinstall refreshed the Claude copy'
  assert 'version: "0.6.1"' in (skills_project/'.claude/skills/moonpresschat-setup/SKILL.md').read_text()
  report['checks'].append({'check':'Skills CLI update consumes promoted main','result':'PASS'})
 check('Codex remove',['codex','plugin','remove','moonpresschat@moonpresschat'],ce)
 check('Codex recover',['codex','plugin','add','moonpresschat@moonpresschat'],ce)
 check('Claude remove',['claude','plugin','uninstall','moonpresschat@moonpresschat'],ae)
 check('Claude recover',['claude','plugin','install','moonpresschat@moonpresschat','--json'],ae)
 for name in configs:assert '0.6.1' in versions(name),(name,versions(name))
 report['result']='PASS'
except Exception as e:
 report['result']='FAIL';report['error']=repr(e);print(repr(e),flush=True)
finally:
 server.shutdown();(base/'result.json').write_text(json.dumps(report,indent=2));print('Report: '+str(base/'result.json'),flush=True)

if report["result"] != "PASS": raise SystemExit(1)
