/* Front-view object measurements. Operates on an in-memory, downsampled image. */
(() => {
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const dist=(a,b)=>(a[0]-b[0])**2*.30+(a[1]-b[1])**2*.51+(a[2]-b[2])**2*.19;
  const hex=a=>'#'+a.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
  const quant=(a,p)=>a.sort((x,y)=>x-y)[Math.floor((a.length-1)*p)];
  function measure({data,width:w,height:h}){
    const count=w*h, at=i=>[data[4*i],data[4*i+1],data[4*i+2]], edges=[[],[],[],[]];
    for(let x=0;x<w;x+=2){edges[0].push(at(x)); edges[1].push(at((h-1)*w+x));}
    for(let y=0;y<h;y+=2){edges[2].push(at(y*w));edges[3].push(at(y*w+w-1));}
    const bg=edges.map(p=>[0,1,2].map(k=>quant(p.map(v=>v[k]),.5)));
    const noise=quant(edges.flat().map(rgb=>Math.sqrt(Math.min(...bg.map(b=>dist(rgb,b))))),.82);
    const limit=clamp(12+1.6*noise,17,55)**2;
    const mask=new Uint8Array(count),stack=new Int32Array(count);
    for(let i=0;i<count;i++){const rgb=at(i); mask[i]=data[4*i+3]>100&&bg.every(b=>dist(rgb,b)>limit)?1:0;}
    let best=null,score=-1;
    for(let i=0;i<count;i++){
      if(mask[i]!==1)continue;
      let head=0,tail=1,sumX=0,sumY=0;stack[0]=i;mask[i]=2;
      while(head<tail){
        const j=stack[head++],x=j%w,y=(j/w)|0; sumX+=x;sumY+=y;
        if(x&&mask[j-1]===1){stack[tail++]=j-1;mask[j-1]=2;}if(x<w-1&&mask[j+1]===1){stack[tail++]=j+1;mask[j+1]=2;}
        if(y&&mask[j-w]===1){stack[tail++]=j-w;mask[j-w]=2;}if(y<h-1&&mask[j+w]===1){stack[tail++]=j+w;mask[j+w]=2;}
      }
      if(tail<count*.016)continue;
      const s=tail/(1+6*((sumX/tail/w-.5)**2+(sumY/tail/h-.5)**2));
      if(s>score){score=s;best=stack.slice(0,tail);}
    }
    if(!best||best.length>count*.93)throw Error('没有分出清晰的器物轮廓。请换用与器物颜色不同的纯色背景，正面拍摄，并让四边留白。');
    const left=new Int32Array(h).fill(w),right=new Int32Array(h).fill(-1), bins=new Map();
    let ymin=h,ymax=0,xmin=w,xmax=0;
    for(const j of best){
      const x=j%w,y=(j/w)|0; left[y]=Math.min(left[y],x);right[y]=Math.max(right[y],x);
      xmin=Math.min(xmin,x);xmax=Math.max(xmax,x);ymin=Math.min(ymin,y);ymax=Math.max(ymax,y);
      const rgb=at(j),k=(rgb[0]>>5)*64+(rgb[1]>>5)*8+(rgb[2]>>5),b=bins.get(k)||[0,0,0,0];
      b[0]++;for(let q=0;q<3;q++)b[q+1]+=rgb[q];bins.set(k,b);
    }
    if(ymax-ymin<8||xmax-xmin<8)throw Error('器物在画面中过小。请靠近一点，保留完整器口与底足。');
    const ranked=[...bins.values()].sort((a,b)=>b[0]-a[0]).map(b=>({n:b[0],rgb:b.slice(1).map(v=>v/b[0])}));
    const main=ranked[0].rgb,other=ranked.find(b=>dist(b.rgb,main)>36**2&&b.n>best.length*.009);
    const widths=Array.from({length:ymax-ymin+1},(_,i)=>right[i+ymin]-left[i+ymin]+1).filter(v=>v>0);
    const wide=quant(widths,.96);
    const profile=Array.from({length:12},(_,k)=>{
      const y=ymax-(ymax-ymin)*k/11,span=Math.max(1,(ymax-ymin)/25);
      const values=[];for(let yy=Math.max(ymin,Math.floor(y-span));yy<=Math.min(ymax,Math.ceil(y+span));yy++)if(right[yy]>=left[yy])values.push(right[yy]-left[yy]+1);
      return +clamp((values.length?quant(values,.5):wide*.5)/wide,.06,1).toFixed(3);
    });
    const ratio=(xmax-xmin+1)/(ymax-ymin+1);
    const shape=ratio>2.45?'plate':ratio<1.02||profile[10]<.7&&ratio<1.45?'vase':profile[1]<profile[9]*.83?'bowl':'box';
    const clipped=xmin<2||ymin<2||xmax>=w-2||ymax>=h-2;
    return {shape,profile,color:hex(main),accent:hex(other?other.rgb:main),clipped,hasAccent:!!other,box:[xmin,ymin,xmax,ymax],pixels:best};
  }
  function extract(source){
    const sw=source.videoWidth||source.naturalWidth||source.width,sh=source.videoHeight||source.naturalHeight||source.height;
    if(!sw||!sh)throw Error('没有读取到画面，请重新选择照片或稍后拍摄。');
    const scale=Math.min(1,256/Math.max(sw,sh)),c=document.createElement('canvas');
    c.width=Math.max(1,Math.round(sw*scale));c.height=Math.max(1,Math.round(sh*scale));
    const ctx=c.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#faf9f6';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(source,0,0,c.width,c.height);
    const img=ctx.getImageData(0,0,c.width,c.height),r=measure(img);
    const isolated=ctx.createImageData(c.width,c.height);for(const j of r.pixels){for(let k=0;k<3;k++)isolated.data[4*j+k]=img.data[4*j+k];isolated.data[4*j+3]=255;}
    ctx.putImageData(isolated,0,0);const cropped=document.createElement('canvas'),[x,y,rgt,btm]=r.box;
    cropped.width=rgt-x+1;cropped.height=btm-y+1;cropped.getContext('2d').drawImage(c,x,y,cropped.width,cropped.height,0,0,cropped.width,cropped.height);
    const {pixels,box,...fields}=r;return {...fields,preview:cropped.toDataURL('image/png')};
  }
  window.LacquerVision=Object.freeze({measure,extract});
})();
