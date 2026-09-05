'use strict';
// Grok visual identity (xAI, Feb 2025 "singularity" mark by Jon Vio):
// monochrome true-black/white + Grok link blue. No honey-yellow gradients.
const HONEY='#EDEDEF', HONEY_D='#8E8E96', CREAM='#FFF6E4', INK='#0B0B0D', RED='#E5484D';
const GROK_BLUE='#1D9BF0';
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,k)=>a+(b-a)*k;
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const easeOutBack=p=>1+2.7*Math.pow(p-1,3)+1.7*Math.pow(p-1,2);

const EXPR={
  happy:    {label:'Happy',    eyes:'open', open:.72, pupil:1,   mouth:'smile', mw:1.05, curve:1,   blush:.45},
  excited:  {label:'Excited',  eyes:'open', open:1.25,pupil:.72, brow:.45, mouth:'grin', mw:1.05, blush:.6, spark:1},
  cool:     {label:'Cool',     eyes:'visor',                     mouth:'smile', mw:.8,  curve:.5},
  love:     {label:'In love',  eyes:'heart',                     mouth:'grin',  mw:1,   blush:1, hearts:1},
  wink:     {label:'Wink',     eyes:'wink', open:1, pupil:1,     mouth:'grin',  mw:.95, blush:.35},
  surprised:{label:'Shook',    eyes:'open', open:1.42,pupil:.72, brow:.5, mouth:'o'},
  sad:      {label:'Sad',      eyes:'open', open:.62, pupil:1, lookY:.55, brow:-.6, mouth:'frown', mw:.85, droop:1},
  sleepy:   {label:'Sleepy',   eyes:'open', open:.3,  pupil:.9, lookY:.3, lid:1, mouth:'o', mw:.55, droop:1},
  think:    {label:'Thinking', eyes:'open', open:.9,  pupil:1, lookX:.7, lookY:-.65, mouth:'flat', mw:.7, dots:1},
  neutral:  {label:'Neutral',  eyes:'open', open:1,   pupil:1,   mouth:'smile', mw:.8, curve:.4},
};

const OV={ /* transient overlays */
  wave:  {eyes:'open', open:.78, pupil:1, mouth:'smile', mw:1.1, curve:1.1, blush:.5},
  pet:   {eyes:'arc', blush:1, mouth:'smile', mw:.7, curve:.7},
  squish:{eyes:'arc', mouth:'flat', mw:.7},
  strain:{eyes:'open', open:1.18, pupil:1.15, brow:.3, mouth:'wavy', mw:.7},
  panic: {eyes:'open', open:1.45, pupil:.68, brow:.55, mouth:'wavy', mw:.8},
  poke:  {eyes:'open', open:1.42, pupil:.72, brow:.5, mouth:'o', mw:.55},
};

/* agent states -> signature face params */
const STATE_FACE={
  idle:null,
  thinking:{lookX:-.5, lookY:-.75, brow:.4, mouth:'flat', mw:.7, dots:1},
  searching:{eyes:'scan', mouth:'flat', mw:.6},
  coding:{open:.78, pupil:1.05, lookX:.3, lookY:.5, mouth:'flat', mw:.55},
  working:{open:1.02, brow:.5, pupil:.92, mouth:'flat', mw:.7},
  done:{open:1.18, pupil:.8, mouth:'grin', mw:1.1, blush:.55, spark:1},
  error:{eyes:'x', mouth:'wavy', mw:.85, droop:1},
  sleep:{eyes:'sleep', mouth:'o', mw:.42, droop:1},
};

/* the mini "code" he types while coding: [text, tokenKind] segments */
const CODE_POOL=[
  [['const ','k'],['c = ','o'],['forage()','f']],
  [['c.seal','f'],['({ ','o'],['hex: 6','n'],[' })','o']],
  [['if ','k'],['(!ok) ','o'],['retry()','f']],
  [['queen.deploy','f'],['(hive)','o']],
  [['return ','k'],['waggle(c)','f']],
];
const CODE_TOK={k:'#0B5FFF',f:'#111827',n:'#DC2626',o:INK};

