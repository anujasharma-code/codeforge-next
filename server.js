import "dotenv/config";
import express from "express";
import path from "path";
import crypto from "crypto";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1";
const DATA = path.join(__dirname, "data");
const USERS = path.join(DATA, "users.json");

await fs.mkdir(DATA, { recursive: true });
try { await fs.access(USERS); } catch { await fs.writeFile(USERS, "[]"); }

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.get("/", (_, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/style.css", (_, res) => res.sendFile(path.join(__dirname, "style.css")));
app.get("/app.js", (_, res) => res.sendFile(path.join(__dirname, "app.js")));

const sessions = new Map();

function cookie(name, value, maxAge = 86400000) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(maxAge/1000)}${secure}`;
}
function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || "").split(";").filter(Boolean).map(p => {
    const i=p.indexOf("="); return [p.slice(0,i).trim(), decodeURIComponent(p.slice(i+1))];
  }));
}
function session(req) {
  const sid = parseCookies(req).cf_session;
  return sid ? sessions.get(sid) : null;
}
function requireSession(req,res,next) {
  const s=session(req); if(!s) return res.status(401).json({error:"Sign in required"});
  req.session=s; next();
}
async function users() { return JSON.parse(await fs.readFile(USERS,"utf8")); }
async function saveUsers(u) { await fs.writeFile(USERS, JSON.stringify(u,null,2)); }
function safeName(name) { return String(name||"Main").replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,80); }

app.get("/api/health", (_,res)=>res.json({ok:true, service:"CodeForge", time:new Date().toISOString()}));

app.post("/api/auth/register", async (req,res)=>{
  const {name,email,password}=req.body||{};
  if(!name||!email||!password||password.length<6) return res.status(400).json({error:"Name, valid email and 6+ character password required"});
  const list=await users();
  if(list.some(u=>u.email.toLowerCase()===email.toLowerCase())) return res.status(409).json({error:"Email already registered"});
  const user={id:crypto.randomUUID(),name,email:email.toLowerCase(),password:await bcrypt.hash(password,12),createdAt:Date.now()};
  list.push(user); await saveUsers(list);
  const sid=crypto.randomUUID(); sessions.set(sid,{user:{id:user.id,name:user.name,email:user.email},createdAt:Date.now()});
  res.setHeader("Set-Cookie",cookie("cf_session",sid)); res.json({user:sessions.get(sid).user});
});
app.post("/api/auth/login", async (req,res)=>{
  const {email,password}=req.body||{}; const list=await users();
  const u=list.find(x=>x.email===String(email||"").toLowerCase());
  if(!u || !(await bcrypt.compare(password||"",u.password))) return res.status(401).json({error:"Invalid email or password"});
  const sid=crypto.randomUUID(); sessions.set(sid,{user:{id:u.id,name:u.name,email:u.email},createdAt:Date.now()});
  res.setHeader("Set-Cookie",cookie("cf_session",sid)); res.json({user:sessions.get(sid).user});
});
app.post("/api/auth/logout",(req,res)=>{
  const sid=parseCookies(req).cf_session; if(sid) sessions.delete(sid);
  res.setHeader("Set-Cookie",cookie("cf_session","",-1)); res.json({ok:true});
});
app.get("/api/me",(req,res)=>{
  const current=session(req);
  res.json({user:current?.user||null,github:current?.github||null});
});
app.get("/api/config",(_,res)=>res.json({
  aiConfigured:Boolean(process.env.GEMINI_API_KEY),
  githubConfigured:Boolean(process.env.GITHUB_CLIENT_ID&&process.env.GITHUB_CLIENT_SECRET)
}));

function ghHeaders(token) {
  return { Authorization:`Bearer ${token}`, Accept:"application/vnd.github+json", "X-GitHub-Api-Version":"2022-11-28", "User-Agent":"CodeForge-Studio" };
}
app.get("/auth/github",(req,res)=>{
  if(!process.env.GITHUB_CLIENT_ID||!process.env.GITHUB_CLIENT_SECRET) return res.redirect("/?github=missing");
  const state=crypto.randomBytes(24).toString("hex");
  const sid=crypto.randomUUID(); sessions.set(sid,{createdAt:Date.now(),oauthState:state});
  res.setHeader("Set-Cookie",cookie("cf_oauth",sid,600000));
  const p=new URLSearchParams({client_id:process.env.GITHUB_CLIENT_ID,redirect_uri:process.env.GITHUB_CALLBACK_URL||`http://localhost:${PORT}/auth/github/callback`,scope:"read:user user:email repo",state});
  res.redirect("https://github.com/login/oauth/authorize?"+p);
});
app.get("/auth/github/callback",async(req,res)=>{
  try{
    const osid=parseCookies(req).cf_oauth; const s=osid&&sessions.get(osid);
    if(!s || !req.query.state || req.query.state!==s.oauthState) return res.status(400).send("Invalid OAuth state");
    const tokenRes=await fetch("https://github.com/login/oauth/access_token",{
      method:"POST",headers:{"Accept":"application/json","Content-Type":"application/json"},
      body:JSON.stringify({client_id:process.env.GITHUB_CLIENT_ID,client_secret:process.env.GITHUB_CLIENT_SECRET,code:req.query.code,redirect_uri:process.env.GITHUB_CALLBACK_URL||`http://localhost:${PORT}/auth/github/callback`})
    });
    const token=await tokenRes.json(); if(!token.access_token) throw new Error(token.error_description||"GitHub token exchange failed");
    const meRes=await fetch("https://api.github.com/user",{headers:ghHeaders(token.access_token)});
    const me=await meRes.json();
    const emailsRes=await fetch("https://api.github.com/user/emails",{headers:ghHeaders(token.access_token)});
    const emails=emailsRes.ok?await emailsRes.json():[];
    const email=emails.find(e=>e.primary)?.email||`${me.login}@github.local`;
    const sid=crypto.randomUUID();
    sessions.set(sid,{user:{id:`gh_${me.id}`,name:me.name||me.login,email},githubToken:token.access_token,github:{login:me.login,avatar:me.avatar_url},createdAt:Date.now()});
    res.setHeader("Set-Cookie",cookie("cf_session",sid)); res.redirect("/?github=connected");
  }catch(e){res.status(500).send(`GitHub sign-in failed: ${e.message}`)}
});

