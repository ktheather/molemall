const encoder = new TextEncoder();
const COOKIE = 'molemall_beta_session';
const TTL = 60 * 60 * 12;
const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>두더지몰 비공개 베타</title>
<style>
body{font-family:system-ui,sans-serif;background:#f8eef4;min-height:100vh;display:grid;place-items:center;margin:0;color:#29232b}
.panel{background:white;border-radius:20px;box-shadow:0 10px 40px #0001;padding:32px;max-width:350px;width:calc(100% - 64px)}
h1{margin-top:0}
input,button{box-sizing:border-box;width:100%;padding:14px;margin-top:12px;border-radius:10px;font-size:16px}
input{border:1px solid #bbb}
button{border:0;background:#bd427d;color:white;font-weight:bold;cursor:pointer}
p{color:#666}
#error{color:#a0163d;min-height:1.4em}
</style>
</head>
<body>
<main class="panel">
<h1>두더지몰</h1>
<p>지인 전용 비공개 베타 테스트입니다.</p>
<form id="login">
<input id="password" type="password" autocomplete="current-password" placeholder="베타 비밀번호" required>
<button>입장하기</button>
</form>
<p id="error" role="alert"></p>
</main>
<script>
document.querySelector('#login').addEventListener('submit',async e=>{
e.preventDefault();
const btn=e.target.querySelector('button');
btn.disabled=true;
try{
const res=await fetch('/__beta/login',{
method:'POST',
headers:{'Content-Type':'application/json'},
body:JSON.stringify({password:document.querySelector('#password').value})
});
if(res.ok){location.replace('/');return;}
document.querySelector('#error').textContent=res.status===429?'잠시 후 다시 시도해 주세요.':'비밀번호가 올바르지 않습니다.';
}catch{
document.querySelector('#error').textContent='연결 오류가 발생했습니다.';
}
btn.disabled=false;
});
</script>
</body>
</html>`;
function response(body,status=200,headers={}) {return new Response(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}})}
function toBase64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function fromBase64(s){try{return Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4)),c=>c.charCodeAt(0))}catch{return null}}
async function sign(message,secret){const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return toBase64(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(message))))}
function constantEqual(a,b){if(a.length!==b.length)return false;let v=0;for(let i=0;i<a.length;i++)v|=a.charCodeAt(i)^b.charCodeAt(i);return v===0}
async function valid(cookie,secret){if(!cookie)return false;const dot=cookie.indexOf('.');if(dot<0)return false;const payload=cookie.slice(0,dot),mac=cookie.slice(dot+1);const bytes=fromBase64(payload);if(!bytes)return false;let data;try{data=JSON.parse(new TextDecoder().decode(bytes))}catch{return false}if(!Number.isSafeInteger(data.exp)||data.exp<Date.now()||data.exp>Date.now()+TTL*1000)return false;return constantEqual(mac,await sign(payload,secret))}
export async function onRequest(context){const {request,env}=context;const url=new URL(request.url);const path=url.pathname;const password=env.BETA_PASSWORD;const secret=env.BETA_SESSION_SECRET;
if(!password||!secret||secret.length<32)return response('Beta authentication is not configured.',503);
const cookies=request.headers.get('Cookie')||'';const cookie=cookies.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
if(path==='/__beta/login'&&request.method==='POST'){
 const type=request.headers.get('Content-Type')||'';if(!type.includes('application/json'))return response('Unsupported content type',415);
 let data;try{if(Number(request.headers.get('Content-Length')||0)>2048)return response('Too large',413);data=await request.json()}catch{return response('Invalid request',400)}
 if(typeof data?.password!=='string'||data.password.length>256||!constantEqual(data.password,password))return response('Unauthorized',401);
 const payload=toBase64(encoder.encode(JSON.stringify({exp:Date.now()+TTL*1000})));const token=payload+'.'+await sign(payload,secret);
 return response('OK',200,{'Set-Cookie':`${COOKIE}=${token}; Path=/; Max-Age=${TTL}; HttpOnly; Secure; SameSite=Lax`});
}
if(path==='/__beta/logout'){return response(null,302,{'Location':'/__beta/entry','Set-Cookie':`${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`})}
if(path==='/__beta/entry')return response(html,200,{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; base-uri 'none'"});
if(!await valid(cookie,secret)){
 if(request.method==='GET'&&request.headers.get('Accept')?.includes('text/html'))return response(null,302,{'Location':'/__beta/entry'});
 return response('Authentication required',401);
}
return context.next();
}


// Cloudflare Pages dashboard deployment adapter.
// The original beta middleware above is preserved without modification.
export default {
  fetch(request, env) {
    return onRequest({
      request,
      env,
      next: () => env.ASSETS.fetch(request),
    });
  },
};