/* ---------- shared draw primitives ---------- */
function hexPath(g,x,y,r,rot){
  g.beginPath();
  for(let i=0;i<6;i++){const a=rot+i/6*TAU,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;i?g.lineTo(px,py):g.moveTo(px,py);}
  g.closePath();
}
function rrect(g,x,y,w,h,r){
  g.beginPath();
  g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);
  g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();
}
function heartPath(g,x,y,s){
  g.beginPath();
  g.moveTo(x,y+s*0.34);
  g.bezierCurveTo(x-s*0.6,y-s*0.06,x-s*0.42,y-s*0.5,x,y-s*0.16);
  g.bezierCurveTo(x+s*0.42,y-s*0.5,x+s*0.6,y-s*0.06,x,y+s*0.34);
  g.closePath();
}
function star4(g,x,y,s){
  g.beginPath();
  g.moveTo(x,y-s);g.quadraticCurveTo(x,y,x+s,y);g.quadraticCurveTo(x,y,x,y+s);
  g.quadraticCurveTo(x,y,x-s,y);g.quadraticCurveTo(x,y,x,y-s);g.closePath();
}
function drawAntenna(g,R,ant,t,E){
  const by=-R*0.94, tx=ant.x, ty=by-R*0.52+(E.droop?R*0.24:0)+ant.y;
  g.lineCap='round';
  g.beginPath();g.moveTo(0,by);g.quadraticCurveTo(ant.x*0.35,by-R*0.34,tx,ty);
  g.lineWidth=R*0.105;g.strokeStyle=INK;g.stroke();
  g.beginPath();g.moveTo(0,by);g.quadraticCurveTo(ant.x*0.35,by-R*0.34,tx,ty);
  g.lineWidth=R*0.055;g.strokeStyle=HONEY;g.stroke();
  const pulse=E.dots?1+0.13*Math.sin(t*9):1;
  hexPath(g,tx,ty,R*0.145*pulse,t*0.7);
  g.fillStyle=HONEY_D;g.fill();g.lineWidth=R*0.035;g.strokeStyle=INK;g.stroke();
  if(E.dots){g.globalAlpha=0.22+0.22*Math.sin(t*9);hexPath(g,tx,ty,R*0.145*pulse,t*0.7);g.fillStyle=CREAM;g.fill();g.globalAlpha=1;}
}
function drawArm(g,R,side,angDeg){
  const sx=side*R*0.70, sy=R*0.13, len=R*0.62, a=angDeg*Math.PI/180;
  const hx=sx+side*Math.cos(a)*len, hy=sy+Math.sin(a)*len;
  g.lineCap='round';
  g.beginPath();g.moveTo(sx,sy);g.quadraticCurveTo(sx+side*len*0.46,sy-len*0.62,hx,hy);
  g.lineWidth=R*0.30;g.strokeStyle=INK;g.stroke();
  g.beginPath();g.moveTo(sx,sy);g.quadraticCurveTo(sx+side*len*0.46,sy-len*0.62,hx,hy);
  g.lineWidth=R*0.20;g.strokeStyle=HONEY;g.stroke();
}
function drawFace(g,R,E,lk,blink,t,talkOpen){
  const eyeY=-R*0.17, ex=R*0.42;
  const eyes=E.eyes||'open';
  g.lineCap='round';
  const openEye=x=>{
    const ry=R*0.195*(E.open??1)*(eyes==='open'?blink:1), rx=R*0.15;
    if(ry<R*0.035){
      g.beginPath();g.moveTo(x-rx,eyeY);g.quadraticCurveTo(x,eyeY+R*0.05,x+rx,eyeY);
      g.lineWidth=Math.max(2,R*0.04);g.strokeStyle=INK;g.stroke();return;
    }
    g.beginPath();g.ellipse(x+lk.x*R*0.03,eyeY+lk.y*R*0.03,rx,ry,0,0,TAU);
    g.fillStyle=CREAM;g.fill();g.lineWidth=R*0.032;g.strokeStyle=INK;g.stroke();
    g.save();g.beginPath();g.ellipse(x+lk.x*R*0.03,eyeY+lk.y*R*0.03,rx*0.95,ry*0.95,0,0,TAU);g.clip();
    const px=x+lk.x*R*0.085, py=eyeY+lk.y*R*0.085, pr=R*0.088*(E.pupil??1);
    g.beginPath();g.arc(px,py,pr,0,TAU);g.fillStyle=INK;g.fill();
    g.beginPath();g.arc(px-pr*0.32,py-pr*0.32,pr*0.32,0,TAU);g.fillStyle=CREAM;g.fill();
    g.restore();
    if(E.lid){g.beginPath();g.ellipse(x,eyeY,rx*0.99,ry*0.99,0,Math.PI,TAU);g.lineWidth=R*0.05;g.strokeStyle=INK;g.stroke();}
  };
  const arcEye=(x,down)=>{
    const r=R*0.13;
    g.beginPath();g.moveTo(x-r,eyeY+R*0.03);
    g.quadraticCurveTo(x,eyeY+(down?R*0.17:-R*0.19),x+r,eyeY+R*0.03);
    g.lineWidth=R*0.055;g.strokeStyle=INK;g.stroke();
  };
  const heartEye=x=>{
    const s=R*0.27;
    heartPath(g,x,eyeY,s);
    g.fillStyle=RED;g.fill();g.lineWidth=R*0.03;g.strokeStyle=INK;g.stroke();
    g.beginPath();g.arc(x-s*0.16,eyeY-s*0.14,R*0.03,0,TAU);g.fillStyle=CREAM;g.fill();
  };
  if(eyes==='open'){openEye(-ex);openEye(ex);}
  else if(eyes==='wink'){arcEye(-ex,false);openEye(ex);}
  else if(eyes==='arc'){arcEye(-ex,false);arcEye(ex,false);}
  else if(eyes==='sleep'){arcEye(-ex,true);arcEye(ex,true);}
  else if(eyes==='heart'){heartEye(-ex);heartEye(ex);}
  else if(eyes==='x'){
    [-ex,ex].forEach(x0=>{const s=R*0.085;
      g.lineWidth=R*0.055;g.strokeStyle=INK;
      g.beginPath();g.moveTo(x0-s,eyeY-s);g.lineTo(x0+s,eyeY+s);
      g.moveTo(x0+s,eyeY-s);g.lineTo(x0-s,eyeY+s);g.stroke();});
  }
  else if(eyes==='visor'||eyes==='scan'){
    const w=R*0.64,h=R*0.30;
    rrect(g,-w,eyeY-h/2,w*2,h,R*0.11);g.fillStyle=INK;g.fill();
    g.save();rrect(g,-w,eyeY-h/2,w*2,h,R*0.11);g.clip();
    if(eyes==='scan'){ /* sweeping Grok-blue radar visor */
      g.fillStyle='rgba(255,255,255,.10)';
      for(let gx=-w+R*0.10;gx<w;gx+=R*0.17)
        for(let gy=eyeY-h/2+R*0.07;gy<eyeY+h/2-R*0.04;gy+=R*0.13)g.fillRect(gx,gy,R*0.022,R*0.022);
      const sx=-w+((t*0.85)%1)*w*2;
      g.fillStyle='rgba(29,155,240,.28)';g.fillRect(sx-w*0.20,eyeY-h/2,w*0.20,h);
      g.fillStyle=GROK_BLUE;g.fillRect(sx-R*0.024,eyeY-h/2,R*0.048,h);
    }else{
      g.strokeStyle='rgba(255,246,228,.9)';g.lineWidth=R*0.045;
      g.beginPath();g.moveTo(-R*0.40,eyeY+R*0.02);g.lineTo(-R*0.22,eyeY-R*0.07);g.stroke();
      g.beginPath();g.moveTo(R*0.28,eyeY+R*0.05);g.lineTo(R*0.40,eyeY);g.stroke();
    }
    g.restore();
    g.lineWidth=R*0.032;g.strokeStyle=INK;rrect(g,-w,eyeY-h/2,w*2,h,R*0.11);g.stroke();
  }
  if(E.brow&&eyes!=='visor'&&eyes!=='scan'){
    const lift=E.brow>0?E.brow*R*0.11:0, tilt=E.brow<0?-E.brow:0, y=eyeY-R*0.30-lift;
    g.lineWidth=R*0.045;g.strokeStyle=INK;
    [[-ex,1],[ex,-1]].forEach(([x,sg])=>{g.beginPath();g.moveTo(x-sg*R*0.11,y);g.lineTo(x+sg*R*0.11,y-tilt*R*0.10);g.stroke();});
  }
  if(E.blush){
    g.fillStyle=`rgba(29,155,240,${0.35*E.blush})`;
    g.beginPath();g.ellipse(-R*0.62,R*0.10,R*0.105,R*0.055,-0.25,0,TAU);g.fill();
    g.beginPath();g.ellipse(R*0.62,R*0.10,R*0.105,R*0.055,0.25,0,TAU);g.fill();
  }
  const my=R*0.335;
  if(talkOpen>0.04){
    g.beginPath();g.ellipse(0,my,R*0.115,R*0.045+R*0.16*talkOpen,0,0,TAU);
    g.fillStyle=INK;g.fill();return;
  }
  const w=(E.mw??1)*R*0.30;
  g.strokeStyle=INK;g.lineWidth=Math.max(2,R*0.05);g.lineCap='round';g.fillStyle=INK;
  switch(E.mouth){
    case 'smile':
      g.beginPath();g.moveTo(-w,my-R*0.04);
      g.quadraticCurveTo(0,my+(E.curve??0.8)*R*0.20,w,my-R*0.04);g.stroke();break;
    case 'frown':
      g.beginPath();g.moveTo(-w,my+R*0.02);
      g.quadraticCurveTo(0,my-R*0.15,w,my+R*0.02);g.stroke();break;
    case 'grin':{
      g.beginPath();g.moveTo(-w,my-R*0.03);
      g.quadraticCurveTo(0,my+R*0.05,w,my-R*0.03);
      g.quadraticCurveTo(w*0.62,my+R*0.33,0,my+R*0.33);
      g.quadraticCurveTo(-w*0.62,my+R*0.33,-w,my-R*0.03);
      g.closePath();g.fill();
      g.save();g.clip();
      g.beginPath();g.ellipse(0,my+R*0.37,w*0.55,R*0.10,0,0,TAU);
      g.fillStyle='#E0685C';g.fill();g.restore();break;
    }
    case 'o':{const r=R*0.085*(E.mw??1)+R*0.02;
      g.beginPath();g.ellipse(0,my,r*0.85,r*1.15,0,0,TAU);g.fill();break;}
    case 'flat':
      g.beginPath();g.moveTo(-w,my);g.quadraticCurveTo(0,my+R*0.03,w,my);g.stroke();break;
    case 'wavy':{
      const n=8,ww=R*0.24;
      g.beginPath();g.moveTo(-ww,my);
      for(let i=1;i<=n;i++)g.lineTo(-ww+i/n*ww*2,my+Math.sin(i/n*Math.PI*2.2)*R*0.045);
      g.lineWidth=R*0.05;g.stroke();break;
    }
    default:
      g.beginPath();g.moveTo(-w*0.7,my);g.quadraticCurveTo(0,my+R*0.12,w*0.7,my);g.stroke();
  }
}
/* master renderer — blob + face in one call */
function renderBlob(g,o){
  const {x,y,R,E,t}=o, rim=o.rim, sq=o.sq??1, lean=o.lean??0, N=rim?rim.length:26;
  let lk;
  if(E.lookX!==undefined)lk={x:E.lookX,y:E.lookY||0};
  else{lk={x:(o.look&&o.look.x)||0,y:(o.look&&o.look.y)||0};lk.y+=E.lookY||0;}
  g.save();g.translate(x,y);
  if(o.stretch&&o.stretch.s>0.004){g.rotate(o.stretch.a);g.scale(1+o.stretch.s,1-o.stretch.s*0.85);g.rotate(-o.stretch.a);}
  g.rotate(lean);
  g.scale(1+(1-sq)*0.75,sq);
  drawAntenna(g,R,o.ant||{x:0,y:0},t,E);
  if(o.arms)o.arms.forEach(a=>drawArm(g,R,a.side,a.ang));
  const pt=i=>{
    const a=i/N*TAU;
    const r=rim?rim[i]:(1+0.02*Math.sin(3*a+t*1.6)+0.014*Math.sin(5*a-t*1.1)+0.008*Math.sin(8*a+t*2.3));
    return [Math.cos(a)*R*r,Math.sin(a)*R*r];
  };
  g.beginPath();
  const p0=pt(0),p1=pt(1);
  g.moveTo((p0[0]+p1[0])/2,(p0[1]+p1[1])/2);
  for(let i=1;i<=N;i++){const c=pt(i%N),n=pt((i+1)%N);g.quadraticCurveTo(c[0],c[1],(c[0]+n[0])/2,(c[1]+n[1])/2);}
  g.closePath();
  g.fillStyle=HONEY;g.fill();
  g.save();g.clip();
  let gr=g.createRadialGradient(-R*0.35,-R*0.5,R*0.05,-R*0.35,-R*0.5,R*1.3);
  gr.addColorStop(0,'rgba(255,255,255,.55)');gr.addColorStop(.55,'rgba(255,255,255,0)');
  g.fillStyle=gr;g.fillRect(-R*1.5,-R*1.5,R*3,R*3);
  gr=g.createLinearGradient(0,R*0.25,0,R*1.05);
  gr.addColorStop(0,'rgba(20,22,28,0)');gr.addColorStop(1,'rgba(20,22,28,.22)');
  g.fillStyle=gr;g.fillRect(-R*1.5,-R*1.5,R*3,R*3);
  /* Grok slash — the white-forward-slash mark, laid low across the belly so it never touches the face */
  g.save();
  g.translate(0,R*0.72);g.rotate(-0.5);g.globalAlpha=0.16;
  g.fillStyle=INK;
  g.fillRect(-R*0.55,-R*0.055,R*1.1,R*0.11);
  g.restore();
  g.restore();
  g.lineWidth=Math.max(2.2,R*0.042);g.strokeStyle=INK;g.stroke();
  drawFace(g,R,E,lk,o.blink??1,t,o.talk||0);
  g.restore();
}

