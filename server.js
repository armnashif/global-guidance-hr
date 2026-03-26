'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),https=require('https'),vm=require('vm');
const PORT=process.env.PORT||8000;
let compiled=null;
const LOADING='<!DOCTYPE html><html><head><meta charset="UTF-8"><meta http-equiv="refresh" content="10"><style>body{margin:0;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#eff6ff}.b{text-align:center;padding:40px}.s{width:50px;height:50px;border:5px solid #dbeafe;border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 20px}@keyframes spin{to{transform:rotate(360deg)}}</style></head><body><div class="b"><div class="s"></div><h2 style="color:#1e3a8a">Global Guidance HR</h2><p style="color:#6b7280">Starting up, please wait 30 seconds...</p></div></body></html>';
function get(u,n){n=n||0;if(n>5)return Promise.reject(new Error('too many redirects'));return new Promise(function(ok,fail){var r=https.get(u,function(res){if(res.statusCode>=300&&res.headers.location){res.resume();return get(res.headers.location,n+1).then(ok,fail);}var b=[];res.on('data',function(d){b.push(d);});res.on('end',function(){ok(Buffer.concat(b).toString());});});r.on('error',fail);r.setTimeout(120000,function(){r.destroy(new Error('timeout'));});});}
function compile(html){
  return get('https://unpkg.com/@babel/standalone@7.23.0/babel.min.js').then(function(code){
    console.log('Babel '+Math.round(code.length/1024)+'KB. Compiling...');
    var sb={console:console,process:{env:{}},setTimeout:setTimeout,clearTimeout:clearTimeout};
    sb.global=sb;
    vm.runInNewContext(code,sb);
    var B=sb.Babel;
    if(!B||!B.transform)throw new Error('Babel not found in sandbox');
    var tag='<script type="text/babel">';
    var si=html.indexOf(tag)+tag.length;
    var ei=html.indexOf('<'+'/script>',si);
    if(si<tag.length||ei<0)throw new Error('No babel script block');
    var jsx=html.slice(si,ei);
    console.log('JSX size: '+Math.round(jsx.length/1024)+'KB');
    var t=Date.now();
    var r=B.transform(jsx,{presets:[['react',{runtime:'classic'}],'env'],filename:'app.jsx',compact:true});
    console.log('Compiled in '+(Date.now()-t)+'ms');
    var cdn='    <script src="https://unpkg.com/@babel/standalone/babel.min.js"><'+'/script>\n';
    return html.replace(cdn,'').replace(tag+jsx+'<'+'/script>','<script>\n'+r.code+'\n<'+'/script>');
  });
}
var svr=http.createServer(function(req,res){
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
  res.end(compiled||LOADING);
});
svr.listen(PORT,'0.0.0.0',function(){
  console.log('Listening on '+PORT);
  var tmpl=path.join(__dirname,'src','template.html');
  var html=fs.readFileSync(tmpl,'utf8');
  if(!html.includes('type="text/babel"')){compiled=html;console.log('No JSX, serving directly');return;}
  console.log('Downloading Babel from CDN...');
  compile(html).then(function(c){compiled=c;console.log('READY - serving pre-compiled app!');}).catch(function(e){console.error('Compile failed:',e.message);compiled=html;});
});