async function gh(req, endpoint, options={}) {
  if(!req.session?.githubToken) throw new Error("Connect GitHub first");
  const r=await fetch("https://api.github.com"+endpoint,{...options,headers:{...ghHeaders(req.session.githubToken),...(options.headers||{})}});
  const data=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data.message||`GitHub error ${r.status}`);
  return data;
}
app.get("/api/github/repos",requireSession,async(req,res)=>{
  try{res.json(await gh(req,"/user/repos?sort=updated&per_page=100"));}catch(e){res.status(400).json({error:e.message});}
});
app.get("/api/github/branches/:owner/:repo",requireSession,async(req,res)=>{
  try{res.json(await gh(req,`/repos/${encodeURIComponent(req.params.owner)}/${encodeURIComponent(req.params.repo)}/branches?per_page=100`));}catch(e){res.status(400).json({error:e.message});}
});
app.get("/api/github/tree/:owner/:repo",requireSession,async(req,res)=>{
  try{
    const branch=req.query.branch||"main";
    const data=await gh(req,`/repos/${encodeURIComponent(req.params.owner)}/${encodeURIComponent(req.params.repo)}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
    res.json(data.tree.filter(x=>x.type==="blob"));
  }catch(e){res.status(400).json({error:e.message});}
});
app.get("/api/github/file/:owner/:repo",requireSession,async(req,res)=>{
  try{
    const p=req.query.path||"";
    const branch=req.query.branch||"main";
    const data=await gh(req,`/repos/${encodeURIComponent(req.params.owner)}/${encodeURIComponent(req.params.repo)}/contents/${p.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(branch)}`);
    res.json({name:data.name,path:data.path,sha:data.sha,content:Buffer.from(data.content||"","base64").toString("utf8"),branch});
  }catch(e){res.status(400).json({error:e.message});}
});
app.put("/api/github/file",requireSession,async(req,res)=>{
  try{
    const {owner,repo,path:fp,branch,message,content,sha}=req.body||{};
    if(!owner||!repo||!fp||!message) return res.status(400).json({error:"owner, repo, path and commit message required"});
    const body={message,content:Buffer.from(content||"","utf8").toString("base64"),branch:branch||"main"};
    if(sha) body.sha=sha;
    const data=await gh(req,`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${fp.split("/").map(encodeURIComponent).join("/")}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    res.json(data);
  }catch(e){res.status(400).json({error:e.message});}
});

function runProcess(command,args,input,timeout=8000) {
  return new Promise((resolve)=>{
    const p=spawn(command,args,{shell:false,windowsHide:true});
    let out="",err="",done=false;
    const finish=(result)=>{if(done)return;done=true;try{p.kill()}catch{};resolve(result)};
    p.stdout.on("data",d=>out+=d); p.stderr.on("data",d=>err+=d);
    p.on("error",e=>finish({ok:false,error:e.code==="ENOENT"?`Required runtime not found: ${command}`:e.message,stdout:out,stderr:err}));
    p.on("close",(code,signal)=>finish({ok:code===0,code,signal,stdout:out,stderr:err}));
    if(input) p.stdin.write(input); p.stdin.end();
    setTimeout(()=>finish({ok:false,error:"Execution timed out",stdout:out,stderr:err}),timeout);
  });
}
const tempRoot=path.join(DATA,"runs"); await fs.mkdir(tempRoot,{recursive:true});

app.post("/api/run",async(req,res)=>{
  const clientAddress = req.socket.remoteAddress;
  const isLoopback = clientAddress === "127.0.0.1" || clientAddress === "::1" || clientAddress === "::ffff:127.0.0.1";
  if(process.env.NODE_ENV === "production" || !isLoopback) {
    return res.status(503).json({error:"Code execution is disabled in production."});
  }
  const {language,code,input=""}=req.body||{};
  if(typeof code!=="string"||!code.trim()) return res.status(400).json({error:"Code is empty"});
  const id=crypto.randomUUID(), dir=path.join(tempRoot,id); await fs.mkdir(dir);
  try{
    let result;
    if(language==="javascript") result=await runProcess(process.platform==="win32"?"node":"node",["-e",code],input);
    else if(language==="python") result=await runProcess(process.platform==="win32"?"python":"python3",["-c",code],input);
    else if(language==="php"){
      const source=path.join(dir,"Main.php");
      await fs.writeFile(source,code);
      result=await runProcess("php",[source],input);
    } else if(language==="sql"){
      const sqlRunner=[
        "import sqlite3,sys",
        "connection=sqlite3.connect(':memory:')",
        "connection.execute('PRAGMA trusted_schema=OFF')",
        "def authorize(action,arg1,arg2,database,trigger):",
        "    if action in (sqlite3.SQLITE_ATTACH,sqlite3.SQLITE_DETACH): return sqlite3.SQLITE_DENY",
        "    if action==sqlite3.SQLITE_FUNCTION and (arg2 or '').lower()=='load_extension': return sqlite3.SQLITE_DENY",
        "    return sqlite3.SQLITE_OK",
        "connection.set_authorizer(authorize)",
        "sql=sys.stdin.read()",
        "statement=''",
        "for character in sql:",
        "    statement+=character",
        "    if character==';' and sqlite3.complete_statement(statement):",
        "        cursor=connection.execute(statement)",
        "        if cursor.description:",
        "            print(' | '.join(column[0] for column in cursor.description))",
        "            for row in cursor.fetchall(): print(' | '.join('NULL' if value is None else str(value) for value in row))",
        "        statement=''",
        "if statement.strip():",
        "    cursor=connection.execute(statement)",
        "    if cursor.description:",
        "        print(' | '.join(column[0] for column in cursor.description))",
        "        for row in cursor.fetchall(): print(' | '.join('NULL' if value is None else str(value) for value in row))"
      ].join("\n");
      result=await runProcess(process.platform==="win32"?"python":"python3",["-c",sqlRunner],code);
    } else if(language==="json"){
      try{
        JSON.parse(code);
        result={ok:true,stdout:"Valid JSON.",stderr:""};
      }catch(error){
        result={ok:false,stdout:"",stderr:`Invalid JSON: ${error.message}`};
      }
    }
    else if(language==="java"){
      const source=path.join(dir,"Main.java");
      await fs.writeFile(source,code); const c=await runProcess("javac",["-d",dir,source],"",10000);
      result=c.ok?await runProcess("java",["-cp",dir,"Main"],input):c;
    } else if(language==="c" || language==="cpp"){
      const src=path.join(dir,language==="c"?"main.c":"main.cpp"), exe=path.join(dir,process.platform==="win32"?"main.exe":"main");
      await fs.writeFile(src,code);
      const compiler=language==="c"?"gcc":"g++";
      const c=await runProcess(compiler,[src,"-O2","-o",exe],"",10000);
      result=c.ok?await runProcess(exe,[],input,5000):c;
    } else if(language==="html"||language==="css") {
      return res.status(400).json({error:"Use the live preview to run HTML and CSS."});
    } else return res.status(400).json({error:`Unsupported language: ${language||"not specified"}`});
    res.json(result);
  }catch(e){res.status(500).json({error:e.message})}
  finally{setTimeout(()=>fs.rm(dir,{recursive:true,force:true}).catch(()=>{}),5000)}
});

app.post("/api/ai",async(req,res)=>{
  const {action,code,language,context=""}=req.body||{};
  if(typeof action!=="string"||typeof code!=="string"||typeof language!=="string"||typeof context!=="string"){
    return res.status(400).json({error:"action, code, language and context must be strings"});
  }
  if(!process.env.GEMINI_API_KEY) return res.status(503).json({error:"AI is not configured. Add GEMINI_API_KEY to .env and restart the server."});
  try{
    const prompt=`You are CodeForge AI, a concise expert coding mentor. Action: ${action}. Language: ${language}. Context: ${context}. Code:\n${code}\nReturn practical answer with corrected code when useful.`;
    const model=process.env.GEMINI_MODEL||"gemini-2.5-flash";
    const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
      method:"POST",
      headers:{"Content-Type":"application/json","x-goog-api-key":process.env.GEMINI_API_KEY},
      body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}]})
    });
    const d=await r.json();
    if(!r.ok) return res.status(r.status).json({error:d.error?.message||"Gemini request failed"});
    const answer=d.candidates?.flatMap(candidate=>candidate.content?.parts||[]).map(part=>part.text).filter(Boolean).join("\n");
    res.json({answer:answer||"No AI text returned."});
  }catch(e){res.status(500).json({error:e.message})}
});
app.use((req,res)=>res.status(404).send("Not found"));
app.listen(PORT,HOST,()=>console.log(`CODEFORGE SERVER running at http://localhost:${PORT}`));