/* ---------- per-state overlay art (relative to blob center) ---------- */
function drawThinkingFX(g,R,t){
  for(let i=0;i<3;i++){
    const a=t*3.2+i*TAU/3;
    g.beginPath();g.arc(Math.cos(a)*R*0.30,-R*1.42+Math.sin(a)*R*0.10,R*0.032+R*0.018*Math.sin(t*6+i),0,TAU);
    g.fillStyle=HONEY_D;g.fill();
  }
}
function drawSearchFX(g,R,t){
  const mx=Math.sin(t*1.9)*R*0.85, my=R*0.28+Math.sin(t*3.7)*R*0.14;
  g.save();g.translate(mx,my);g.rotate(Math.sin(t*1.9+1.2)*0.18);
  const lr=R*0.30;
  g.lineCap='round';
  g.beginPath();g.moveTo(lr*0.72,lr*0.72);g.lineTo(lr*1.45,lr*1.45);
  g.lineWidth=R*0.10;g.strokeStyle=INK;g.stroke();
  g.beginPath();g.moveTo(lr*0.72,lr*0.72);g.lineTo(lr*1.38,lr*1.38);
  g.lineWidth=R*0.055;g.strokeStyle=HONEY;g.stroke();
  g.beginPath();g.arc(0,0,lr,0,TAU);g.fillStyle='rgba(255,246,228,.28)';g.fill();
  g.lineWidth=R*0.055;g.strokeStyle=INK;g.stroke();
  g.beginPath();g.arc(-lr*0.32,-lr*0.32,lr*0.5,Math.PI*1.05,Math.PI*1.55);
  g.lineWidth=R*0.045;g.strokeStyle='rgba(255,255,255,.75)';g.stroke();
  const pulse=0.6+0.4*Math.sin(t*5);
  hexPath(g,0,0,lr*0.32*pulse+lr*0.10,t*0.8);
  g.fillStyle=GROK_BLUE;g.fill();g.lineWidth=R*0.03;g.strokeStyle=INK;g.stroke();
  g.restore();
}
function drawCodeWindow(g,R,t,lines){
  g.save();g.translate(R*0.62,R*0.42);g.rotate(-0.06);
  const w=R*1.9,h=R*1.5;
  rrect(g,-w/2+R*0.05,-h/2+R*0.06,w,h,R*0.12);g.fillStyle='rgba(0,0,0,.22)';g.fill();
  rrect(g,-w/2,-h/2,w,h,R*0.12);g.fillStyle=CREAM;g.fill();
  g.lineWidth=R*0.045;g.strokeStyle=INK;g.stroke();
  g.beginPath();g.moveTo(-w/2,-h/2+R*0.30);g.lineTo(w/2,-h/2+R*0.30);
  g.lineWidth=R*0.028;g.strokeStyle='rgba(36,27,14,.25)';g.stroke();
  [-w/2+R*0.16,-w/2+R*0.33,-w/2+R*0.50].forEach((x,i)=>{
    g.beginPath();g.arc(x,-h/2+R*0.15,R*0.05,0,TAU);g.fillStyle=[RED,GROK_BLUE,'#9CC177'][i];g.fill();
  });
  g.font=`600 ${R*0.128}px 'IBM Plex Mono',monospace`;g.textBaseline='middle';
  lines.forEach((ln,i)=>{
    const y=-h/2+R*0.52+i*R*0.235;
    g.fillStyle='rgba(36,27,14,.35)';g.fillText(String(i+1),-w/2+R*0.10,y);
    let x=-w/2+R*0.32, left=ln.shown;
    for(const [txt,kind] of ln.segs){
      if(left<=0)break;
      const s=txt.slice(0,Math.floor(left));left-=txt.length;
      g.fillStyle=CODE_TOK[kind]||INK;g.fillText(s,x,y);
      x+=g.measureText(s).width;
    }
    if(i===lines.length-1&&ln.shown<ln.total&&(t*2.4)%1<0.62){
      g.fillStyle=INK;g.fillRect(x+R*0.02,y-R*0.065,R*0.05,R*0.13);
    }
  });
  g.restore();
}
function drawTypingArms(g,R,t){
  const bL=Math.sin(t*13)*R*0.06, bR=Math.sin(t*13+2.4)*R*0.06;
  g.lineCap='round';
  [[-1,bL,R*0.22],[1,bR,R*0.98]].forEach(([s,b,hx])=>{
    const sx=s*R*0.52, sy=R*0.16, hy=R*0.78+b, cx=(sx+hx)/2+s*R*0.10, cy=(sy+hy)/2-R*0.18;
    g.beginPath();g.moveTo(sx,sy);g.quadraticCurveTo(cx,cy,hx,hy);
    g.lineWidth=R*0.15;g.strokeStyle=INK;g.stroke();
    g.beginPath();g.moveTo(sx,sy);g.quadraticCurveTo(cx,cy,hx,hy);
    g.lineWidth=R*0.095;g.strokeStyle=HONEY;g.stroke();
    g.beginPath();g.arc(hx,hy,R*0.07,0,TAU);g.fillStyle=HONEY;g.fill();
    g.lineWidth=R*0.03;g.strokeStyle=INK;g.stroke();
  });
}
function drawWorkingFX(g,R,t){
  g.beginPath();g.arc(0,0,R*1.32,0,TAU);
  g.lineWidth=R*0.045;g.strokeStyle='rgba(255,246,228,.13)';g.stroke();
  const a0=t*2.4;
  g.beginPath();g.arc(0,0,R*1.32,a0,a0+1.5);
  g.lineWidth=R*0.075;g.lineCap='round';g.strokeStyle=HONEY;g.stroke();
  g.save();g.translate(Math.cos(a0+1.5)*R*1.32,Math.sin(a0+1.5)*R*1.32);g.rotate(-t*3);
  hexPath(g,0,0,R*0.14,0);g.fillStyle=HONEY_D;g.fill();
  g.lineWidth=R*0.035;g.strokeStyle=INK;g.stroke();
  hexPath(g,0,0,R*0.06,0);g.fillStyle=INK;g.fill();
  g.restore();
}
function drawDoneFX(g,R,age){
  const p=Math.min(1,age/0.45), br=R*0.30*Math.max(0,easeOutBack(p));
  if(br<1)return;
  g.save();g.translate(R*1.0,-R*1.05);
  g.beginPath();g.arc(0,0,br,0,TAU);g.fillStyle=HONEY;g.fill();
  g.lineWidth=R*0.05;g.strokeStyle=INK;g.stroke();
  const cp=clamp((age-0.25)/0.35,0,1);
  g.beginPath();g.moveTo(-br*0.45,br*0.02);
  if(cp>0)g.lineTo(-br*0.12,br*0.38*Math.min(1,cp*2));
  if(cp>0.5){const k=(cp-0.5)*2;g.lineTo(-br*0.12+br*0.62*k,br*0.38-br*0.72*k);}
  g.lineWidth=R*0.075;g.lineCap='round';g.strokeStyle=INK;g.stroke();
  g.restore();
}
function drawErrorFX(g,R,age){
  const br=R*0.27*Math.max(0,easeOutBack(Math.min(1,age/0.4)));
  if(br<1)return;
  g.save();g.translate(-R*1.0,-R*1.02);
  g.beginPath();g.arc(0,0,br,0,TAU);g.fillStyle=RED;g.fill();
  g.lineWidth=R*0.05;g.strokeStyle=INK;g.stroke();
  g.fillStyle=CREAM;
  rrect(g,-br*0.09,-br*0.62,br*0.18,br*0.78,br*0.09);g.fill();
  g.beginPath();g.arc(0,br*0.44,br*0.11,0,TAU);g.fill();
  g.restore();
}

/* ---------- tiny synth (no assets) ---------- */
let AC=null,soundOn=true;
function ac(){try{if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();}catch(e){}return AC;}
function blip(f0,f1,dur,vol=0.05,type='sine'){
  if(!soundOn||!ac())return;
  const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();
  o.type=type;o.frequency.setValueAtTime(f0,t);
  o.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0008,t+dur);
  o.connect(g).connect(AC.destination);o.start(t);o.stop(t+dur+0.03);
}
const pluck=(f,v=0.045)=>blip(f,f*0.99,0.17,v,'triangle');

/* ================= the engine ================= */
class HexEngine{
  constructor(host,opts={}){
    this.host=typeof host==='string'?document.querySelector(host):host;
    this.o=Object.assign({w:240,h:212,autoSleep:0,calm:false},opts);
    this.ev={};
    HexEngine._css();
    this.host.classList.add('hex-host');
    this.cnv=document.createElement('canvas');
    this.cnv.className='hex-canvas';
    this.cnv.style.width=this.o.w+'px';this.cnv.style.height=this.o.h+'px';
    this.cnv.style.touchAction='none';
    this.host.appendChild(this.cnv);
    this.ctx=this.cnv.getContext('2d');
    const d=this.dpr=Math.min(2,devicePixelRatio||1);
    this.cnv.width=this.o.w*d;this.cnv.height=this.o.h*d;
    this.W=this.o.w;this.H=this.o.h;
    this.R=clamp(Math.min(this.W,this.H)*0.34,40,140);
    this.cx0=this.W/2;this.cy0=this.H*0.54;

    this.N=26;
    this.rim=new Array(this.N).fill(1);this.rimV=new Array(this.N).fill(0);
    this.pos={x:this.cx0,y:this.cy0};this.vel={x:0,y:0};this.home={x:this.cx0,y:this.cy0};
    this.sq=1;this.sqV=0;this.lean=0;
    this.blinkA=0;this.nextBlink=1600;this.blink=1;
    this.look={x:0,y:0};this.ant={x:0,y:0,vx:0,vy:0};
    this.mouse={x:-9999,y:-9999};this.mspd=0;
    this.drag=false;this.dragT=0;this.moved=0;this.pStart=null;this.grabOff={x:0,y:0};
    this.pet=0;this.pokeT=0;this.landT=0;this.waveA=0;
    this.parts=[];this.talking=false;
    this.base='happy';this._state='idle';this.stateT0=0;
    this.lastAct=performance.now();
    this.cl=[];this.clI=0;this.clT=0;this.tickT=0;
    this.dotT=0;this.zT=0;this.pingT=0;this.chugT=0;this.humT=0;this.hT=0;
    this.frames=0; /* painted-frame heartbeat for host blank-canvas detection */

    this._bind();
    this.last=performance.now();
    this._loop=this._loop.bind(this);
    this.raf=requestAnimationFrame(this._loop);
  }
  static _css(){
    if(document.getElementById('hex-engine-styles'))return;
    const s=document.createElement('style');s.id='hex-engine-styles';
    s.textContent=
`.hex-host{position:relative}
.hex-canvas{position:absolute;left:0;top:0;display:block}
.hex-bubble{position:absolute;z-index:6;max-width:230px;pointer-events:none;background:#FFF6E4;color:#241B0E;border:1.5px solid #241B0E;border-radius:13px;padding:8px 12px 9px;font:600 12.5px/1.35 'Bricolage Grotesque','Segoe UI',sans-serif;box-shadow:3px 4px 0 rgba(0,0,0,.28);opacity:0;transform:scale(.85);transform-origin:0 100%;transition:opacity .22s,transform .22s}
.hex-bubble.on{opacity:1;transform:scale(1)}
.hex-bubble.hex-flip{transform-origin:100% 100%}
.hex-bubble:after{content:'';position:absolute;left:18px;bottom:-7px;width:11px;height:11px;background:#FFF6E4;border-right:1.5px solid #241B0E;border-bottom:1.5px solid #241B0E;transform:rotate(45deg)}
.hex-bubble.hex-flip:after{left:auto;right:18px}`;
    document.head.appendChild(s);
  }
  on(e,f){(this.ev[e]=this.ev[e]||[]).push(f);return this;}
  emit(e,v){(this.ev[e]||[]).forEach(f=>f(v));}

  /* ---------- public API ---------- */
  get state(){return this._state;}
  setState(s){
    if(!STATE_FACE.hasOwnProperty(s))return;
    const prev=this._state;
    if(prev===s&&s!=='idle'){this.lastAct=performance.now();return;}
    this._state=s;this.stateT0=performance.now()/1000;this.lastAct=performance.now();
    this.waveA=0;
    if(s==='done'){
      this.vel.y-=5.0;this.sqV-=0.14;
      const n=this.o.calm?10:26;
      for(let i=0;i<n;i++)this.parts.push({type:'confetti',x:this.pos.x+rnd(-this.R,this.R),y:this.pos.y-this.R*0.5,
        vx:rnd(-0.16,0.16),vy:rnd(-0.26,-0.08),rot:rnd(0,TAU),vr:rnd(-0.01,0.01),s:rnd(3,6.5),
        col:pick([HONEY,CREAM,GROK_BLUE,HONEY_D,'#FFFFFF']),life:1500,dur:1500,age:0});
      this.sfxDone();
    }
    if(s==='error'){
      this.sqV-=0.12;
      for(let i=0;i<3;i++)this.parts.push({type:'puff',x:this.pos.x+rnd(-0.6,0.6)*this.R,y:this.pos.y-this.R*0.9,
        vx:rnd(-0.02,0.02),vy:-0.03,life:1200,dur:1200,s:rnd(5,9),age:0});
      this.sfxError();
    }
    if(s==='searching'){this.pingT=0;this.sfxPing();}
    if(s==='thinking')this.sfxHm();
    if(s==='sleep')blip(240,90,0.3,0.035);
    if(s==='coding'&&!this.cl.length)this._pushCodeLine();
    if(prev==='sleep'&&s!=='sleep')this.pokeT=0.4;
    this.emit('state',s);
  }
  setFace(k){if(EXPR[k]){this.base=k;this.setState('idle');this.emit('face',k);}}
  say(text){
    if(this._state==='sleep')this.setState('idle');
    if(!this.bubble)this._makeBubble();
    this.bubble.classList.add('on');this.btext.textContent='';
    clearInterval(this._tt);clearTimeout(this._ht);clearTimeout(this._ts);
    this.talking=true;this.emit('say',text);let i=0;
    this._tt=setInterval(()=>{
      i++;this.btext.textContent=text.slice(0,i);
      if(i>=text.length){
        clearInterval(this._tt);
        this._ts=setTimeout(()=>this.talking=false,350);
        this._ht=setTimeout(()=>this.bubble.classList.remove('on'),1900+text.length*24);
      }
    },32);
  }
  wave(){if(this._state==='sleep')this.setState('idle');this.waveA=1.7;this.sqV-=0.09;
    pluck(620,0.05);setTimeout(()=>pluck(880,0.04),110);this.emit('wave');}
  hitTest(x,y){const R=this.R,dx=(x-this.pos.x)/(R*1.08),dy=(y-this.pos.y)/(R*1.08*this.sq);return dx*dx+dy*dy<1;}
  destroy(){cancelAnimationFrame(this.raf);this.cnv.remove();if(this.bubble)this.bubble.remove();}
  faceParams(){
    let e={...EXPR[this.base]};
    const ap=o=>{for(const k in o)e[k]=o[k];};
    const sf=STATE_FACE[this._state];if(sf)ap(sf);
    if(this.waveA>0)ap(OV.wave);
    if(this.pet>0.35)ap(OV.pet);
    if(this.landT>0)ap(OV.squish);
    if(this.pokeT>0)ap(OV.poke);
    if(this.drag)ap(OV.strain);
    if(!this.drag&&Math.hypot(this.vel.x,this.vel.y)>9)ap(OV.panic);
    return e;
  }

  /* ---------- internals ---------- */
  _makeBubble(){
    this.bubble=document.createElement('div');this.bubble.className='hex-bubble';
    this.btext=document.createElement('span');this.bubble.appendChild(this.btext);
    this.host.appendChild(this.bubble);
  }
  _bind(){
    const cv=this.cnv;
    cv.addEventListener('pointerdown',e=>{
      ac();this.lastAct=performance.now();
      const r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
      if(this.hitTest(x,y)){
        this.drag=true;this.dragT=performance.now();this.moved=0;
        this.pStart={x:e.clientX,y:e.clientY};
        this.grabOff.x=x-this.pos.x;this.grabOff.y=y-this.pos.y;
        if(this._state==='sleep')this.setState('idle');
        this.pet=0;cv.setPointerCapture(e.pointerId);e.preventDefault();
      }
    });
    cv.addEventListener('dblclick',()=>{this.wave();if(Math.random()<0.6)this.say(pick(['hi hi!','at your service','boop wave!']));});
    addEventListener('pointermove',e=>{
      const r=cv.getBoundingClientRect();
      const x=e.clientX-r.left,y=e.clientY-r.top;
      const d=Math.hypot(e.clientX-this.mouse.x,e.clientY-this.mouse.y);
      if(this.mouse.x>-9000)this.mspd=this.mspd*0.7+d*0.3;
      this.mouse.x=e.clientX;this.mouse.y=e.clientY;
      if(this.drag&&this.pStart)this.moved=Math.hypot(e.clientX-this.pStart.x,e.clientY-this.pStart.y);
      this.mx=x;this.my=y;
    });
    addEventListener('pointerup',e=>{
      if(!this.drag)return;this.drag=false;
      if(this.moved<7&&performance.now()-this.dragT<350){
        const r=cv.getBoundingClientRect();
        this._poke(e.clientX-r.left,e.clientY-r.top);
      }
    });
    addEventListener('pointerdown',()=>{this.lastAct=performance.now();},{passive:true});
  }
  _poke(x,y){
    this.pokeT=0.55;
    const a=Math.atan2(y-this.pos.y,x-this.pos.x);
    let i=Math.round(a/TAU*this.N);i=(i+this.N)%this.N;
    for(let k=-4;k<=4;k++){const w=Math.exp(-k*k/4.5);this.rimV[(i+k+this.N)%this.N]-=0.16*w;}
    blip(380,170,0.09,0.055);
    for(let j=0;j<3;j++){const an=rnd(0,TAU);
      this.parts.push({type:'spark',x,y,vx:Math.cos(an)*0.09,vy:Math.sin(an)*0.09-0.02,life:480,dur:480,s:rnd(4,7),age:0});}
    if(Math.random()<0.35)this.say(pick(['boop!','on it!','hmm?','busy busy…','hex at your service']));
  }
  _pushCodeLine(){
    const segs=CODE_POOL[this.clI%CODE_POOL.length];this.clI++;
    this.cl.push({segs,total:segs.reduce((n,s)=>n+s[0].length,0),shown:0});
    if(this.cl.length>4)this.cl.shift();
  }
  _loop(now){
    const dt=Math.min(40,now-this.last);this.last=now;
    const t=now/1000,d=Math.min(2.5,dt/16.667),R=this.R,CALM=this.o.calm;
    const st=this._state,E=this.faceParams(),age=t-this.stateT0;
    /* gaze */
    let tx,ty;
    if(E.lookX===undefined&&E.eyes!=='scan'&&E.eyes!=='x'&&E.eyes!=='sleep'){
      tx=clamp(((this.mx??-9999)-this.pos.x)/240,-1.15,1.15);
      ty=clamp(((this.my??-9999)-this.pos.y)/240,-1.15,1.15)+(E.lookY||0);
    }else{tx=E.lookX??0;ty=E.lookY||0;}
    this.look.x=lerp(this.look.x,clamp(tx,-1.2,1.2),0.12*d);
    this.look.y=lerp(this.look.y,clamp(ty,-1.2,1.2),0.12*d);
    /* blink + timers */
    if(this.blinkA>0)this.blinkA-=dt/1000;
    this.nextBlink-=dt;
    if(this.nextBlink<0){this.blinkA=0.15;this.nextBlink=Math.random()<0.14?230:rnd(2200,5600);}
    this.blink=this.blinkA>0?Math.abs(1-2*(this.blinkA/0.15)):1;
    this.pokeT=Math.max(0,this.pokeT-dt/1000);
    this.landT=Math.max(0,this.landT-dt/1000);
    if(this.waveA>0)this.waveA-=dt/1000;
    /* physics */
    if(this.drag){
      const gx=(this.mx??this.pos.x)-this.grabOff.x, gy=(this.my??this.pos.y)-this.grabOff.y;
      const nx=this.pos.x+(gx-this.pos.x)*Math.min(1,0.42*d);
      const ny=this.pos.y+(gy-this.pos.y)*Math.min(1,0.42*d);
      this.vel.x=(nx-this.pos.x)/d;this.vel.y=(ny-this.pos.y)/d;
      this.pos.x=nx;this.pos.y=ny;
    }else{
      this.vel.x+=(this.home.x-this.pos.x)*0.0042*d;
      this.vel.y+=(this.home.y-this.pos.y)*0.0042*d;
      const dmp=Math.pow(0.93,d);this.vel.x*=dmp;this.vel.y*=dmp;
      this.pos.x+=this.vel.x*d;this.pos.y+=this.vel.y*d;
      const pad=R*0.78, hit=v=>{this.sqV-=clamp(v*0.018,0.05,0.28);this.landT=0.4;if(v>3.5)blip(160,58,0.13,clamp(v*0.008,0.02,0.08));};
      if(this.pos.x<pad){this.pos.x=pad;if(Math.abs(this.vel.x)>2)hit(Math.abs(this.vel.x));this.vel.x*=-0.62;}
      if(this.pos.x>this.W-pad){this.pos.x=this.W-pad;if(Math.abs(this.vel.x)>2)hit(Math.abs(this.vel.x));this.vel.x*=-0.62;}
      if(this.pos.y<pad){this.pos.y=pad;if(Math.abs(this.vel.y)>2)hit(Math.abs(this.vel.y));this.vel.y*=-0.62;}
      if(this.pos.y>this.H-pad){this.pos.y=this.H-pad;if(Math.abs(this.vel.y)>2)hit(Math.abs(this.vel.y));this.vel.y*=-0.62;}
    }
    /* squash + lean */
    this.sqV+=(1-this.sq)*0.22*d;this.sqV*=Math.pow(0.78,d);
    this.sq=clamp(this.sq+this.sqV*d,0.5,1.55);
    let lt=clamp(this.vel.x*0.010,-0.26,0.26)+(this.pet>0.35?Math.sin(t*2.6)*0.05:0);
    if(st==='error'&&age<0.9)lt+=Math.sin(t*40)*0.06*(1-age/0.9);
    this.lean=lerp(this.lean,lt,0.10*d);
    /* jelly rim */
    for(let i=0;i<this.N;i++){
      const a=i/this.N*TAU;
      const rest=1+0.020*Math.sin(3*a+t*1.6)+0.014*Math.sin(5*a-t*1.1)+0.008*Math.sin(8*a+t*2.3);
      this.rimV[i]+=(rest-this.rim[i])*0.16*d;
      this.rimV[i]+=((this.rim[(i+this.N-1)%this.N]+this.rim[(i+1)%this.N])/2-this.rim[i])*0.30*d;
      this.rimV[i]*=Math.pow(0.80,d);
    }
    for(let i=0;i<this.N;i++)this.rim[i]+=this.rimV[i]*d;
    /* petting */
    const inside=this.hitTest(this.mx??-9999,this.my??-9999);
    this.mspd*=Math.pow(0.85,d);
    if(!this.drag&&inside&&this.my<this.pos.y-R*0.15&&this.mspd<3.2)this.pet+=dt/1000;
    else this.pet=Math.max(0,this.pet-dt/450);
    if(this.pet>1.1&&Math.random()<0.025)
      this.parts.push({type:'heart',x:this.pos.x+rnd(-R*0.4,R*0.4),y:this.pos.y-R,vx:0,vy:-0.04,life:1500,dur:1500,s:rnd(7,10),age:0});
    /* antenna spring */
    const droop=(E.droop?(st==='error'?R*0.42:R*0.26):R*0.02);
    const arx=clamp(-this.vel.x*2.0,-R*0.42,R*0.42), ary=clamp(droop+this.vel.y*1.4,-R*0.4,R*0.4);
    this.ant.vx+=(arx-this.ant.x)*0.02*d;this.ant.vy+=(ary-this.ant.y)*0.02*d;
    this.ant.vx*=Math.pow(0.86,d);this.ant.vy*=Math.pow(0.86,d);
    this.ant.x+=this.ant.vx*d;this.ant.y+=this.ant.vy*d;
    /* state ambience */
    if(st==='thinking'){
      if(!CALM){this.dotT-=dt;
        if(this.dotT<0){this.dotT=620;
          this.parts.push({type:'dot',x:this.pos.x+rnd(-R*0.4,R*0.8),y:this.pos.y-R*1.15,vx:0.012,vy:-0.028,life:1400,dur:1400,s:rnd(2.5,4.5),age:0});}}
      this.humT-=dt;if(this.humT<0){this.humT=1100;blip(620,700,0.10,0.014);}
    }
    if(st==='searching'){
      this.pingT-=dt;
      if(this.pingT<0&&!CALM){this.pingT=680;this.sfxPing();
        this.parts.push({type:'ping',x:this.pos.x,y:this.pos.y,vx:0,vy:0,life:900,dur:900,s:R,age:0,behind:true});}
      else if(this.pingT<0){this.pingT=680;}
    }
    if(st==='coding'){
      const cur=this.cl[this.cl.length-1];
      if(cur&&cur.shown<cur.total){
        cur.shown=Math.min(cur.total,cur.shown+dt*0.030);
        this.tickT-=dt;
        if(this.tickT<0){this.tickT=100;blip(1400+rnd(0,300),1350,0.03,0.016,'triangle');}
      }else{
        this.clT+=dt;
        if(this.clT>360){this.clT=0;this._pushCodeLine();}
      }
    }
    if(st==='working'){
      this.chugT-=dt;if(this.chugT<0){this.chugT=360;blip(150,118,0.08,0.028,'square');}
      if(!CALM&&Math.random()<0.03){const a=rnd(0,TAU);
        this.parts.push({type:'spark',x:this.pos.x+Math.cos(a)*R*1.32,y:this.pos.y+Math.sin(a)*R*1.32,
          vx:Math.cos(a)*0.04,vy:Math.sin(a)*0.04-0.02,life:420,dur:420,s:rnd(3,5.5),age:0});}
    }
    if(st==='sleep'){
      this.zT-=dt;
      if(this.zT<0){this.zT=900;
        this.parts.push({type:'z',x:this.pos.x+R*0.55,y:this.pos.y-R*0.95,vx:0.02,vy:-0.028,life:2600,dur:2600,s:rnd(11,15),rot:rnd(-0.3,0.3),age:0});}
    }
    if(E.hearts){this.hT-=dt;
      if(this.hT<0){this.hT=640;
        this.parts.push({type:'heart',x:this.pos.x+rnd(-R*0.8,R*0.8),y:this.pos.y-R*0.95,vx:rnd(-0.01,0.01),vy:-0.04,life:1600,dur:1600,s:rnd(7,11),age:0});}}
    if(E.spark&&!CALM&&Math.random()<0.07){const a=rnd(0,TAU);
      this.parts.push({type:'spark',x:this.pos.x+Math.cos(a)*R*1.25,y:this.pos.y+Math.sin(a)*R*1.25,
        vx:Math.cos(a)*0.05,vy:Math.sin(a)*0.05-0.02,life:520,dur:520,s:rnd(4,8),age:0});}
    /* particles */
    for(const p of this.parts){
      p.age+=dt;p.life-=dt;p.x+=(p.vx||0)*dt;p.y+=(p.vy||0)*dt;
      if(p.type==='heart')p.x+=Math.sin(p.age*0.005)*0.028*dt;
      if(p.type==='confetti'){p.vy+=0.0007*dt;p.rot+=p.vr*dt;p.vx*=0.995;}
    }
    this.parts=this.parts.filter(p=>p.life>0);
    /* auto-sleep */
    if(this.o.autoSleep&&st==='idle'&&performance.now()-this.lastAct>this.o.autoSleep){
      this.setState('sleep');this.emit('doze');
    }
    cv.style.cursor=this.drag?'grabbing':(inside?'grab':'default');
    this._draw(t,age);
    this.fN=(this.fN||0)+1;this.fT=(this.fT||0)+dt;
    this.frames=(this.frames||0)+1;
    if(this.fT>500){this.emit('fps',Math.round(this.fN*1000/this.fT));this.fN=0;this.fT=0;}
    this.raf=requestAnimationFrame(this._loop);
  }
  _draw(t,age){
    const g=this.ctx,R=this.R,st=this._state,E=this.faceParams(),CALM=this.o.calm,BS=CALM?0.55:1;
    g.setTransform(this.dpr,0,0,this.dpr,0,0);
    g.clearRect(0,0,this.W,this.H);
    let bob=(st==='sleep'?Math.sin(t*1.15)*R*0.055:Math.sin(t*1.7)*R*0.028)*BS;
    let breath=(st==='sleep'?Math.sin(t*1.15)*0.03:Math.sin(t*1.7)*0.012)*BS;
    if(st==='thinking')bob+=Math.sin(t*2.2)*R*0.035*BS;
    if(st==='working')bob-=Math.abs(Math.sin(t*6.2))*R*0.07;
    if(st==='searching')bob+=Math.sin(t*2.6)*R*0.02;
    /* shadow */
    const lift=Math.max(0,-bob);
    g.fillStyle='rgba(0,0,0,.35)';
    g.beginPath();
    g.ellipse(this.pos.x,this.pos.y+R*1.12*this.sq+R*0.05,R*(0.85+(1-this.sq)*0.6)*clamp(1-lift/(R*1.4),0.55,1),R*0.16,0,0,TAU);
    g.fill();
    /* radar pings behind */
    for(const p of this.parts)if(p.type==='ping'){
      const pr=1-p.life/p.dur;
      g.beginPath();g.arc(p.x,p.y,p.s*(0.7+1.1*pr),0,TAU);
      g.strokeStyle=`rgba(29,155,240,${0.55*(1-pr)})`;g.lineWidth=R*0.03;g.stroke();
    }
    /* arms behind body */
    let arms=null;
    if(this.waveA>0)arms=[{side:1,ang:-48+Math.sin(t*13)*24}];
    else if(st==='working')arms=[{side:1,ang:-60+Math.sin(t*6.2)*24},{side:-1,ang:-120-Math.sin(t*6.2)*24}];
    else if(st==='done')arms=[{side:1,ang:-52+Math.sin(t*12)*12},{side:-1,ang:-128-Math.sin(t*12)*12}];
    const sp=Math.hypot(this.vel.x,this.vel.y);
    const strc=sp>0.5?{a:Math.atan2(this.vel.y,this.vel.x),s:clamp(sp/30,0,0.30)}:null;
    const talk=this.talking?0.18+0.82*Math.abs(Math.sin(t*11))*(0.55+0.45*Math.sin(t*2.6)):0;
    renderBlob(g,{
      x:this.pos.x,y:this.pos.y+bob,R,E,t,
      rim:this.rim,sq:this.sq*(1+breath),lean:this.lean,stretch:strc,
      look:this.look,blink:this.blink,ant:this.ant,talk,arms,
    });
    /* state overlays, anchored to the blob */
    g.save();g.translate(this.pos.x,this.pos.y+bob);
    if(st==='thinking')drawThinkingFX(g,R,t);
    if(st==='searching')drawSearchFX(g,R,t);
    if(st==='working')drawWorkingFX(g,R,t);
    if(st==='done')drawDoneFX(g,R,age);
    if(st==='error')drawErrorFX(g,R,age);
    if(st==='coding'){drawCodeWindow(g,R,t,this.cl);drawTypingArms(g,R,t);}
    g.restore();
    /* front particles */
    for(const p of this.parts){
      if(p.behind)continue;
      const al=clamp(p.life/p.dur,0,1);
      g.globalAlpha=al;
      if(p.type==='heart'){heartPath(g,p.x,p.y,p.s*(0.7+0.3*al));g.fillStyle=RED;g.fill();g.lineWidth=1.5;g.strokeStyle=INK;g.stroke();}
      else if(p.type==='z'){g.save();g.translate(p.x,p.y);g.rotate(p.rot||0);
        g.font=`600 ${p.s*(0.7+0.7*(p.age/p.dur))}px 'IBM Plex Mono',monospace`;
        g.fillStyle=CREAM;g.fillText('z',0,0);g.restore();}
      else if(p.type==='spark'){star4(g,p.x,p.y,p.s*(0.5+0.7*al));g.fillStyle=HONEY_D;g.fill();}
      else if(p.type==='dot'){g.beginPath();g.arc(p.x,p.y,p.s*(0.5+Math.min(1,p.age/140)*0.8),0,TAU);g.fillStyle=CREAM;g.fill();}
      else if(p.type==='confetti'){g.save();g.translate(p.x,p.y);g.rotate(p.rot);
        g.fillStyle=p.col;g.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);g.restore();}
      else if(p.type==='puff'){g.beginPath();g.arc(p.x,p.y,p.s*(0.6+p.age/300),0,TAU);
        g.fillStyle=`rgba(190,175,150,${0.35*al})`;g.fill();}
    }
    g.globalAlpha=1;
    if(this.bubble)this._placeBubble();
  }
  _placeBubble(){
    const R=this.R,b=this.bubble;
    if(!b)return;
    // Clamp above the canvas so the bubble never clips when the widget is
    // docked tight to the top of the composer (Grok: prompt bar is sacred).
    const by=Math.max(4,this.pos.y-R*1.9), bw=b.offsetWidth;
    let bx=this.pos.x+R*1.05;
    b.style.top=Math.round(by)+'px';
    if(bx+bw>this.W-6){
      b.classList.add('hex-flip');
      b.style.left=Math.round(this.pos.x-R*1.05)+'px';
      b.style.translate='-100% 0';
    }else{
      b.classList.remove('hex-flip');
      b.style.left=Math.round(bx)+'px';
      b.style.translate='none';
    }
  }
  sfxPing(){blip(980,520,0.22,0.03);}
  sfxHm(){blip(560,660,0.14,0.016);}
  sfxDone(){[523,659,784,1046].forEach((f,i)=>setTimeout(()=>pluck(f,0.045),i*95));}
  sfxError(){blip(220,110,0.32,0.05,'sawtooth');setTimeout(()=>blip(180,90,0.30,0.04,'sawtooth'),120);}
}

/* ---- public mount surface ---- */
const HexMascot={
  mount:(el,opts)=>new HexEngine(el,opts),
  setSound:b=>{soundOn=!!b;}
};
if(typeof window!=='undefined')window.HexMascot=HexMascot;
export default HexMascot;
export { HexMascot };
