// Plant Palette Builder — UI components
// ── Lightbox ──────────────────────────────────────────────────────────────
function Lightbox(props){
  var photos=props.photos,startIdx=props.startIdx,onClose=props.onClose;
  var _s=useState(startIdx||0),idx=_s[0],setIdx=_s[1];
  var touchX=useRef(null);

  useEffect(function(){
    setIdx(startIdx||0);
    function onKey(ev){
      if(ev.key==="ArrowLeft")setIdx(function(i){return Math.max(0,i-1);});
      if(ev.key==="ArrowRight")setIdx(function(i){return Math.min(photos.length-1,i+1);});
      if(ev.key==="Escape")onClose();
    }
    window.addEventListener("keydown",onKey);
    return function(){window.removeEventListener("keydown",onKey);};
  },[startIdx]);

  if(!photos||!photos.length)return null;
  var cur=photos[idx];

  function onTS(ev){touchX.current=ev.touches[0].clientX;}
  function onTE(ev){
    if(touchX.current===null)return;
    var dx=ev.changedTouches[0].clientX-touchX.current;
    if(dx<-50)setIdx(function(i){return Math.min(photos.length-1,i+1);});
    if(dx>50)setIdx(function(i){return Math.max(0,i-1);});
    touchX.current=null;
  }

  return h("div",{
    style:{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,0.94)",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"},
    onTouchStart:onTS,onTouchEnd:onTE,onClick:onClose
  },
    h("button",{onClick:onClose,style:{position:"absolute",top:16,right:16,background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:20,borderRadius:"50%",width:44,height:44,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"✕"),
    idx>0&&h("button",{onClick:function(ev){ev.stopPropagation();setIdx(function(i){return i-1;});},style:{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:24,borderRadius:"50%",width:48,height:48,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"‹"),
    idx<photos.length-1&&h("button",{onClick:function(ev){ev.stopPropagation();setIdx(function(i){return i+1;});},style:{position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",background:"rgba(255,255,255,0.15)",border:"none",color:"white",fontSize:24,borderRadius:"50%",width:48,height:48,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}},"›"),
    h("img",{src:cur.large||cur.medium,alt:"",onClick:function(ev){ev.stopPropagation();},style:{maxWidth:"90vw",maxHeight:"75vh",borderRadius:12,objectFit:"contain"}}),
    photos.length>1&&h("div",{style:{display:"flex",gap:7,marginTop:14}},
      photos.map(function(_,i){return h("div",{key:i,onClick:function(ev){ev.stopPropagation();setIdx(i);},style:{width:8,height:8,borderRadius:"50%",background:i===idx?"white":"rgba(255,255,255,0.3)",cursor:"pointer"}});})
    ),
    cur.credit&&h("div",{style:{color:"rgba(255,255,255,0.4)",fontSize:11,marginTop:8,maxWidth:"80vw",textAlign:"center"}},cur.credit),
    h("div",{style:{color:"rgba(255,255,255,0.3)",fontSize:11,marginTop:4}},"Swipe or use arrow keys \u00b7 click outside to close")
  );
}
function INatLink({ latinName }) {
  var _u=useState(null),url=_u[0],setUrl=_u[1];
  useEffect(function(){
    if(!latinName||url)return;
    fetch("https://api.inaturalist.org/v1/taxa?q="+encodeURIComponent(latinName.trim())+"&per_page=1")
      .then(function(r){return r.json();})
      .then(function(d){
        var t=(d.results||[])[0];
        if(t)setUrl("https://www.inaturalist.org/taxa/"+t.id+"-"+t.name.replace(/ /g,"-"));
      })
      .catch(function(){});
  },[latinName]);
  if(!url)return null;
  return h("a",{href:url,target:"_blank",rel:"noopener noreferrer",
    title:"View on iNaturalist — photos, maps, and observations",
    style:{fontSize:"0.75rem",color:"#2e5339",textDecoration:"none",whiteSpace:"nowrap"}
  },"iNaturalist \u2197");
}

// ── PlantThumb ────────────────────────────────────────────────────────────
function PlantThumb(props){
  var plant=props.plant,size=props.size||48,radius=props.radius||8;
  var _s=useState(false),failed=_s[0],setFailed=_s[1];
  var bg=CAT_BG[plant.category]||"#f0ede4";
  var fg=CAT_FG[plant.category]||"#4a7c59";
  var em=CAT_EMOJI[plant.category]||"\ud83c\udf3f";
  if(!plant.image||failed){
    return h("div",{style:{width:size,height:size,borderRadius:radius,flexShrink:0,background:bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}},
      h("div",{style:{fontSize:size*0.38,lineHeight:1}},em),
      h("div",{style:{fontSize:size*0.18,fontWeight:"bold",color:fg}},plant.common.charAt(0))
    );
  }
  return h("img",{src:plant.image,alt:plant.common,onError:function(){setFailed(true);},style:{width:size,height:size,borderRadius:radius,objectFit:"cover",flexShrink:0}});
}

// ── ColorDots ─────────────────────────────────────────────────────────────
function ColorDots(props){
  var colorStr=props.colorStr,size=props.size||9;
  if(!colorStr)return null;
  var cols=colorStr.split(/\s*[|]\s*/).map(function(c){return c.trim();}).filter(Boolean);
  return h("div",{style:{display:"flex",gap:3,flexWrap:"wrap",alignItems:"center"}},
    cols.map(function(c,i){return h("div",{key:i,title:c,style:{width:size,height:size,borderRadius:"50%",background:COLOR_MAP[c]||"#ccc",border:c==="white"?"1px solid #ccc":"none",flexShrink:0}});})
  );
}

// ── RiskBadges ────────────────────────────────────────────────────────────
function RiskBadges(props){
  var plant=props.plant,b=[];
  if(plant.deerPressure==="high")b.push({t:"\ud83e\udd8c Deer: high risk",bg:"#fcebeb",fg:"#a32d2d"});
  else if(plant.deerPressure==="medium")b.push({t:"\ud83e\udd8c Deer: moderate",bg:"#faeeda",fg:"#854f0b"});
  else if(plant.deerPressure==="low")b.push({t:"\ud83e\udd8c Deer: resistant",bg:"#eaf3de",fg:"#3b6d11"});
  if(plant.rabbitDamage==="high")b.push({t:"\ud83d\udc07 Rabbit: high risk",bg:"#fcebeb",fg:"#a32d2d"});
  else if(plant.rabbitDamage==="medium")b.push({t:"\ud83d\udc07 Rabbit: moderate",bg:"#faeeda",fg:"#854f0b"});
  else if(plant.rabbitDamage==="low")b.push({t:"\ud83d\udc07 Rabbit: resistant",bg:"#eaf3de",fg:"#3b6d11"});
  if(plant.voleRisk==="high")b.push({t:"\ud83d\udc2d Vole: high risk",bg:"#fcebeb",fg:"#a32d2d"});
  else if(plant.voleRisk==="medium")b.push({t:"\ud83d\udc2d Vole: moderate",bg:"#faeeda",fg:"#854f0b"});
  else if(plant.voleRisk==="low")b.push({t:"\ud83d\udc2d Vole: resistant",bg:"#eaf3de",fg:"#3b6d11"});
  if(plant.toxicDogs==="yes")b.push({t:"\ud83d\udc15 Toxic to dogs",bg:"#fce4ec",fg:"#c62828"});
  else if(plant.toxicDogs==="medium"||plant.toxicDogs==="mild")b.push({t:"\ud83d\udc15 Mildly toxic to dogs",bg:"#fff3e0",fg:"#e65100"});
  if(plant.toxicCats==="yes")b.push({t:"\ud83d\udc08 Toxic to cats",bg:"#fce4ec",fg:"#c62828"});
  else if(plant.toxicCats==="mild")b.push({t:"\ud83d\udc08 Mildly toxic to cats",bg:"#fff3e0",fg:"#e65100"});
  if(plant.toxicChildren==="yes")b.push({t:"\ud83d\udc76 Toxic to children",bg:"#fce4ec",fg:"#c62828"});
  else if(plant.toxicChildren==="mild")b.push({t:"\ud83d\udc76 Mildly toxic to children",bg:"#fff3e0",fg:"#e65100"});
  if(!b.length)return null;
  return h("div",{style:{display:"flex",flexWrap:"wrap",gap:4,marginTop:8}},
    b.map(function(x,i){return h("span",{key:i,style:{fontSize:11,padding:"2px 8px",borderRadius:10,background:x.bg,color:x.fg,fontWeight:"bold"}},x.t);})
  );
}

// ── Photo gallery ─────────────────────────────────────────────────────────
function taxonQ(latin){
  return latin.replace(/['''][^''']*[''']/g,"").replace(/cultivars?/ig,"")
    .replace(/hybrids?/ig,"").replace(/spp?/ig,"").replace(/var\b.*/ig,"")
    .replace(/[x\xd7]\s+/g,"").trim().split(/\s+/).slice(0,2).join(" ");
}

function PhotoGallery(props){
  var plant=props.plant;
  var _s=useState(null),photos=_s[0],setPhotos=_s[1];
  var _l=useState(null),lbIdx=_l[0],setLbIdx=_l[1];

  useEffect(function(){
    if(photos!==null)return;
    var name=taxonQ(plant.latin);
    var cur=plant.curatedImage;
    if(!name){setPhotos(cur?[{medium:cur,large:cur,thumb:cur,credit:""}]:[]);return;}
    fetch("https://api.inaturalist.org/v1/taxa?q="+encodeURIComponent(name)+"&per_page=1")
      .then(function(r){return r.json();})
      .then(function(d){
        var taxon=(d.results||[])[0];
        if(!taxon)return Promise.reject("no taxon");
        return fetch("https://api.inaturalist.org/v1/observations?taxon_id="+taxon.id+"&quality_grade=research&photos=true&per_page=5&order_by=votes&photo_license=cc-by-nc,cc-by-nc-sa,cc-by-nc-nd");
      })
      .then(function(r){return r.json();})
      .then(function(d){
        var seen={};
        var imgs=[];
        function addImg(medium,thumb,large,credit){
          if(!medium||seen[medium])return;
          seen[medium]=true;
          imgs.push({thumb:thumb,medium:medium,large:large,credit:(credit||"").replace(/\(c\)/g,"\u00a9")});
        }
        if(cur){addImg(cur,cur,cur,"");seen[cur]=true;}
        if(plant.inatImage){var im=plant.inatImage;addImg(im,im.replace("medium","square"),im.replace("medium","large"),"");}
        (d.results||[]).forEach(function(obs){
          (obs.photos||[]).forEach(function(ph){
            if(imgs.length>=5)return;
            var med=(ph.url||"").replace("square","medium");
            if(med.indexOf("http")<0)return;
            addImg(med,ph.url||"",( ph.url||"").replace("square","large"),ph.attribution||"");
          });
        });
        setPhotos(imgs);
      })
      .catch(function(){
        var fb=cur||plant.inatImage;
        setPhotos(fb?[{medium:fb,large:fb,thumb:fb,credit:""}]:[]);
      });
  },[plant.latin]);

  if(photos===null)return h("div",{style:{width:200,height:165,borderRadius:10,background:"#f0ede4",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}},h("span",{style:{fontSize:11,color:"#aaa",fontStyle:"italic"}},"Loading\u2026"));
  if(!photos.length)return h(PlantThumb,{plant:plant,size:120,radius:10});
  var cur2=photos[0];

  return h("div",{style:{flexShrink:0,width:200}},
    lbIdx!==null&&h(Lightbox,{photos:photos,startIdx:lbIdx,onClose:function(){setLbIdx(null);}}),
    h("img",{src:cur2.medium,alt:plant.common,
      onClick:function(){setLbIdx(0);},
      onError:function(ev){ev.target.src=cur2.thumb||"";},
      style:{width:200,height:165,objectFit:"cover",borderRadius:10,display:"block",cursor:"zoom-in"}}),
    photos.length>1&&h("div",{style:{display:"flex",gap:5,marginTop:6,overflowX:"auto",paddingBottom:2}},
      photos.map(function(ph,i){return h("img",{key:i,src:ph.thumb,alt:"",
        onClick:function(){setLbIdx(i);},
        onError:function(ev){ev.target.style.opacity="0.2";},
        style:{width:34,height:34,borderRadius:5,objectFit:"cover",flexShrink:0,cursor:"pointer",
          border:"2px solid "+(i===0?"#2e5339":"transparent"),opacity:i===0?1:0.55}});})
    ),
    cur2.credit&&h("div",{style:{fontSize:9,color:"#bbb",marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},cur2.credit.length>70?cur2.credit.slice(0,70)+"\u2026":cur2.credit),
    h("div",{style:{fontSize:9,color:"#ccc",marginTop:1}},"via iNaturalist \u00b7 "+photos.length+" photo"+(photos.length!==1?"s":"")+" \u00b7 click to enlarge")
  );
}

// ── EdibleSection ─────────────────────────────────────────────────────────
function EdibleSection(props){
  var plant=props.plant,edibleOnly=props.edibleOnly,medicinalOnly=props.medicinalOnly;
  var _s=useState(false),open=_s[0],setOpen=_s[1];
  var hasEdible=plant.edible;
  var hasMedicinal=plant.medicinal;
  var edibleNotes=(plant.edibleNotes||"").trim();
  var medicinalNotes=(plant.medicinalNotes||"").trim();
  var edibleCaveats=plant.edibleValue&&plant.edibleValue.indexOf("caveats")>=0;
  var medicinalCaveats=plant.medicinalValue&&plant.medicinalValue.indexOf("caveats")>=0;
  var toxicNotes=(!hasEdible&&!hasMedicinal)?(plant.edibleNotes||"").trim():"";

  if(!hasEdible&&!hasMedicinal){
    if(!toxicNotes)return null;
    return h("div",{style:{marginTop:8,padding:"6px 10px",background:"#fff3e0",borderRadius:6,fontSize:12,color:"#e65100",display:"flex",gap:5,alignItems:"flex-start"}},
      h("span",null,"\u26a0\ufe0f"),
      h("span",null,toxicNotes)
    );
  }

  // Auto-expand when relevant filter is active
  var isOpen=open||(edibleOnly&&hasEdible)||(medicinalOnly&&hasMedicinal)||(edibleOnly&&medicinalOnly);
  return h("div",{style:{marginTop:10}},
    h("button",{onClick:function(ev){ev.stopPropagation();setOpen(!open);},style:{display:"flex",alignItems:"center",gap:5,background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#2e5339",fontFamily:"inherit",padding:0}},
      hasEdible&&h("span",null,"\ud83c\udf74"),
      hasMedicinal&&h("span",null,"\u2615"),
      h("span",{style:{fontWeight:"bold"}},isOpen?"\u25b2 Hide":"\u25bc "+(hasEdible&&hasMedicinal?"Edible & medicinal":hasEdible?"Edible":"Medicinal"))
    ),
    isOpen&&h("div",{style:{marginTop:8,padding:"10px 12px",background:"#f0faf0",borderRadius:8,fontSize:13,lineHeight:1.6,color:"#444"}},
      hasEdible&&h("div",{style:{marginBottom:hasMedicinal?10:0}},
        h("div",{style:{display:"flex",alignItems:"center",gap:5,marginBottom:5}},
          h("span",{style:{fontSize:14}},"\ud83c\udf74"),
          h("span",{style:{fontWeight:"bold",color:"#2e5339"}},"Edible"),
          edibleCaveats&&h("span",{style:{display:"inline-flex",alignItems:"center",gap:3,background:"#fff8e1",color:"#f57f17",fontSize:11,fontWeight:500,padding:"1px 7px",borderRadius:10,marginLeft:3}},"\u26a0 with caveats")
        ),
        edibleNotes&&h("div",{style:{color:"#555"}},edibleNotes)
      ),
      hasEdible&&hasMedicinal&&h("div",{style:{borderTop:"1px solid #d8eed8",marginBottom:10}}),
      hasMedicinal&&h("div",null,
        h("div",{style:{display:"flex",alignItems:"center",gap:5,marginBottom:5}},
          h("span",{style:{fontSize:14}},"\u2615"),
          h("span",{style:{fontWeight:"bold",color:"#2e5339"}},"Medicinal"),
          medicinalCaveats&&h("span",{style:{display:"inline-flex",alignItems:"center",gap:3,background:"#fff8e1",color:"#f57f17",fontSize:11,fontWeight:500,padding:"1px 7px",borderRadius:10,marginLeft:3}},"\u26a0 with caveats")
        ),
        medicinalNotes&&h("div",{style:{color:"#555"}},medicinalNotes)
      )
    )
  );
}

// ── SeedSection ───────────────────────────────────────────────────────────
function SeedSection(props){
  var plant=props.plant;
  var _s=useState(props.defaultOpen||false),open=_s[0],setOpen=_s[1];
  if(!plant.seedStart&&!plant.seedNotes&&!plant.propagNotes)return null;
  return h("div",{style:{marginTop:10}},
    h("button",{onClick:function(ev){ev.stopPropagation();setOpen(!open);},style:{display:"flex",alignItems:"center",gap:5,background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#2e5339",fontFamily:"inherit",padding:0}},
      h("span",null,"\ud83c\udf31"),
      h("span",{style:{fontWeight:"bold"}},open?"\u25b2 Hide":"\u25bc Seed & propagation")
    ),
    open&&h("div",{style:{marginTop:8,padding:"10px 12px",background:"#f0faf0",borderRadius:8,fontSize:13,lineHeight:1.6,color:"#444"}},
      plant.seedStart&&plant.seedEnd&&h("div",{style:{marginBottom:5}},h("span",{style:{color:"#888"}},"Seeds ripe: "),h("strong",null,plant.seedStart+"\u2013"+plant.seedEnd)),
      plant.seedNotes&&h("div",{style:{marginBottom:plant.propagNotes?7:0}},h("span",{style:{color:"#888"}},"Collecting: "),plant.seedNotes),
      plant.propagNotes&&h("div",null,h("span",{style:{color:"#888"}},"Propagation: "),plant.propagNotes)
    )
  );
}

// ── PlantCard ─────────────────────────────────────────────────────────────
function PlantCard(props){
  var plant=props.plant,siteKey=props.siteKey,hearted=props.hearted,onHeart=props.onHeart,onRemove=props.onRemove,edibleOnly=props.edibleOnly,medicinalOnly=props.medicinalOnly,defaultOpen=props.defaultOpen||false,defaultSeedOpen=props.defaultSeedOpen||false;
  var _s=useState(defaultOpen),open=_s[0],setOpen=_s[1];
  var score=siteKey?(getSiteScore(plant,siteKey)||0):null;
  var ss=STATUS_COLORS_MAP[plant.status]||{bg:"#f5f5f5",text:"#555",label:plant.status};
  var cats=plant.caterpillars||0;
  var icolor=cats>=100?"#2e7d32":cats>=20?"#f57f17":"#999";
  var ilabel=""+cats;

  return h("div",{className:"print-card",style:{background:"white",border:"1px solid #e0ddd5",borderRadius:10,overflow:"hidden",boxShadow:open?"0 4px 16px rgba(0,0,0,0.08)":"none",marginBottom:8}},
    h("div",{style:{display:"flex",alignItems:"center",gap:12,padding:"12px 14px"}},
      score!==null&&h("div",{style:{background:SCORE_COLORS[score],color:score>=3?"white":"#333",borderRadius:8,minWidth:52,textAlign:"center",padding:"4px 5px",flexShrink:0}},
        h("div",{style:{fontSize:13,fontWeight:"bold",letterSpacing:-1}},"\u25cf".repeat(score)),
        h("div",{style:{fontSize:8,opacity:0.85,lineHeight:1}},SCORE_LABELS[score])
      ),
      h("div",{onClick:function(){setOpen(!open);},style:{display:"flex",alignItems:"center",gap:12,flex:1,minWidth:0,cursor:"pointer"}},
        h(PlantThumb,{plant:plant,size:50,radius:8}),
        h("div",{style:{flex:1,minWidth:0}},
          h("div",{style:{fontWeight:"bold",fontSize:16}},plant.common),
          h("div",{style:{fontSize:13,color:"#888",fontStyle:"italic",marginBottom:4}},plant.latin),
          h("div",{style:{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}},
            h("span",{style:{background:ss.bg,color:ss.text,fontSize:11,padding:"2px 7px",borderRadius:10,fontWeight:"bold"}},ss.label),
            h("span",{style:{background:"#f0ede4",color:"#666",fontSize:11,padding:"2px 7px",borderRadius:10}},plant.category),
            plant.flowerColor&&h(ColorDots,{colorStr:plant.flowerColor,size:9}),
            cats>0&&h("span",{style:{fontSize:11,color:icolor,fontWeight:"bold"}},"\ud83e\udd8b"+ilabel)
          )
        ),
        h("span",{className:"no-print",style:{color:"#aaa",fontSize:14,flexShrink:0}},open?"\u25b2":"\u25bc")
      ),
      h("button",{onClick:function(ev){ev.stopPropagation();onHeart(plant.latin);},
        style:{background:"none",border:"none",cursor:"pointer",fontSize:24,color:hearted?"#e57373":"#ddd",flexShrink:0,padding:4,lineHeight:1}},
        hearted?"\u2665":"\u2661"
      ),
      onRemove&&h("button",{
        onClick:function(ev){ev.stopPropagation();onRemove(plant);},
        title:"Remove and swap",
        style:{background:"none",border:"1px solid #e0ddd5",borderRadius:"50%",cursor:"pointer",fontSize:13,color:"#bbb",flexShrink:0,width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,marginLeft:2}
      },"\u2715")
    ),
    open&&h("div",{style:{padding:"0 14px 16px",borderTop:"1px solid #f0ede4"}},
      h("div",{style:{display:"flex",gap:16,marginTop:14,flexWrap:"wrap"}},
        h(PhotoGallery,{plant:plant}),
        h("div",{style:{flex:1,minWidth:180}},
          (plant.status==="Invasive"&&h("div",{style:{background:"#fde8e8",border:"1px solid #f5c6c6",borderRadius:8,padding:"10px 12px",marginBottom:10,fontSize:13,color:"#b71c1c",lineHeight:1.5}},
  h("strong",null,"\u26d4 Invasive species"),
  h("div",null,"This plant is prohibited or highly invasive in Massachusetts. It is included for identification and educational purposes only \u2014 not for planting."),
  h("div",{style:{display:"flex",gap:12,marginTop:4}},
    h("a",{href:"https://www.mass.gov/info-details/massachusetts-prohibited-plant-list",target:"_blank",rel:"noopener noreferrer",style:{fontSize:12,color:"#b71c1c",textDecoration:"none"}},"MA Invasives list \u2197"),
    h(INatLink,{latinName:plant.latin})
  )
)),
(plant.status==="Caution"&&h("div",{style:{background:"#fff3cd",border:"1px solid #ffe082",borderRadius:8,padding:"10px 12px",marginBottom:10,fontSize:13,color:"#7d4e00",lineHeight:1.5}},
  h("strong",null,"\u26a0\ufe0f Use with caution"),
  h("div",null,"This plant is invasive or problematic in neighboring states and may cause ecological harm if planted in Massachusetts."),
  h("div",{style:{marginTop:4}},h(INatLink,{latinName:plant.latin}))
)),
plant.notes&&h("p",{style:{margin:"0 0 10px",fontSize:14,lineHeight:1.6,color:"#444",whiteSpace:"pre-line"}},plant.notes),
h("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px 12px",fontSize:13}},
  plant.sun&&h("div",null,h("span",{style:{color:"#888"}},"Sun: "),plant.sun),
  plant.moisture&&h("div",null,h("span",{style:{color:"#888"}},"Moisture: "),plant.moisture),
  plant.heightFt&&h("div",null,h("span",{style:{color:"#888"}},"Height: "),plant.heightFt+" ft"),
  plant.bloom&&plant.bloom!=="N/A"&&h("div",null,h("span",{style:{color:"#888"}},"Bloom: "),plant.bloom),
  plant.seasonal&&h("div",null,h("span",{style:{color:"#888"}},"Interest: "),plant.seasonal),
  plant.aggressive&&h("div",null,h("span",{style:{color:"#888"}},"Spreads: "),plant.aggressive==="Y"?"Aggressive spreader":plant.aggressive==="M"?"Moderate spreader":"Does not spread"),
  plant.flowerColor&&h("div",{style:{display:"flex",alignItems:"center",gap:5,gridColumn:"1/-1"}},h("span",{style:{color:"#888"}},"Flower: "),h(ColorDots,{colorStr:plant.flowerColor,size:12})),
cats>0&&h("div",{style:{gridColumn:"1/-1",display:"flex",alignItems:"center",gap:12}},h("span",null,h("span",{style:{color:"#888"}},"\ud83e\udd8b Caterpillar host: "),h("span",{style:{color:icolor,fontWeight:"bold"}},ilabel+" species")),h(INatLink,{latinName:plant.latin}))
),
h("div",{style:{marginTop:14}},
        h("div",{style:{fontSize:11,letterSpacing:1,textTransform:"uppercase",color:"#aaa",marginBottom:6}},"Suitability across zones"),
        h("div",{style:{display:"flex",flexDirection:"column",gap:3}},
          MICROZONES.map(function(z){
            var s=plant.scores[z.key]||0;
            return h("div",{key:z.key,style:{display:"flex",alignItems:"center",gap:8}},
              h("div",{style:{fontSize:11,width:120,minWidth:80,color:z.key===siteKey?"#2e5339":"#666",fontWeight:z.key===siteKey?"bold":"normal"}},z.emoji+" "+z.label),
              h("div",{style:{flex:1,height:5,background:"#f0ede4",borderRadius:3,overflow:"hidden"}},
                h("div",{style:{width:(s/5*100)+"%",height:"100%",background:SCORE_COLORS[s],borderRadius:3}})
              ),
              h("div",{style:{fontSize:11,color:"#aaa",width:44}},SCORE_LABELS[s])
            );
          })
        )
      ),
h(RiskBadges,{plant:plant}),
h(SeedSection,{plant:plant,defaultOpen:defaultSeedOpen}),
h(EdibleSection,{plant:plant,edibleOnly:edibleOnly,medicinalOnly:medicinalOnly})
        )
      )
    )
  );
}

// ── HeartsPanel ───────────────────────────────────────────────────────────
function HeartsPanel(props){
  var hearts=props.hearts,plants=props.plants,open=props.open,onClose=props.onClose,isHabitat=props.isHabitat;
  var _l=useState(""),label=_l[0],setLabel=_l[1];
  var _c=useState(false),copied=_c[0],setCopied=_c[1];

  var hearted=useMemo(function(){return plants.filter(function(p){return hearts.indexOf(p.latin)>=0;});},[plants,hearts]);
  var mix=useMemo(function(){
    var c={tree:0,shrub:0,perennial:0,grass:0,fern:0,ground:0,vine:0};
    hearted.forEach(function(p){if(c[p.typeKey]!==undefined)c[p.typeKey]++;});
    return c;
  },[hearted]);

  var tips=[];
  if(isHabitat){if((mix.tree||0)+(mix.shrub||0)<5)tips.push("Add more trees or shrubs for habitat structure");if(mix.grass<2)tips.push("Consider adding grasses or sedges");}
  else{if(mix.grass===0&&hearted.length>3)tips.push("Consider adding grasses or sedges");if((mix.tree||0)+(mix.shrub||0)===0&&hearted.length>3)tips.push("A shrub or small tree adds structure");}

  function copyLink(){
var p=new URLSearchParams();
    p.set("hearts",hearts.join(","));
    if(label)p.set("label",label);
    navigator.clipboard.writeText(location.origin+location.pathname+"?"+p.toString())
      .then(function(){setCopied(true);setTimeout(function(){setCopied(false);},2000);});
  }

  if(!open)return null;
  var W=Math.min(320,window.innerWidth);
  return h("div",null,
    h("div",{onClick:onClose,style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.3)",zIndex:199}}),
    h("div",{style:{position:"fixed",right:0,top:0,bottom:0,width:W,background:"white",boxShadow:"-4px 0 24px rgba(0,0,0,0.12)",zIndex:200,display:"flex",flexDirection:"column"}},
      h("div",{style:{background:"#2e5339",color:"white",padding:"18px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}},
        h("div",{style:{fontFamily:"'Literata',serif",fontSize:20}},"My palette"),
        h("button",{onClick:onClose,style:{background:"none",border:"none",color:"white",fontSize:22,cursor:"pointer"}},"\u2715")
      ),
      h("div",{style:{padding:"12px 16px",borderBottom:"1px solid #e0ddd5",flexShrink:0}},
        h("input",{value:label,onChange:function(ev){setLabel(ev.target.value);},placeholder:"Name this palette (e.g. Johnson Residence)",style:{width:"100%",border:"1.5px solid #e0ddd5",borderRadius:8,padding:"7px 12px",fontFamily:"inherit",fontSize:14,outline:"none",color:"#2c2c2c"}})
      ),
      h("div",{style:{padding:"12px 16px",borderBottom:"1px solid #e0ddd5",flexShrink:0}},
        h("div",{style:{fontSize:12,color:"#aaa",letterSpacing:1,textTransform:"uppercase",marginBottom:8}},"Mix"),
        h("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}},
          [{k:"tree",e:"\ud83c\udf33",l:"Trees"},{k:"shrub",e:"\ud83c\udf3f",l:"Shrubs"},{k:"perennial",e:"\ud83c\udf3c",l:"Perennial"},{k:"grass",e:"\ud83c\udf3e",l:"Grass"}].map(function(x){
            return h("div",{key:x.k,style:{background:"#f0ede4",borderRadius:8,padding:"8px 10px"}},
              h("div",{style:{fontSize:22,fontWeight:600,color:mix[x.k]>0?"#2e5339":"#aaa",lineHeight:1.1}},mix[x.k]),
              h("div",{style:{fontSize:11,color:"#888",marginTop:1}},x.e+" "+x.l)
            );
          })
        ),
        tips.map(function(t,i){return h("div",{key:i,style:{fontSize:12,color:"#f57f17",marginTop:6,fontStyle:"italic"}},"\ud83d\udca1 "+t);})
      ),
      h("div",{style:{flex:1,overflowY:"auto",padding:"12px 16px"}},
        hearted.length===0&&h("div",{style:{textAlign:"center",padding:"30px 0",color:"#aaa",fontStyle:"italic",fontSize:14}},"Heart plants to build your palette"),
        hearted.map(function(p){
          return h("div",{key:p.latin,style:{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #f5f3ef"}},
            h(PlantThumb,{plant:p,size:38,radius:7}),
            h("div",{style:{flex:1,minWidth:0}},
              h("div",{style:{fontSize:14,fontWeight:500}},p.common),
              h("div",{style:{fontSize:12,color:"#888",fontStyle:"italic"}},p.latin)
            )
          );
        })
      ),
      h("div",{style:{padding:"14px 16px",borderTop:"1px solid #e0ddd5",flexShrink:0,display:"flex",flexDirection:"column",gap:8}},
        h("button",{onClick:copyLink,style:btn(copied?"#e8f5e9":"#2e5339",copied?"#2e7d32":"white")},copied?"\u2713 Link copied!":"\ud83d\udd17 Copy shareable link"),
        h("button",{onClick:function(){window.print();},style:btn("#f0ede4","#2c2c2c")},"\ud83d\udda8\ufe0f Print / save PDF"),
        hearted.length>0&&h("button",{onClick:function(){if(window.confirm("Clear all "+hearted.length+" plants from your palette?"))props.onClear();},style:btn("#fff5f5","#c62828",{border:"1px solid #ffcdd2"})},"\u2715 Clear palette")
      )
    )
  );
}

// ── SuggestPanel ──────────────────────────────────────────────────────────
function SuggestPanel(props){
  var plants=props.plants,siteKey=props.siteKey,count=props.count,hearts=props.hearts,onHeart=props.onHeart,onClose=props.onClose;
  var scale=count/20;
  var TARGETS={tree:Math.max(1,Math.round(3*scale)),shrub:Math.max(1,Math.round(2*scale)),perennial:Math.max(1,Math.round(5*scale)),grass:Math.max(1,Math.round(3*scale)),ground:Math.max(1,Math.round(2*scale)),fern:0,vine:0};

  var suggested=useMemo(function(){
    var byType={};
    PLANT_TYPES.forEach(function(g){byType[g.key]=[];});
    var scored=plants.slice().sort(function(a,b){
      return ((getSiteScore(b,siteKey)||0)*10+(b.caterpillars||0)/10)-((getSiteScore(a,siteKey)||0)*10+(a.caterpillars||0)/10);
    });
    // Pass 1: prefer one plant per genus
    var usedGenera={};
    scored.forEach(function(p){
      var t=TARGETS[p.typeKey]||0;
      var genus=p.latin.split(" ")[0];
      if(t>0&&byType[p.typeKey].length<t&&!usedGenera[genus]){
        byType[p.typeKey].push(p);
        usedGenera[genus]=true;
      }
    });
    // Pass 2: backfill with any remaining if slots still open
    scored.forEach(function(p){
      var t=TARGETS[p.typeKey]||0;
      var already=byType[p.typeKey].some(function(x){return x.latin===p.latin;});
      if(t>0&&byType[p.typeKey].length<t&&!already)byType[p.typeKey].push(p);
    });
    return byType;
  },[plants,siteKey,count]);

  var total=Object.values(suggested).reduce(function(s,a){return s+a.length;},0);

  return h("div",{style:{background:"white",border:"2px solid #2e5339",borderRadius:12,padding:20,marginBottom:16}},
    h("div",{style:{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:4}},
      h("div",{style:{fontFamily:"'Literata',serif",fontSize:20,color:"#2e5339"}},"Suggested palette \u2014 "+total+" plants"),
      h("button",{onClick:onClose,style:{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#aaa",padding:0,lineHeight:1}},"\u2715")
    ),
    h("div",{style:{fontSize:13,color:"#888",marginBottom:16}},"Best-fit plants for your site \u00b7 ranked by wildlife value + suitability \u00b7 tap \u2661 to save"),
    h("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12,marginBottom:16}},
      PLANT_TYPES.filter(function(g){return TARGETS[g.key]>0&&suggested[g.key]&&suggested[g.key].length>0;}).map(function(g){
        return h("div",{key:g.key},
          h("div",{style:{fontSize:11,color:"#888",letterSpacing:1,textTransform:"uppercase",marginBottom:6,display:"flex",alignItems:"center",gap:5}},
            g.emoji+" "+g.label,
            h("span",{style:{background:"#e8f5e9",color:"#2e7d32",borderRadius:10,padding:"0 7px",fontSize:10}},suggested[g.key].length)
          ),
          suggested[g.key].map(function(p){
            var isH=hearts.indexOf(p.latin)>=0;
            return h("div",{key:p.latin,style:{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:8,border:"1px solid #e0ddd5",marginBottom:5,background:"#fafaf7"}},
              h(PlantThumb,{plant:p,size:32,radius:6}),
              h("div",{style:{flex:1,minWidth:0}},
                h("div",{style:{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},p.common),
                h("div",{style:{fontSize:11,color:"#888",fontStyle:"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},p.latin)
              ),
              h("button",{onClick:function(){onHeart(p.latin);},style:{background:"none",border:"none",cursor:"pointer",fontSize:20,color:isH?"#e57373":"#ddd",flexShrink:0,lineHeight:1}},isH?"\u2665":"\u2661")
            );
          })
        );
      })
    ),
    h("div",{style:{display:"flex",gap:8,flexWrap:"wrap"}},
      h("button",{onClick:function(){Object.values(suggested).flat().forEach(function(p){if(hearts.indexOf(p.latin)<0)onHeart(p.latin);});onClose();},style:btn("#2e5339","white")},"\u2665 Save all to my palette"),
      h("button",{onClick:onClose,style:btn("#f0ede4","#2c2c2c")},"Browse all matches below \u2193")
    )
  );
}

// ── HabitatView ───────────────────────────────────────────────────────────
function HabitatView(props){
  var plants=props.plants,concerns=props.concerns,heightCap=props.heightCap,
      patchSize=props.patchSize,hearts=props.hearts,onHeart=props.onHeart,onLoosen=props.onLoosen;
  var scale=patchSize/20;
  var HT={
    canopy:   Math.max(1, Math.round(2*scale)),
    woody:    Math.max(1, Math.round(4*scale)),
    perennial:Math.max(2, Math.round(7*scale)),
    grass:    Math.max(1, Math.round(4*scale)),
    ground:   Math.max(1, Math.round(3*scale)),
  };
  var _s=useState("wildlife"),sortBy=_s[0],setSortBy=_s[1];
  var _rm=useState([]),removedLatins=_rm[0],setRemovedLatins=_rm[1];
  var _undo=useState([]),undoStack=_undo[0],setUndoStack=_undo[1];
  var _anim=useState(null),removingLatin=_anim[0],setRemovingLatin=_anim[1];

  function handleRemovePlant(plant){
    setRemovingLatin(plant.latin);
    setTimeout(function(){
      setRemovedLatins(function(prev){return prev.indexOf(plant.latin)>=0?prev:[...prev,plant.latin];});
      setUndoStack(function(prev){return [...prev,plant.latin];});
      setRemovingLatin(null);
    },280);
  }
  function handleUndo(){
    if(!undoStack.length)return;
    var last=undoStack[undoStack.length-1];
    setRemovedLatins(function(prev){return prev.filter(function(l){return l!==last;});});
    setUndoStack(function(prev){return prev.slice(0,-1);});
  }
  function handleReset(){setRemovedLatins([]);setUndoStack([]);}

  var base=useMemo(function(){
    return plants.filter(function(p){
      if(removedLatins.indexOf(p.latin)>=0)return false;
      if(p.isCultivar)return false;
      var s=p.status.toLowerCase().replace(/[-\s]/g,"");
      if(s!=="native"&&s!=="nearnative")return false;
      return true;
    });
  },[plants,removedLatins]);

  var layers=useMemo(function(){
    var scored=base.slice().sort(function(a,b){
      return sortBy==="wildlife"?(b.caterpillars||0)-(a.caterpillars||0):a.common.localeCompare(b.common);
    });
    function buildLayer(list,target){
      var result=[];
      var usedGenera={};
      // Pass 1: one per genus
      list.forEach(function(p){
        var genus=p.latin.split(" ")[0];
        if(result.length<target&&!usedGenera[genus]){result.push(p);usedGenera[genus]=true;}
      });
      // Pass 2: backfill
      list.forEach(function(p){
        var already=result.some(function(x){return x.latin===p.latin;});
        if(result.length<target&&!already)result.push(p);
      });
      return result;
    }
    return{
      trees:   buildLayer(scored.filter(function(p){return p.isCanopy;}),HT.canopy),
      woody:   buildLayer(scored.filter(function(p){return p.isWoody&&!p.isCanopy;}),HT.woody),
      perennial:buildLayer(scored.filter(function(p){return p.typeKey==="perennial";}),HT.perennial),
      grass:   buildLayer(scored.filter(function(p){return p.typeKey==="grass";}),HT.grass),
      ground:  buildLayer(scored.filter(function(p){return p.typeKey==="ground";}),HT.ground),
    };
  },[base,sortBy,patchSize]);

  useEffect(function(){if(props.onLayersChange)props.onLayersChange(layers);},[layers]);

  var total=Object.values(layers).reduce(function(s,a){return s+a.length;},0);
  var thinLayers=Object.entries(layers).filter(function(kv){return kv[1].length<(HT[kv[0]]||0)/2;});
  var hasNearNative=base.some(function(p){return p.status==="Near-Native"||p.status==="Near Native";});
  var statusNote=hasNearNative?"natives + near-natives":"natives only";

  var layerDefs=[
    {key:"trees",title:"Canopy trees",emoji:"\ud83c\udf33",plants:layers.trees},
    {key:"woody",title:"Shrubs & understory",emoji:"\ud83c\udf3f",plants:layers.woody},
    {key:"perennial",title:"Flowering perennials",emoji:"\ud83c\udf3c",plants:layers.perennial},
    {key:"grass",title:"Grasses & sedges",emoji:"\ud83c\udf3e",plants:layers.grass},
    {key:"ground",title:"Groundcovers",emoji:"\ud83c\udf40",plants:layers.ground},
  ];

  return h("div",null,
    undoStack.length>0&&h("div",{style:{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:14,padding:"10px 14px",background:"#f0faf0",border:"1px solid #c8e6c9",borderRadius:10}},
      h("button",{onClick:handleUndo,style:{padding:"6px 14px",borderRadius:8,border:"1px solid #a5d6a7",background:"white",color:"#2e5339",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:500}},"\u21a9 Undo"),
      h("button",{onClick:handleReset,style:{padding:"6px 14px",borderRadius:8,border:"1px solid #c8e6c9",background:"white",color:"#888",cursor:"pointer",fontFamily:"inherit",fontSize:13}},"Reset"),
      h("span",{style:{fontSize:12,color:"#5a8a5a",fontStyle:"italic"}},removedLatins.length+" plant"+(removedLatins.length!==1?"s":"")+" removed \u00b7 showing next best replacements from filtered pool")
    ),
    h("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}},
      h("div",{style:{fontSize:14,color:"#888",fontStyle:"italic"}},total+" plants \u00b7 Massachusetts "+statusNote+" \u00b7 straight species only"),
      h("div",{style:{marginLeft:"auto",display:"flex",gap:5,alignItems:"center"}},
        h("button",{onClick:function(){Object.values(layers).flat().forEach(function(p){if(hearts.indexOf(p.latin)<0)onHeart(p.latin);});},style:{padding:"5px 14px",borderRadius:20,border:"none",background:"#2e5339",color:"white",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:500}},"\u2665 Save all"),
        h("button",{onClick:function(){Object.values(layers).flat().map(function(p){return p.latin;}).forEach(function(l){if(hearts.indexOf(l)>=0)onHeart(l);});},style:{padding:"5px 14px",borderRadius:20,border:"1px solid #e0ddd5",background:"transparent",color:"#888",cursor:"pointer",fontFamily:"inherit",fontSize:13}},"Remove all"),
        h("span",{style:{fontSize:12,color:"#aaa"}},"Sort:"),
        [{v:"wildlife",l:"\ud83e\udd8b Insect value"},{v:"alpha",l:"A\u2013Z"}].map(function(x){
          return h("button",{key:x.v,onClick:function(){setSortBy(x.v);},style:{padding:"3px 10px",borderRadius:16,border:"1px solid "+(sortBy===x.v?"#2e5339":"#e0ddd5"),background:sortBy===x.v?"#2e5339":"transparent",color:sortBy===x.v?"white":"#666",cursor:"pointer",fontSize:12,fontFamily:"inherit"}},x.l);
        })
      )
    ),
    (function(){
      var hasSuggestions=concerns.some(function(c){return c.indexOf("shadedby")>=0;})||concerns.indexOf("near_walnut")>=0||!!heightCap;
      return thinLayers.length>0&&hasSuggestions&&h("div",{style:{background:"#fff8e1",border:"1px solid #ffe082",borderRadius:10,padding:"12px 16px",marginBottom:14,fontSize:14,color:"#5d4037"}},
        h("strong",{style:{display:"block",marginBottom:6}},"\u26a0\ufe0f Some layers have limited options"),
        "Try loosening one of these:",
        h("div",{style:{display:"flex",flexWrap:"wrap",gap:6,marginTop:8}},
          concerns.some(function(c){return c.indexOf("shadedby")>=0;})&&h("button",{onClick:function(){onLoosen("shadedby");},style:{background:"white",border:"1px solid #ffe082",borderRadius:6,padding:"4px 10px",fontSize:12,cursor:"pointer",fontFamily:"inherit",color:"#5d4037"}},"Remove shade filter"),
          concerns.indexOf("near_walnut")>=0&&h("button",{onClick:function(){onLoosen("near_walnut");},style:{background:"white",border:"1px solid #ffe082",borderRadius:6,padding:"4px 10px",fontSize:12,cursor:"pointer",fontFamily:"inherit",color:"#5d4037"}},"Remove black walnut filter"),
          heightCap&&h("button",{onClick:function(){onLoosen("height");},style:{background:"white",border:"1px solid #ffe082",borderRadius:6,padding:"4px 10px",fontSize:12,cursor:"pointer",fontFamily:"inherit",color:"#5d4037"}},"Raise height cap")
        )
      );
    })(),
    layerDefs.map(function(ld){
      if(!ld.plants.length)return null;
      return h("div",{key:ld.key,style:{marginBottom:20}},
        h("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:10}},
          h("span",{style:{fontSize:22}},ld.emoji),
          h("span",{style:{fontFamily:"'Literata',serif",fontSize:18,color:"#2e5339"}},ld.title),
          h("span",{style:{background:"#f0ede4",borderRadius:20,padding:"2px 10px",fontSize:13,color:"#888"}},ld.plants.length)
        ),
        ld.plants.map(function(p){
          var isRemoving=removingLatin===p.latin;
          return h("div",{key:p.latin,className:isRemoving?"plant-removing":""},
            h(PlantCard,{plant:p,siteKey:null,hearted:hearts.indexOf(p.latin)>=0,onHeart:onHeart,onRemove:handleRemovePlant})
          );
        })
      );
    })
  );
}

// ── SeedCard ──────────────────────────────────────────────────────────────
function SeedCard(props){
  var plant=props.plant,status=props.status,monthIdx=props.monthIdx;
  var _s=useState(false),open=_s[0],setOpen=_s[1];
  var _m=useState(false),modalOpen=_m[0],setModalOpen=_m[1];
  var ss=STATUS_COLORS_MAP[plant.status]||{bg:"#f5f5f5",text:"#555",label:plant.status};
  var scolor=status==="now"?"#2e7d32":status==="soon"?"#f57f17":"#999";
  var sbg=status==="now"?"#e8f5e9":status==="soon"?"#fff8e1":"#f5f5f5";
  var slabel=status==="now"?"\ud83d\udfe2 Ripe now":status==="soon"?"\ud83d\udfe1 Coming soon":"\u26ab Just passed";

  return h("div",null,
    modalOpen&&h("div",{
      onClick:function(){setModalOpen(false);},
      style:{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,0.6)",overflowY:"auto",padding:"16px"}},
      h("div",{onClick:function(e){e.stopPropagation();},style:{maxWidth:700,margin:"0 auto",paddingTop:40,position:"relative"}},
        h("button",{onClick:function(){setModalOpen(false);},style:{position:"absolute",top:6,right:0,background:"white",border:"none",borderRadius:"50%",width:36,height:36,cursor:"pointer",fontSize:20,color:"#555",zIndex:10,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}},"\u2715"),
        h("div",{style:{background:"white",borderRadius:12,overflow:"hidden"}},
          h(PlantCard,{plant:plant,siteKey:null,hearted:false,onHeart:function(){},edibleOnly:false,medicinalOnly:false,defaultOpen:true,defaultSeedOpen:true})
        )
      )
    ),
    h("div",{style:{background:"white",border:"1px solid #e0ddd5",borderRadius:10,marginBottom:8,overflow:"hidden",opacity:status==="past"?0.75:1}},
      h("div",{onClick:function(){setOpen(!open);},style:{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",cursor:"pointer"}},
        h(PlantThumb,{plant:plant,size:48,radius:8}),
        h("div",{style:{flex:1,minWidth:0}},
          h("div",{style:{fontWeight:500,fontSize:16,marginBottom:2}},plant.common),
          h("div",{style:{fontSize:13,color:"#888",fontStyle:"italic",marginBottom:5}},plant.latin),
          h("div",{style:{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}},
            h("span",{style:{background:sbg,color:scolor,fontSize:12,padding:"2px 10px",borderRadius:20,fontWeight:500}},slabel),
            plant.seedStart&&plant.seedEnd&&h("span",{style:{fontSize:12,color:"#888"}},plant.seedStart+"\u2013"+plant.seedEnd),
            h("span",{style:{background:ss.bg,color:ss.text,fontSize:11,padding:"1px 7px",borderRadius:10,fontWeight:"bold"}},ss.label)
          )
        ),
        h("span",{style:{color:"#aaa",fontSize:14,flexShrink:0}},open?"\u25b2":"\u25bc")
      ),
      open&&h("div",{style:{padding:"0 16px 16px",borderTop:"1px solid #f0ede4"}},
        h("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:14}},
          h("div",{style:{background:"#f0faf0",borderRadius:10,padding:"12px 14px"}},
            h("div",{style:{fontSize:11,color:"#888",letterSpacing:1,textTransform:"uppercase",marginBottom:8}},"\ud83c\udf30 Collecting"),
            h("div",{style:{fontSize:13,lineHeight:1.6,color:"#444"}},plant.seedNotes||"No collecting notes yet.")
          ),
          h("div",{style:{background:"#f0faf0",borderRadius:10,padding:"12px 14px"}},
            h("div",{style:{fontSize:11,color:"#888",letterSpacing:1,textTransform:"uppercase",marginBottom:8}},"\ud83c\udf31 Propagation"),
            h("div",{style:{fontSize:13,lineHeight:1.6,color:"#444"}},plant.propagNotes||"No propagation notes yet.")
          )
        ),
        plant.seedStartIdx>=0&&plant.seedEndIdx>=0&&h("div",{style:{marginTop:12}},
          h("div",{style:{fontSize:11,color:"#aaa",marginBottom:5}},"Seed window"),
          h("div",{style:{display:"flex",gap:2}},
            MONTHS_SHORT.map(function(m,i){
              var s=plant.seedStartIdx,e=plant.seedEndIdx;
              if(e<s)e+=12;
              var mAdj=i<s?i+12:i;
              var active=mAdj>=s&&mAdj<=e;
              var cur2=i===monthIdx;
              return h("div",{key:i,title:m,style:{flex:1,height:6,borderRadius:2,background:cur2?"#2e5339":active?"#8aab8a":"#e0e0e0"}});
            })
          ),
          h("div",{style:{display:"flex",gap:2,marginTop:2}},
            MONTHS_SHORT.map(function(m,i){return h("div",{key:i,style:{flex:1,fontSize:8,color:i===monthIdx?"#2e5339":"#ccc",textAlign:"center"}},m[0]);})
          )
        ),
        h("button",{onClick:function(){setModalOpen(true);},style:{marginTop:14,padding:"7px 16px",borderRadius:8,border:"1px solid #2e5339",background:"white",color:"#2e5339",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:500}},"View full plant details \u2192")
      )
    )
  );
}
// ── BloomCalendar ─────────────────────────────────────────────────────────
function BloomCalendar(props){
  var plants=props.plants,onBack=props.onBack,embedded=props.embedded||false;
  var _m=useState(null),selMonth=_m[0],setSelMonth=_m[1];
  var _s=useState(["native","nearnative"]),statuses=_s[0],setStatuses=_s[1];
  var _src=useState("all"),source=_src[0],setSource=_src[1];
  var _col=useState("all"),colorFilter=_col[0],setColorFilter=_col[1];
  var _ns=useState(false),showNonShowy=_ns[0],setShowNonShowy=_ns[1];

  var _ex=useState([]),exclude=_ex[0],setExclude=_ex[1];

  // Use hearts from props (App state) so changes are reactive; fallback to localStorage for standalone use
  var hearts=props.hearts||useMemo(function(){try{return JSON.parse(localStorage.getItem("ppb_hearts_v2")||"[]");}catch(e){return[];}},[]);

  var eligible=useMemo(function(){
    return plants.filter(function(p){
      if(p.bloomStart<0||p.bloomEnd<0)return false;
      if(!matchStatus(p,statuses))return false;
      if(source==="hearts"&&hearts.indexOf(p.latin)<0)return false;
      if(exclude.indexOf("tree")>=0&&p.typeKey==="tree")return false;
      if(exclude.indexOf("shrub")>=0&&p.typeKey==="shrub")return false;
      if(exclude.indexOf("perennial")>=0&&(p.typeKey==="perennial"||p.typeKey==="ground"||p.typeKey==="vine"))return false;
      if(exclude.indexOf("grass")>=0&&(p.typeKey==="grass"||p.typeKey==="fern"))return false;
      if(!showNonShowy){
        var first=(p.flowerColor||"").split("|")[0].trim().toLowerCase();
        if(!first||NONSHOWY_COLORS[first])return false;
      }
      if(colorFilter!=="all"){
        var cols=(p.flowerColor||"").split("|").map(function(c){return c.trim().toLowerCase();});
        var allowed=BLOOM_COLOR_GROUPS[colorFilter]||[];
        if(!cols.some(function(c){return allowed.indexOf(c)>=0;}))return false;
      }
      return true;
    });
  },[plants,statuses,source,colorFilter,showNonShowy,hearts,exclude]);

  var monthCounts=useMemo(function(){
    var c=new Array(12).fill(0);
    eligible.forEach(function(p){for(var m=0;m<12;m++){if(blooms(p,m))c[m]++;}});
    return c;
  },[eligible]);

  var selPlants=useMemo(function(){
    var base=selMonth===null?eligible:eligible.filter(function(p){return blooms(p,selMonth);});
    return base.slice().sort(function(a,b){return a.common.localeCompare(b.common);});
  },[eligible,selMonth]);

  // Suggestions: plants not in palette blooming selMonth
  var suggestions=useMemo(function(){
    if(selMonth===null||source!=="hearts")return[];
    return plants.filter(function(p){
      if(hearts.indexOf(p.latin)>=0)return false;
      if(!blooms(p,selMonth))return false;
      if(!matchStatus(p,["native","nearnative"]))return false;
      if(colorFilter!=="all"){
        var cols=(p.flowerColor||"").split("|").map(function(c){return c.trim().toLowerCase();});
        var allowed=BLOOM_COLOR_GROUPS[colorFilter]||[];
        if(!cols.some(function(c){return allowed.indexOf(c)>=0;}))return false;
      }
      return true;
    }).sort(function(a,b){return(b.caterpillars||0)-(a.caterpillars||0);}).slice(0,8);
  },[plants,hearts,selMonth,source,colorFilter]);

  function toggleStatus(k){setStatuses(function(prev){return prev.indexOf(k)>=0?prev.filter(function(x){return x!==k;}):[...prev,k];});}

  var _mob=useState(window.innerWidth<700),isMobile=_mob[0],setIsMobile=_mob[1];
  var _mp=useState(null),modalPlant=_mp[0],setModalPlant=_mp[1];
  useEffect(function(){
    function onResize(){setIsMobile(window.innerWidth<700);}
    window.addEventListener("resize",onResize);
    return function(){window.removeEventListener("resize",onResize);};
  },[]);

  var pill=function(label,active,onClick,bg,fg){
    return h("button",{onClick:onClick,style:{padding:"5px 13px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontSize:13,border:"1.5px solid "+(active?(fg||"#2e5339")+"44":"#e0ddd5"),background:active?bg||"#f0faf0":"transparent",color:active?fg||"#2e5339":"#666",fontWeight:active?"500":"normal"}},label);
  };

  return h("div",{style:{fontFamily:"'Poppins',sans-serif",background:"#3a6b47",color:"#2c2c2c"}},
    // Plant detail modal
    modalPlant&&h("div",{
      onClick:function(){setModalPlant(null);},
      style:{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,0.6)",overflowY:"auto",padding:"16px"}},
      h("div",{onClick:function(e){e.stopPropagation();},style:{maxWidth:700,margin:"0 auto",paddingTop:40,position:"relative"}},
        h("button",{onClick:function(){setModalPlant(null);},style:{position:"absolute",top:6,right:0,background:"white",border:"none",borderRadius:"50%",width:36,height:36,cursor:"pointer",fontSize:20,color:"#555",zIndex:10,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}},"\u2715"),
        h("div",{style:{background:"white",borderRadius:12,overflow:"hidden"}},
          h(PlantCard,{plant:modalPlant,siteKey:null,hearted:hearts.indexOf(modalPlant.latin)>=0,onHeart:props.onHeart||function(){},edibleOnly:false,medicinalOnly:false,defaultOpen:true})
        )
      )
    ),
    // Header (standalone only)
    !embedded&&h("div",{style:{background:"#2e5339",color:"#f0ede4",padding:"18px 20px 16px"}},
      h("div",{style:{maxWidth:900,margin:"0 auto",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}},
        h("button",{onClick:onBack,style:{background:"rgba(255,255,255,0.12)",border:"none",color:"#f0ede4",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontFamily:"inherit",fontSize:14}},"\u2190 Plant Palette Builder"),
        h("div",null,
          h("div",{style:{fontFamily:"'Literata',serif",fontSize:22,fontWeight:400}},"\ud83c\udf38 Bloom Calendar"),
          h("div",{style:{fontSize:11,opacity:0.6,letterSpacing:1.5,textTransform:"uppercase",marginTop:2}},"Massachusetts \u00b7 What\u2019s flowering and when")
        )
      )
    ),
    // Filters
    h("div",{style:{position:embedded?"static":"sticky",top:embedded?undefined:140,zIndex:50,background:"rgba(0,0,0,0.15)",borderBottom:"1px solid rgba(255,255,255,0.12)",padding:isMobile?"8px 12px":"12px 20px 10px"}},
      h("div",{style:{maxWidth:900,margin:"0 auto"}},
        h("div",{style:{display:"flex",flexWrap:"wrap",gap:isMobile?5:8,alignItems:"center",marginBottom:isMobile?6:10}},
          // All plants / My palette pills
          h("button",{onClick:function(){setSource("all");},style:{padding:"5px 13px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontSize:13,border:"1.5px solid "+(source==="all"?"rgba(255,255,255,0.8)":"rgba(255,255,255,0.25)"),background:source==="all"?"rgba(255,255,255,0.2)":"transparent",color:source==="all"?"white":"rgba(255,255,255,0.6)",fontWeight:source==="all"?"500":"normal"}},isMobile?"All":"All plants"),
          h("button",{onClick:function(){setSource("hearts");},style:{padding:"5px 13px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontSize:13,border:"1.5px solid "+(source==="hearts"?"rgba(255,255,255,0.8)":"rgba(255,255,255,0.25)"),background:source==="hearts"?"rgba(255,255,255,0.2)":"transparent",color:source==="hearts"?"white":"rgba(255,255,255,0.6)",fontWeight:source==="hearts"?"500":"normal"}},isMobile?"\u2665 Mine":"\u2665 My palette"),
          h("div",{style:{width:1,height:18,background:"rgba(255,255,255,0.2)"}}),
          STATUS_OPTS.map(function(opt){
            var on=statuses.indexOf(opt.key)>=0;
            var shortLabel=isMobile?opt.label.replace(" to MA","").replace("Safe ","").replace(" Cultivar",""):opt.label;
            return h("button",{key:opt.key,onClick:function(){toggleStatus(opt.key);},style:{padding:isMobile?"3px 8px":"5px 13px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontSize:isMobile?11:13,border:"1.5px solid "+(on?"rgba(255,255,255,0.7)":"rgba(255,255,255,0.22)"),background:on?"rgba(255,255,255,0.18)":"transparent",color:on?"white":"rgba(255,255,255,0.6)",fontWeight:on?"500":"normal"}},shortLabel);
          })
        ),
        // Color dot filters — same on mobile and desktop
        h("div",{style:{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:isMobile?8:6}},
          h("span",{style:{fontSize:11,color:"rgba(255,255,255,0.4)",marginRight:2}},"Color:"),
          // All button
          h("button",{onClick:function(){setColorFilter("all");},style:{width:26,height:26,borderRadius:"50%",border:"2px solid "+(colorFilter==="all"?"white":"rgba(255,255,255,0.25)"),cursor:"pointer",background:colorFilter==="all"?"rgba(255,255,255,0.25)":"transparent",color:"white",fontSize:9,fontWeight:500,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}},"all"),
          // Rainbow dots: blue, purple, pink, red, orange, yellow, white
          [{v:"blue",h:"#4A7FC1"},{v:"purple",h:"#7B4EA0"},{v:"pink",h:"#E8829A"},{v:"red",h:"#C0392B"},{v:"orange",h:"#F4741E"},{v:"yellow",h:"#F9C820"},{v:"white",h:"#f0f0ee"}].map(function(x){
            var on=colorFilter===x.v;
            return h("button",{key:x.v,onClick:function(){setColorFilter(x.v);},style:{width:26,height:26,borderRadius:"50%",border:"2px solid "+(on?"white":"transparent"),cursor:"pointer",background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,padding:0}},
              h("div",{style:{width:14,height:14,borderRadius:"50%",background:x.h,border:x.v==="white"?"1px solid rgba(255,255,255,0.35)":"none"}})
            );
          }),
          h("div",{style:{width:1,height:18,background:"rgba(255,255,255,0.15)",margin:"0 2px"}}),
          // Non-showy button with green+brown dots
          h("button",{onClick:function(){setShowNonShowy(!showNonShowy);},style:{display:"flex",alignItems:"center",gap:5,padding:"4px 10px 4px 8px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontSize:12,border:"1.5px solid "+(showNonShowy?"rgba(255,255,255,0.7)":"rgba(255,255,255,0.22)"),background:showNonShowy?"rgba(255,255,255,0.18)":"transparent",color:showNonShowy?"white":"rgba(255,255,255,0.6)"}},
            h("div",{style:{width:9,height:9,borderRadius:"50%",background:"#5a8a4a",flexShrink:0}}),
            h("div",{style:{width:9,height:9,borderRadius:"50%",background:"#8a7355",flexShrink:0}}),
            "+ non-showy"
          )
        ),
        // Exclude type pills
        h("div",{style:{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:isMobile?8:6}},
          h("span",{style:{fontSize:11,color:"rgba(255,255,255,0.4)",marginRight:2}},"Exclude:"),
          [
            {key:"tree",     label:"🌳 Trees"},
            {key:"shrub",    label:"🌿 Shrubs"},
            {key:"perennial",label:"🌸 Perennials"},
            {key:"grass",    label:"🌾 Grasses & ferns"},
          ].map(function(x){
            var on=exclude.indexOf(x.key)>=0;
            return h("button",{key:x.key,onClick:function(){setExclude(function(prev){return on?prev.filter(function(k){return k!==x.key;}):[...prev,x.key];});},
              style:{padding:"3px 11px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontSize:12,
                border:"1.5px solid "+(on?"rgba(255,255,255,0.7)":"rgba(255,255,255,0.22)"),
                background:on?"rgba(220,60,60,0.25)":"transparent",
                color:on?"rgba(255,200,200,1)":"rgba(255,255,255,0.6)",
                fontWeight:on?"500":"normal",
                textDecoration:on?"line-through":"none"}
            },x.label);
          })
        ),
        // Mobile: month spinner
        isMobile&&h("div",{style:{display:"flex",alignItems:"center",gap:10}},
          h("button",{onClick:function(){setSelMonth(selMonth===null?11:selMonth===0?null:(selMonth-1));},style:{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:8,padding:"7px 12px",cursor:"pointer",fontSize:15,color:"white"}},"\u25c0"),
          h("div",{style:{fontFamily:"'Literata',serif",fontSize:18,flex:1,textAlign:"center",color:selMonth!==null?"white":"rgba(255,255,255,0.6)"}},
            selMonth!==null?MONTHS[selMonth]+"  \u2014 "+monthCounts[selMonth]+" blooming":"All months"
          ),
          h("button",{onClick:function(){setSelMonth(selMonth===null?0:selMonth===11?null:(selMonth+1));},style:{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:8,padding:"7px 12px",cursor:"pointer",fontSize:15,color:"white"}},"\u25b6")
        )
      )
    ),
    // Matrix (desktop) or list (mobile)
    isMobile?h("div",{style:{maxWidth:900,margin:"8px auto 0",padding:"0 16px"}},
      eligible.length===0?h("div",{style:{textAlign:"center",padding:"40px",color:"rgba(255,255,255,0.6)",fontStyle:"italic"}},"No plants match your filters."):
      h("div",null,
        eligible.filter(function(p){return selMonth===null||blooms(p,selMonth);}).map(function(p){
          var colors=getBloomColors(p,colorFilter);
          var hex=colors[0]||"#C0BDB8";
          return h("div",{key:p.latin,style:{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"0.5px solid rgba(255,255,255,0.1)",cursor:"pointer"}},
            h("div",{onClick:function(){setModalPlant(p);},style:{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}},
              h(PlantThumb,{plant:p,size:36,radius:6}),
              h("div",{style:{flex:1,minWidth:0}},
                h("div",{style:{fontSize:13,fontWeight:500,color:"white",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},p.common),
                h("div",{style:{display:"flex",gap:2,marginTop:3}},
                  MONTHS_SHORT.map(function(m,i){
                    var active=blooms(p,i);
                    return h("div",{key:i,style:{flex:1,height:6,borderRadius:2,
                      background:active?(selMonth===null||selMonth===i?hex:"rgba(255,255,255,0.2)"):"rgba(255,255,255,0.08)"
                    }});
                  })
                )
              )
            ),
            props.onHeart&&h("button",{onClick:function(){props.onHeart(p.latin);},style:{background:"none",border:"none",cursor:"pointer",fontSize:20,color:hearts.indexOf(p.latin)>=0?"#e57373":"rgba(255,255,255,0.3)",flexShrink:0,lineHeight:1,padding:"4px"}},hearts.indexOf(p.latin)>=0?"\u2665":"\u2661")
          );
        })
      )
    ):
    h("div",{style:{maxWidth:900,margin:"12px auto 0",padding:"0 20px",overflowX:"auto"}},
      eligible.length===0?h("div",{style:{textAlign:"center",padding:"40px",color:"rgba(255,255,255,0.6)",fontStyle:"italic"}},"No plants match your filters."):
      h("table",{style:{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}},
        h("thead",null,
          h("tr",null,
            h("th",{style:{textAlign:"left",fontSize:11,color:"rgba(255,255,255,0.4)",padding:"4px 8px 4px 0",width:150,fontWeight:500}},
              selMonth!==null?"Blooming in "+MONTHS[selMonth]:"Plant"
            ),
            MONTHS_SHORT.map(function(m,i){
              var active=selMonth===i;
              var hasCount=monthCounts[i]>0;
              return h("th",{key:i,onClick:function(){setSelMonth(selMonth===i?null:i);},
                style:{padding:"2px 1px",textAlign:"center",cursor:"pointer",verticalAlign:"bottom"}},
                h("div",{style:{
                  display:"flex",flexDirection:"column",alignItems:"center",gap:2,
                  borderRadius:6,padding:"4px 2px",
                  background:active?"rgba(255,255,255,0.25)":hasCount?"rgba(255,255,255,0.08)":"transparent",
                  border:"1.5px solid "+(active?"rgba(255,255,255,0.7)":hasCount?"rgba(255,255,255,0.2)":"transparent")
                }},
                  h("span",{style:{fontSize:10,fontWeight:active?700:400,color:active?"white":hasCount?"rgba(255,255,255,0.75)":"rgba(255,255,255,0.25)"}},m),
                  h("span",{style:{fontSize:9,color:active?"rgba(255,255,255,0.75)":hasCount?"rgba(255,255,255,0.4)":"transparent",lineHeight:1}},hasCount?monthCounts[i]:"\u00a0")
                )
              );
            })
          )
        ),
        h("tbody",null,
          eligible.filter(function(p){
            return selMonth===null||blooms(p,selMonth);
          }).map(function(p){
            var colors=getBloomColors(p,colorFilter);
            return h("tr",{key:p.latin,style:{borderTop:"0.5px solid rgba(255,255,255,0.08)",cursor:"pointer"},onClick:function(){setModalPlant(p);}},
              h("td",{style:{fontSize:12,padding:"3px 8px 3px 0",color:"#c8e6c0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:150}},
                h("span",{title:p.latin},p.common)
              ),
              MONTHS_SHORT.map(function(m,i){
                var active=blooms(p,i);
                return h("td",{key:i,style:{padding:"2px 1px",textAlign:"center"}},
                  active&&h("div",{style:{display:"flex",gap:1,justifyContent:"center",alignItems:"center",height:24,borderRadius:5,background:"rgba(255,255,255,0.12)",opacity:selMonth!==null&&selMonth!==i?0.4:1,outline:selMonth===i?"2px solid rgba(255,255,255,0.5)":"none",outlineOffset:"1px",cursor:"pointer"},onClick:function(e){e.stopPropagation();setModalPlant(p);}},
                    colors.slice(0,3).map(function(c,ci){
                      var isW=c==="#E8E4DC";
                      return h("div",{key:ci,style:{width:7,height:7,borderRadius:"50%",background:c,border:isW?"1px solid rgba(255,255,255,0.4)":"none",flexShrink:0}});
                    })
                  )
                );
              })
            );
          })
        )
      )
    ), // end desktop table
    // Detail panel (desktop only)
    h("div",{style:{maxWidth:900,margin:"16px auto 0",padding:"0 20px 40px"}},
      h("div",{style:{borderTop:"1px solid rgba(255,255,255,0.15)",paddingTop:14}},
        h("div",{style:{fontFamily:"'Literata',serif",fontSize:20,marginBottom:12,color:"white"}},
          selMonth!==null?MONTHS[selMonth]+" \u2014 "+selPlants.length+" plant"+(selPlants.length!==1?"s":"")+" blooming":selPlants.length+" plant"+(selPlants.length!==1?"s":"")
        ),
        selPlants.length===0&&h("div",{style:{color:"rgba(255,255,255,0.5)",fontStyle:"italic",fontSize:14}},"No plants match your filters."),
        h("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8,marginBottom:20}},
          selPlants.map(function(p){
            var hex=getBloomHex(p)||"#C0BDB8";
            var isWhite=hex==="#E8E4DC";
            return h("div",{key:p.latin,style:{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:8,padding:"10px 12px",borderLeft:"4px solid "+(isWhite?"rgba(255,255,255,0.4)":hex),cursor:"pointer"},onClick:function(){setModalPlant(p);}},
              h("div",{style:{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}},
                h("div",{style:{flex:1,minWidth:0}},
                  h("div",{style:{fontSize:13,fontWeight:500,color:"white",marginBottom:2}},p.common),
                  h("div",{style:{fontSize:11,color:"rgba(255,255,255,0.5)",fontStyle:"italic",marginBottom:4}},p.latin)
                ),
                props.onHeart&&h("button",{onClick:function(e){e.stopPropagation();props.onHeart(p.latin);},style:{background:"none",border:"none",cursor:"pointer",fontSize:18,color:hearts.indexOf(p.latin)>=0?"#e57373":"rgba(255,255,255,0.3)",flexShrink:0,lineHeight:1,padding:"0 0 0 8px"}},hearts.indexOf(p.latin)>=0?"\u2665":"\u2661")
              ),
              h("div",{style:{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}},
                p.flowerColor.split("|").map(function(c,i){
                  var cl=c.trim().toLowerCase();
                  var ch=FLOWER_HEX_MAP[cl]||(NONSHOWY_COLORS[cl]?"#C4C0B8":"#C0BDB8");
                  var cIsWhite=ch==="#E8E4DC";
                  return h("span",{key:i,style:{display:"inline-flex",alignItems:"center",gap:3,fontSize:11,color:"rgba(255,255,255,0.55)"}},
                    h("span",{style:{width:8,height:8,borderRadius:"50%",background:ch,flexShrink:0,border:cIsWhite?"1px solid rgba(255,255,255,0.4)":"none"}}),
                    c.trim()
                  );
                }),
                p.caterpillars>0&&h("span",{style:{fontSize:11,color:"rgba(180,220,180,0.9)",marginLeft:"auto"}},"\ud83e\udd8b"+p.caterpillars)
              )
            );
          })
        ),
        // Suggestions for palette view
        source==="hearts"&&h("div",null,
          h("div",{style:{fontSize:13,color:"rgba(255,255,255,0.5)",letterSpacing:1,textTransform:"uppercase",marginBottom:10,marginTop:4}},
            suggestions.length>0?"Suggest more for "+MONTHS[selMonth]:"Your palette covers "+MONTHS[selMonth]+" well \u2713"
          ),
          suggestions.length>0&&h("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}},
            suggestions.map(function(p){
              var hex=getBloomHex(p)||"#C0BDB8";
              var isWhite=hex==="#E8E4DC";
              return h("div",{key:p.latin,style:{background:"rgba(255,255,255,0.08)",border:"1px dashed rgba(255,255,255,0.2)",borderRadius:8,padding:"10px 12px",borderLeft:"4px solid "+(isWhite?"rgba(255,255,255,0.4)":hex)}},
                h("div",{style:{fontSize:13,fontWeight:500,color:"white",marginBottom:2}},p.common),
                h("div",{style:{fontSize:11,color:"rgba(255,255,255,0.5)",fontStyle:"italic",marginBottom:4}},p.latin),
                h("div",{style:{display:"flex",alignItems:"center",gap:4}},
                  p.flowerColor.split("|").map(function(c,i){
                    var cl=c.trim().toLowerCase();
                    var ch=FLOWER_HEX_MAP[cl]||(NONSHOWY_COLORS[cl]?"#C4C0B8":"#C0BDB8");
                    var cIsWhite=ch==="#E8E4DC";
                    return h("span",{key:i,style:{display:"inline-flex",alignItems:"center",gap:3,fontSize:11,color:"rgba(255,255,255,0.5)"}},
                      h("span",{style:{width:8,height:8,borderRadius:"50%",background:ch,border:cIsWhite?"1px solid rgba(255,255,255,0.4)":"none"}}),
                      c.trim()
                    );
                  }),
                  h("button",{onClick:function(){props.onHeart(p.latin);},style:{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",fontSize:18,color:"rgba(255,255,255,0.3)",lineHeight:1}},"\u2661")
                )
              );
            })
          )
        )
      )
    )
  );
}

var BLOOM_COLOR_GROUPS={
  blue:["blue"],
  purple:["purple","violet","lavender"],
  pink:["pink","coral","rose","magenta"],
  red:["red","maroon","burgundy"],
  orange:["orange"],
  yellow:["yellow","golden","yellow-green","gold"],
  white:["white","cream","silver"],
};

// ── SeedCalendar ──────────────────────────────────────────────────────────
function SeedCalendar(props){
  var plants=props.plants,onBack=props.onBack,embedded=props.embedded||false;
  var now=new Date();
  var _m=useState(now.getMonth()),monthIdx=_m[0],setMonthIdx=_m[1];
  var _s=useState(["native","nearnative"]),statuses=_s[0],setStatuses=_s[1];
  var _t=useState(null),typeFilter=_t[0],setTypeFilter=_t[1];
  var _q=useState(""),search=_q[0],setSearch=_q[1];

  var eligible=useMemo(function(){
    return plants.filter(function(p){
      if(!p.seedStart&&!p.seedNotes&&!p.propagNotes)return false;
      var s=p.status.toLowerCase().replace(/[-\s]/g,"");
      if(s==="invasive"||s==="caution")return false;
      if(search.trim()){
        var q=search.toLowerCase();
        return p.common.toLowerCase().indexOf(q)>=0||p.latin.toLowerCase().indexOf(q)>=0;
      }
      if(!matchStatus(p,statuses))return false;
      if(typeFilter&&p.typeKey!==typeFilter)return false;
      return true;
    });
  },[plants,statuses,typeFilter,search]);

  var monthCounts=useMemo(function(){
    var c=new Array(12).fill(0);
    eligible.forEach(function(p){
      if(p.seedStartIdx<0||p.seedEndIdx<0)return;
      var s=p.seedStartIdx,e=p.seedEndIdx;
      if(e<s)e+=12;
      for(var i=s;i<=e;i++)c[i%12]++;
    });
    return c;
  },[eligible]);

  function seedStatus(p,mi){
    if(p.seedStartIdx<0||p.seedEndIdx<0)return null;
    var s=p.seedStartIdx,e=p.seedEndIdx;
    if(e<s)e+=12;
    var mAdj=mi<s?mi+12:mi;
    if(mAdj>=s&&mAdj<=e)return"now";
    if(mAdj===e+1||(mAdj+12===e+1))return"soon";
    if(mAdj===s-1||(mAdj-12===s-1))return"past";
    return null;
  }

  var ripeNow=useMemo(function(){return eligible.filter(function(p){return seedStatus(p,monthIdx)==="now";});},[eligible,monthIdx]);
  var comingSoon=useMemo(function(){
    return eligible.filter(function(p){
      if(seedStatus(p,monthIdx)==="now")return false;
      return seedStatus(p,(monthIdx+1)%12)==="now";
    });
  },[eligible,monthIdx]);
  var justPassed=useMemo(function(){
    return eligible.filter(function(p){
      if(seedStatus(p,monthIdx)==="now")return false;
      return seedStatus(p,(monthIdx+11)%12)==="now";
    });
  },[eligible,monthIdx]);

  function toggleStatus(k){setStatuses(function(prev){return prev.indexOf(k)>=0?prev.filter(function(x){return x!==k;}):[...prev,k];});}

  function Section(title,dot,count,hint,cards){
    return h("div",null,
      h("div",{style:{display:"flex",alignItems:"center",gap:10,margin:"8px 0 10px",paddingBottom:8,borderBottom:"2px solid #e0ddd5"}},
        h("div",{style:{width:12,height:12,borderRadius:"50%",background:dot,flexShrink:0}}),
        h("div",{style:{fontFamily:"'Literata',serif",fontSize:20}},title),
        h("div",{style:{background:"#f0ede4",borderRadius:20,padding:"2px 10px",fontSize:13,color:"#888"}},count),
        h("div",{style:{fontSize:13,color:"#888",fontStyle:"italic",marginLeft:"auto"}},hint)
      ),
      cards
    );
  }

  return h("div",{style:{fontFamily:"'Poppins',sans-serif",background:"#fafaf7",color:"#2c2c2c"}},
    !embedded&&h("div",{style:{background:"#2e5339",color:"#f0ede4",padding:"18px 20px 16px"}},
      h("div",{style:{maxWidth:900,margin:"0 auto",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}},
        h("button",{onClick:onBack,style:{background:"rgba(255,255,255,0.12)",border:"none",color:"#f0ede4",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontFamily:"inherit",fontSize:14}},"\u2190 Plant Palette Builder"),
        h("div",null,
          h("div",{style:{fontFamily:"'Literata',serif",fontSize:22,fontWeight:400}},"\ud83c\udf31 Seed & Propagation Calendar"),
          h("div",{style:{fontSize:11,opacity:0.6,letterSpacing:1.5,textTransform:"uppercase",marginTop:2}},"Massachusetts \u00b7 What to collect and when")
        )
      )
    ),
    h("div",{style:{position:embedded?"static":"sticky",top:0,zIndex:50,background:"white",borderBottom:"1px solid #e0ddd5",padding:"10px 16px"}},
      h("div",{style:{maxWidth:900,margin:"0 auto"}},
        h("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:8}},
          h("button",{onClick:function(){setMonthIdx(function(i){return(i+11)%12;});},style:{background:"#f0ede4",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:14,flexShrink:0}},"\u25c0"),
          h("div",{style:{fontFamily:"'Literata',serif",fontSize:18,flex:1,textAlign:"center"}},MONTHS[monthIdx]),
          h("button",{onClick:function(){setMonthIdx(now.getMonth());},style:{background:"#2e5339",color:"white",border:"none",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontFamily:"inherit",fontSize:12,flexShrink:0}},"Today"),
          h("button",{onClick:function(){setMonthIdx(function(i){return(i+1)%12;});},style:{background:"#f0ede4",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:14,flexShrink:0}},"\u25b6")
        ),
        h("div",{style:{display:"flex",gap:3}},
          MONTHS_SHORT.map(function(m,i){
            var active=i===monthIdx;
            var hasCount=monthCounts[i]>0;
            return h("div",{key:i,onClick:function(){setMonthIdx(i);},style:{flex:1,textAlign:"center",cursor:"pointer",minWidth:0}},
              h("div",{style:{
                display:"flex",flexDirection:"column",alignItems:"center",gap:2,
                borderRadius:6,padding:"4px 2px",
                background:active?"#2e5339":hasCount?"#f0f7f0":"transparent",
                border:"1.5px solid "+(active?"#2e5339":hasCount?"#c8e6c9":"transparent")
              }},
                h("span",{style:{fontSize:10,fontWeight:active?700:400,color:active?"white":hasCount?"#2e5339":"#ccc"}},m),
                h("span",{style:{fontSize:9,color:active?"rgba(255,255,255,0.75)":hasCount?"#4a7c59":"#ddd",lineHeight:1}},hasCount?monthCounts[i]:"\u00a0")
              )
            );
          })
        )
      )
    ),
    h("div",{style:{maxWidth:900,margin:"12px auto 0",padding:"0 20px"}},
      h("div",{style:{position:"relative"}},
        h("input",{value:search,onChange:function(ev){setSearch(ev.target.value);},placeholder:"Search seed plants\u2026",style:{width:"100%",padding:"9px 36px 9px 16px",border:"1.5px solid #e0ddd5",borderRadius:10,fontFamily:"inherit",fontSize:16,background:"white",outline:"none",color:"#2c2c2c"}}),
        search&&h("button",{onClick:function(){setSearch("");},style:{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#888"}},"\u00d7")
      )
    ),
    h("div",{style:{maxWidth:900,margin:"16px auto 0",padding:"0 20px",display:"flex",gap:7,flexWrap:"wrap",alignItems:"center"}},
      STATUS_OPTS.filter(function(opt){return opt.key!=="invasive"&&opt.key!=="caution";}).map(function(opt){
        var on=statuses.indexOf(opt.key)>=0;
        return h("button",{key:opt.key,onClick:function(){toggleStatus(opt.key);},style:{padding:"5px 13px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontSize:13,border:"1.5px solid "+(on?opt.fg+"44":"#e0ddd5"),background:on?opt.bg:"transparent",color:on?opt.fg:"#666"}},opt.label);
      }),
      h("div",{style:{width:1,height:18,background:"#e0ddd5"}}),
      [{k:"tree",e:"\ud83c\udf33"},{k:"perennial",e:"\ud83c\udf3c"},{k:"grass",e:"\ud83c\udf3e"}].map(function(x){
        var g=PLANT_TYPES.find(function(g){return g.key===x.k;});
        return h("button",{key:x.k,onClick:function(){setTypeFilter(typeFilter===x.k?null:x.k);},style:{padding:"5px 13px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontSize:13,border:"1.5px solid "+(typeFilter===x.k?"#2e5339":"#e0ddd5"),background:typeFilter===x.k?"#f0faf0":"transparent",color:typeFilter===x.k?"#2e5339":"#666"}},x.e+" "+g.label);
      }),
      h("span",{style:{fontSize:13,color:"#888",fontStyle:"italic",marginLeft:"auto"}},ripeNow.length+" plants with seeds ready in "+MONTHS[monthIdx])
    ),
    h("div",{style:{maxWidth:900,margin:"0 auto",padding:"16px 20px 80px"}},
      ripeNow.length>0&&Section("Ripe now","#2e7d32",ripeNow.length,"Collect this month",ripeNow.map(function(p){return h(SeedCard,{key:p.latin,plant:p,status:"now",monthIdx:monthIdx});})),
      comingSoon.length>0&&h("div",{style:{marginTop:24}},Section("Coming up","#f57f17",comingSoon.length,"Seeds ripening in "+MONTHS[(monthIdx+1)%12],comingSoon.map(function(p){return h(SeedCard,{key:p.latin,plant:p,status:"soon",monthIdx:monthIdx});}))),
      justPassed.length>0&&h("div",{style:{marginTop:24}},Section("Just passed","#999",justPassed.length,"Seeds ripe in "+MONTHS[(monthIdx+11)%12]+" \u2014 did you collect?",justPassed.map(function(p){return h(SeedCard,{key:p.latin,plant:p,status:"past",monthIdx:monthIdx});}))),
      ripeNow.length===0&&comingSoon.length===0&&justPassed.length===0&&h("div",{style:{textAlign:"center",padding:"60px 20px",color:"#888"}},
        h("div",{style:{fontSize:40,marginBottom:12}},"\ud83c\udf31"),
        h("div",{style:{fontStyle:"italic",fontSize:16}},"No seed collection activity around "+MONTHS[monthIdx]+"."),
        h("div",{style:{fontSize:13,marginTop:8}},"Try browsing other months using the timeline above.")
      )
    ),
    h("div",{style:{textAlign:"center",padding:"20px 16px",color:"#aaa",fontSize:12,borderTop:"1px solid #e0ddd5"}},"Seed timing is approximate \u2014 observe your plants for best results.")
  );
}

// ── ShareBar ──────────────────────────────────────────────────────────────
function ShareBar(props){
  var label=props.label,onLabelChange=props.onLabelChange;
  var _e=useState(false),editing=_e[0],setEditing=_e[1];
  var _v=useState(label||""),val=_v[0],setVal=_v[1];
  var _c=useState(false),copied=_c[0],setCopied=_c[1];
  function save(){onLabelChange(val.trim());setEditing(false);}
  function copy(){navigator.clipboard.writeText(window.location.href).then(function(){setCopied(true);setTimeout(function(){setCopied(false);},2000);});}
  return h("div",{className:"no-print",style:{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center",background:"white",border:"1px solid #e0ddd5",borderRadius:10,padding:"9px 14px",marginTop:10,marginBottom:4}},
    editing?h("div",{style:{display:"flex",gap:7,flex:1,flexWrap:"wrap"}},
      h("input",{autoFocus:true,value:val,onChange:function(ev){setVal(ev.target.value);},onKeyDown:function(ev){if(ev.key==="Enter")save();if(ev.key==="Escape")setEditing(false);},placeholder:"Name this palette\u2026",style:{flex:1,minWidth:140,border:"1px solid #ddd",borderRadius:6,padding:"5px 10px",fontSize:14,fontFamily:"inherit",outline:"none"}}),
      h("button",{onClick:save,style:btn("#2e5339","white",{padding:"5px 14px",fontSize:13})},"Save"),
      h("button",{onClick:function(){setEditing(false);},style:btn("#f0ede4","#555",{padding:"5px 10px",fontSize:13})},"Cancel")
    ):h("div",{style:{display:"flex",gap:7,flexWrap:"wrap"}},
      h("button",{onClick:function(){setEditing(true);},style:btn("#f0ede4","#555",{fontSize:13,padding:"5px 12px"})},label?"\u270f\ufe0f "+label:"\ud83d\udccb Name this palette"),
      h("button",{onClick:copy,style:btn(copied?"#e8f5e9":"#f0ede4",copied?"#2e7d32":"#555",{fontSize:13,padding:"5px 12px"})},copied?"\u2713 Copied!":"\ud83d\udd17 Copy link"),
      h("button",{onClick:function(){window.print();},style:btn("#f0ede4","#555",{fontSize:13,padding:"5px 12px"})},"\ud83d\udda8\ufe0f Print")
    )
  );
}

// ── FilterDrawer ──────────────────────────────────────────────────────────
function FilterDrawer(props){
  var open=props.open,onClose=props.onClose,filters=props.filters,
      onChange=props.onChange,flowerColors=props.flowerColors,
      inferredSun=props.inferredSun,isMobile=props.isMobile,
      zone=props.zone,onSetZone=props.onSetZone,source=props.source;
  if(!open)return null;
  var visibleStatuses=source==="palette"?STATUS_OPTS.filter(function(o){return o.key!=="invasive"&&o.key!=="caution";}):STATUS_OPTS;
  var f=filters;
  function set(patch){onChange(Object.assign({},f,patch));}
  function togSt(k){
    var badPlants=["invasive","caution"];
    var goodPlants=["native","nearnative","cultivar","nonnative"];
    set({statuses:(function(){
      var cur=f.statuses;
      if(cur.indexOf(k)>=0) return cur.filter(function(v){return v!==k;});
      var next=[...cur,k];
      if(badPlants.indexOf(k)>=0) next=next.filter(function(v){return badPlants.indexOf(v)>=0;});
      if(goodPlants.indexOf(k)>=0) next=next.filter(function(v){return goodPlants.indexOf(v)>=0;});
      return next;
    })()});
  }
  function togCx(k){set({concerns:f.concerns.indexOf(k)>=0?f.concerns.filter(function(v){return v!==k;}):[...f.concerns,k]});}
  function togPt(k){set({ptypes:f.ptypes.indexOf(k)>=0?f.ptypes.filter(function(v){return v!==k;}):[...f.ptypes,k]});}
  function togFl(c){set({rflower:f.rflower.indexOf(c)>=0?f.rflower.filter(function(v){return v!==c;}):[...f.rflower,c]});}

  useEffect(function(){
    var prev=document.body.style.overflow;
    document.body.style.overflow="hidden";
    return function(){document.body.style.overflow=prev;};
  },[]);

  function resetAll(){
    onChange({statuses:["native","nearnative"],ptypes:[],heightCap:null,concerns:[],moisture:null,sun:null,irrigated:false,rflower:[],rwinter:false,edibleOnly:false,medicinalOnly:false,deerLevel:null,rabbitLevel:null,voleLevel:null,dogsLevel:null,catsLevel:null,childrenLevel:null});
    onSetZone(null);
    if(props.onClearSearch)props.onClearSearch();
  }

  function P(label,active,onClick,bg,fg){
    return h("button",{onClick:onClick,style:{padding:"7px 14px",borderRadius:20,cursor:"pointer",fontFamily:"inherit",fontSize:14,border:"1.5px solid "+(active?fg||"#2e5339":"#e0ddd5"),background:active?bg||"#f0faf0":"transparent",color:active?fg||"#2e5339":"#666",fontWeight:active?"500":"normal"}},label);
  }

  var panelStyle=isMobile
    ?{position:"fixed",left:0,right:0,bottom:0,background:"white",borderRadius:"16px 16px 0 0",zIndex:200,maxHeight:"92vh",display:"flex",flexDirection:"column",overscrollBehavior:"contain"}
    :{position:"fixed",top:0,right:0,bottom:0,width:380,background:"white",borderLeft:"1px solid #e0ddd5",zIndex:200,display:"flex",flexDirection:"column",overscrollBehavior:"contain"};

  var handleStyle=isMobile
    ?{width:40,height:4,background:"#ccc",borderRadius:2,margin:"12px auto 0"}
    :null;

  return h("div",null,
    h("div",{onClick:function(ev){ev.preventDefault();ev.stopPropagation();onClose();},style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:199},onTouchMove:function(ev){ev.stopPropagation();},onTouchEnd:function(ev){ev.stopPropagation();}}),
    h("div",{style:panelStyle},
      isMobile&&h("div",{style:handleStyle}),
      h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 20px",borderBottom:"1px solid #e0ddd5",flexShrink:0}},
        h("div",{style:{fontFamily:"'Literata',serif",fontSize:18}},"Filters"),
        h("button",{onClick:onClose,style:{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#888"}},"\u2715")
      ),
      h("div",{style:{padding:"16px 20px",display:"flex",flexDirection:"column",gap:18,overflowY:"auto",flex:1}},
        h("div",null,
          h("div",{style:{fontSize:12,color:"#aaa",letterSpacing:1,textTransform:"uppercase",marginBottom:8}},"Site type"),
          h("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}},
            MICROZONES.map(function(z){var on=zone===z.key;return h("button",{key:z.key,onClick:function(){onSetZone(on?null:z.key);},style:{padding:"7px 10px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:13,border:"1.5px solid "+(on?"#2e5339":"#e0ddd5"),background:on?"#2e5339":"transparent",color:on?"white":"#666",textAlign:"left",display:"flex",alignItems:"center",gap:6}},z.emoji," ",z.label);})
          )
        ),
        h("div",null,
          h("div",{style:{fontSize:12,color:"#aaa",letterSpacing:1,textTransform:"uppercase",marginBottom:8}},"Include"),
          h("div",{style:{display:"flex",flexWrap:"wrap",gap:7}},visibleStatuses.map(function(opt){return P(opt.label,f.statuses.indexOf(opt.key)>=0,function(){togSt(opt.key);},opt.bg,opt.fg);}))
        ),
        h("div",null,
          h("div",{style:{fontSize:12,color:"#aaa",letterSpacing:1,textTransform:"uppercase",marginBottom:8}},"Plant type"),
          h("div",{style:{display:"flex",flexWrap:"wrap",gap:7}},PLANT_TYPES.map(function(g){return P(g.emoji+" "+g.label,f.ptypes.indexOf(g.key)>=0,function(){togPt(g.key);});}))
        ),
        h("div",null,
          h("div",{style:{fontSize:12,color:"#aaa",letterSpacing:1,textTransform:"uppercase",marginBottom:8}},"Max height"),
          h("div",{style:{display:"flex",alignItems:"center",gap:8}},
            h("input",{type:"number",min:1,max:120,value:f.heightCap||"",onChange:function(ev){var v=parseFloat(ev.target.value);set({heightCap:v>0?v:null});},placeholder:"e.g. 8 for shrubs, 25 for small trees",style:{border:"1.5px solid #e0ddd5",borderRadius:8,padding:"8px 12px",fontFamily:"inherit",fontSize:14,outline:"none",flex:1}}),
            f.heightCap&&h("span",{style:{fontSize:14,color:"#888"}},"ft"),
            f.heightCap&&h("button",{onClick:function(){set({heightCap:null});},style:{background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#aaa"}},"\u2715")
          )
        ),
        h("div",null,
          h("div",{style:{fontSize:12,color:"#aaa",letterSpacing:1,textTransform:"uppercase",marginBottom:8}},"Moisture"),
          h("div",{style:{display:"flex",flexWrap:"wrap",gap:7}},
            [{v:"dry",l:"\ud83c\udfdc\ufe0f Dry"},{v:"average",l:"\ud83c\udf31 Average"},{v:"moist",l:"\ud83d\udca7 Moist"}].map(function(o){return P(o.l,f.moisture===o.v,function(){set({moisture:f.moisture===o.v?null:o.v});});}),
            h("label",{style:{display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:14,padding:"6px 0"}},
              h("input",{type:"checkbox",checked:f.irrigated,onChange:function(ev){set({irrigated:ev.target.checked});},style:{accentColor:"#2e5339",width:16,height:16}}),
              "\ud83d\udca6 Will be irrigated"
            )
          )
        ),
        h("div",null,
          h("div",{style:{fontSize:12,color:"#aaa",letterSpacing:1,textTransform:"uppercase",marginBottom:8}},inferredSun?"Sun \u2014 inferred from site \u2713":"Sun"),
          inferredSun?h("div",{style:{fontSize:15,color:"#2e5339",fontWeight:500,padding:"6px 0"}},inferredSun==="full"?"\u2600\ufe0f Full sun":inferredSun==="shade"?"\ud83c\udf25\ufe0f Shade":"\u26c5 Part shade"):
          h("div",{style:{display:"flex",gap:7,flexWrap:"wrap"}},
            [{v:"full",l:"\u2600\ufe0f Full sun"},{v:"part",l:"\u26c5 Part shade"},{v:"shade",l:"\ud83c\udf25\ufe0f Shade"}].map(function(o){return P(o.l,f.sun===o.v,function(){set({sun:f.sun===o.v?null:o.v});});})
          )
        ),
        h("div",null,
          h("div",{style:{fontSize:12,color:"#aaa",letterSpacing:1,textTransform:"uppercase",marginBottom:8}},"Shaded by"),
          h("div",{style:{display:"flex",flexWrap:"wrap",gap:7}},CONCERN_OPTS.filter(function(c){return c.group==="shaded";}).map(function(c){return P(c.emoji+" "+c.label,f.concerns.indexOf(c.key)>=0,function(){togCx(c.key);});}))
        ),
        h("div",null,
          h("div",{style:{fontSize:12,color:"#aaa",letterSpacing:1,textTransform:"uppercase",marginBottom:8}},"Near / Site"),
          h("div",{style:{display:"flex",flexWrap:"wrap",gap:7}},CONCERN_OPTS.filter(function(c){return c.group==="near"||c.group==="site";}).map(function(c){return P(c.emoji+" "+c.label,f.concerns.indexOf(c.key)>=0,function(){togCx(c.key);});}))
        ),
        h("div",null,
          h("div",{style:{fontSize:12,color:"#aaa",letterSpacing:1,textTransform:"uppercase",marginBottom:8}},"Concerns"),
          h("div",{style:{display:"flex",flexWrap:"wrap",gap:7}},CONCERN_OPTS.filter(function(c){return c.group==="concern";}).map(function(c){return P(c.emoji+" "+c.label,f.concerns.indexOf(c.key)>=0,function(){togCx(c.key);});}))
        ),
        flowerColors.length>0&&h("div",null,
          h("div",{style:{fontSize:12,color:"#aaa",letterSpacing:1,textTransform:"uppercase",marginBottom:8}},"Flower color"),
          h("div",{style:{display:"flex",flexWrap:"wrap",gap:7}},flowerColors.map(function(c){
            return h("button",{key:c,onClick:function(){togFl(c);},style:{display:"inline-flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:20,border:"1.5px solid "+(f.rflower.indexOf(c)>=0?"#2e5339":"#e0ddd5"),background:f.rflower.indexOf(c)>=0?"#f0faf0":"transparent",cursor:"pointer",fontSize:13,fontFamily:"inherit",color:f.rflower.indexOf(c)>=0?"#2e5339":"#666"}},
              h("div",{style:{width:11,height:11,borderRadius:"50%",background:COLOR_MAP[c]||"#ccc",border:c==="white"?"1px solid #ccc":"none"}}),c
            );
          }))
        ),
        h("div",null,
          h("div",{style:{fontSize:12,color:"#aaa",letterSpacing:1,textTransform:"uppercase",marginBottom:8}},"Browse pressure"),
          h("div",{style:{display:"flex",flexDirection:"column",gap:10}},
            [{title:"\ud83e\udd8c Deer",key:"deerLevel",val:f.deerLevel,setFn:function(v){set({deerLevel:v});}},
             {title:"\ud83d\udc07 Rabbit",key:"rabbitLevel",val:f.rabbitLevel,setFn:function(v){set({rabbitLevel:v});}},
             {title:"\ud83d\udc2d Vole",key:"voleLevel",val:f.voleLevel,setFn:function(v){set({voleLevel:v});}}].map(function(row){
              return h("div",{key:row.key,style:{display:"flex",alignItems:"center",gap:8}},
                h("div",{style:{fontSize:13,color:"#555",width:70,flexShrink:0}},row.title),
                h("div",{style:{display:"flex",gap:5,flexWrap:"wrap"}},
                  [{v:null,l:"Any"},{v:"high",l:"Resistant"},{v:"mod",l:"Highly resistant"}].map(function(o){
                    return h("button",{key:String(o.v),onClick:function(){row.setFn(o.v);},style:pill(row.val===o.v,row.val===o.v)},o.l);
                  })
                )
              );
            })
          )
        ),
        h("div",null,
          h("div",{style:{fontSize:12,color:"#aaa",letterSpacing:1,textTransform:"uppercase",marginBottom:8}},"Safety \u2014 exclude toxic plants for:"),
          h("div",{style:{display:"flex",gap:16,flexWrap:"wrap"}},
            h("label",{style:{display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:14}},
              h("input",{type:"checkbox",checked:!!f.dogsLevel,onChange:function(ev){set({dogsLevel:ev.target.checked?"mild":null});},style:{accentColor:"#2e5339",width:16,height:16}}),
              "\ud83d\udc15 Dogs"
            ),
            h("label",{style:{display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:14}},
              h("input",{type:"checkbox",checked:!!f.catsLevel,onChange:function(ev){set({catsLevel:ev.target.checked?"mild":null});},style:{accentColor:"#2e5339",width:16,height:16}}),
              "\ud83d\udc08 Cats"
            ),
            h("label",{style:{display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:14}},
              h("input",{type:"checkbox",checked:!!f.childrenLevel,onChange:function(ev){set({childrenLevel:ev.target.checked?"mild":null});},style:{accentColor:"#2e5339",width:16,height:16}}),
              "\ud83d\udc76 Children"
            )
          )
        ),
        h("div",null,
          h("div",{style:{fontSize:12,color:"#aaa",letterSpacing:1,textTransform:"uppercase",marginBottom:8}},"Other"),
          h("label",{style:{display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:14}},
            h("input",{type:"checkbox",checked:f.rwinter,onChange:function(ev){set({rwinter:ev.target.checked});},style:{accentColor:"#2e5339",width:16,height:16}}),
            "\u2744\ufe0f Winter interest"
          ),
          h("label",{style:{display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:14,marginTop:10}},
            h("input",{type:"checkbox",checked:f.edibleOnly||false,onChange:function(ev){set({edibleOnly:ev.target.checked});},style:{accentColor:"#2e5339",width:16,height:16}}),
            "\ud83c\udf74 Edible"
          ),
          h("label",{style:{display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:14,marginTop:10}},
            h("input",{type:"checkbox",checked:f.medicinalOnly||false,onChange:function(ev){set({medicinalOnly:ev.target.checked});},style:{accentColor:"#2e5339",width:16,height:16}}),
            "\u2615 Medicinal"
          )
        ),
        ),
      h("div",{style:{padding:"12px 20px",paddingBottom:isMobile?"calc(58px + env(safe-area-inset-bottom, 20px))":"20px",borderTop:"1px solid #e0ddd5",flexShrink:0,background:"white",display:"flex",gap:8}},
        h("button",{onClick:resetAll,style:btn("#fff5f5","#c62828",{borderRadius:10,padding:"13px",fontSize:14,flex:1,border:"1px solid #ffcdd2"})},"✕ Clear all"),
        h("button",{onClick:onClose,style:btn("#2e5339","white",{borderRadius:10,padding:"13px",fontSize:15,flex:2})},"Show results")
      )
    )
  );
}

// ── PaletteView ───────────────────────────────────────────────────────────
function PaletteView(props){
  var hearts=props.hearts,plants=props.plants,onHeart=props.onHeart,onClear=props.onClear,onGoToPlants=props.onGoToPlants;
  var mixFiltered=props.mixFiltered||[],patchSize=props.patchSize||20,concerns=props.concerns||[],onLoosen=props.onLoosen||function(){};
  var activeFilterCount=props.activeFilterCount||0,onOpenFilters=props.onOpenFilters||function(){};
  var isMobile=props.isMobile||false;
  var _s=useState(""),search=_s[0],setSearch=_s[1];
  var _c=useState(false),copied=_c[0],setCopied=_c[1];
  var _sm=useState(false),showMix=_sm[0],setShowMix=_sm[1];
  var _ml=useState(null),mixLayers=_ml[0],setMixLayers=_ml[1];
  var _tf=useState(null),typeFilter=_tf[0],setTypeFilter=_tf[1];
  var resultsRef=useRef(null);

  function handleTileClick(key){
    setTypeFilter(function(cur){return cur===key?null:key;});
    setTimeout(function(){if(resultsRef.current)resultsRef.current.scrollIntoView({behavior:"smooth",block:"start"});},50);
  }

  var hearted=useMemo(function(){return plants.filter(function(p){return hearts.indexOf(p.latin)>=0;});},[plants,hearts]);

  var LAYER_KEY_MAP={trees:"tree",woody:"shrub",perennial:"perennial",grass:"grass",ground:"ground"};
  var counts=useMemo(function(){
    var c={tree:0,shrub:0,perennial:0,grass:0,fern:0,ground:0,vine:0};
    hearted.forEach(function(p){if(c[p.typeKey]!==undefined)c[p.typeKey]++;});
    if(showMix&&mixLayers){
      var heartedSet=new Set(hearted.map(function(p){return p.latin;}));
      Object.entries(mixLayers).forEach(function(kv){
        var tileKey=LAYER_KEY_MAP[kv[0]];
        if(!tileKey)return;
        kv[1].forEach(function(p){if(!heartedSet.has(p.latin))c[tileKey]++;});
      });
    }
    return c;
  },[hearted,showMix,mixLayers]);

  var results=useMemo(function(){
    var base=hearted;
    if(typeFilter)base=base.filter(function(p){return p.typeKey===typeFilter;});
    if(!search.trim())return base;
    var q=search.toLowerCase();
    return base.filter(function(p){return p.common.toLowerCase().indexOf(q)>=0||p.latin.toLowerCase().indexOf(q)>=0;});
  },[hearted,search,typeFilter]);

  function copyLink(){
    var p=new URLSearchParams();
    p.set("view","palette");
    p.set("hearts",hearts.join(","));
    var url=location.origin+location.pathname+"?"+p.toString();
    if(isMobile&&navigator.share){
      navigator.share({title:"My plant palette",url:url}).catch(function(){});
    } else {
      navigator.clipboard.writeText(url)
        .then(function(){setCopied(true);setTimeout(function(){setCopied(false);},2000);})
        .catch(function(){
          var ta=document.createElement("textarea");
          ta.value=url;ta.style.position="fixed";ta.style.opacity="0";
          document.body.appendChild(ta);ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          setCopied(true);setTimeout(function(){setCopied(false);},2000);
        });
    }
  }

  return h("div",null,
    // Palette header bar — sticky on desktop only
    h("div",{style:isMobile?{marginBottom:8}:{position:"sticky",top:140,zIndex:50,background:"#fafaf7",paddingBottom:8,marginBottom:4}},
    h("div",{style:{background:"white",border:"1px solid #e0ddd5",borderRadius:12,padding:"14px 16px"}},
      h("div",{style:{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:10}},
        hearted.length>0&&h("button",{onClick:copyLink,style:btn(copied?"#e8f5e9":"#2e5339",copied?"#2e7d32":"white",{fontSize:13,padding:"8px 18px",fontWeight:600})},isMobile?"\ud83d\udce4 Share":copied?"\u2713 Link copied!":"\ud83d\udd17 Copy link"),
        h("button",{onClick:function(){window.print();},style:btn("#f0ede4","#2c2c2c",{fontSize:13,padding:"6px 12px"})},"\ud83d\udda8\ufe0f Print"),
        h("button",{onClick:function(){setShowMix(function(v){return !v;});},style:btn(showMix?"#2e5339":"#f0ede4",showMix?"white":"#2c2c2c",{fontSize:13,padding:"6px 12px"})},"\ud83c\udf3f "+(showMix?"Hide mix":"Suggest a mix")),
        h("button",{onClick:onOpenFilters,style:btn(activeFilterCount>0?"#f0faf0":"#f0ede4",activeFilterCount>0?"#2e5339":"#2c2c2c",{fontSize:13,padding:"6px 12px",border:activeFilterCount>0?"1.5px solid #2e5339":undefined})},"\u25a4 Filters"+(activeFilterCount>0?" ("+activeFilterCount+")":"")),
        hearted.length>0&&h("button",{onClick:function(){if(window.confirm("Clear all "+hearted.length+" plants from your palette?"))onClear();},style:btn("#fff5f5","#c62828",{fontSize:13,padding:"6px 12px",border:"1px solid #ffcdd2"})},"\u2715 Clear")
      ),
      h("div",{style:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6}},
        [{k:"tree",e:"\ud83c\udf33",l:"Trees"},{k:"shrub",e:"\ud83c\udf3f",l:"Shrubs"},{k:"perennial",e:"\ud83c\udf3c",l:"Perennials"},{k:"grass",e:"\ud83c\udf3e",l:"Grasses"},{k:"fern",e:"\ud83c\udf3f",l:"Ferns"},{k:"ground",e:"\ud83c\udf40",l:"Groundcover"},{k:"vine",e:"\ud83c\udf3f",l:"Vines"}].map(function(x){
          var on=typeFilter===x.k;
          return h("div",{key:x.k,onClick:function(){handleTileClick(x.k);},style:{background:on?"#e1f5ee":"#f0ede4",borderRadius:8,padding:"6px 4px",textAlign:"center",cursor:"pointer",border:"1.5px solid "+(on?"#2e5339":"transparent")}},
            h("div",{style:{fontSize:16,fontWeight:500,color:counts[x.k]>0?"#2e5339":"#ccc",lineHeight:1.2}},counts[x.k]),
            h("div",{style:{fontSize:9,color:on?"#2e5339":"#888",marginTop:1}},x.l)
          );
        })
      )
    )),
    // Mix suggestion panel
    showMix&&h("div",{style:{background:"white",border:"1px solid #e0ddd5",borderRadius:12,padding:"14px 16px",marginBottom:12}},
      h(HabitatView,{plants:mixFiltered,concerns:concerns,heightCap:null,patchSize:patchSize,hearts:hearts,onHeart:onHeart,onLoosen:onLoosen,onLayersChange:setMixLayers})
    ),
    // Search within palette
    h("div",{style:{position:"relative",marginBottom:12}},
      h("input",{value:search,onChange:function(ev){setSearch(ev.target.value);},placeholder:"Search your palette\u2026",style:{width:"100%",padding:"10px 40px 10px 16px",border:"1.5px solid #e0ddd5",borderRadius:10,fontFamily:"inherit",fontSize:16,background:"white",outline:"none",color:"#2c2c2c"}}),
      search&&h("button",{onClick:function(){setSearch("");},style:{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#aaa"}},"\u2715")
    ),
    // Empty state
    hearted.length===0&&!showMix&&h("div",{style:{textAlign:"center",padding:"50px 20px",color:"#888"}},
      h("div",{style:{fontSize:40,marginBottom:12}},"\u2661"),
      h("div",{style:{fontStyle:"italic",fontSize:16,marginBottom:6}},"Your palette is empty"),
      h("div",{style:{fontSize:13,color:"#aaa",marginBottom:20}},"Browse plants and heart what you like, or get a suggested starting mix."),
      h("div",{style:{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}},
        h("button",{onClick:function(){setShowMix(true);},style:{background:"#2e5339",color:"white",border:"none",borderRadius:8,padding:"10px 20px",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:500}},"\ud83c\udf3f Suggest a mix"),
        h("button",{onClick:onGoToPlants,style:{background:"white",color:"#2e5339",border:"1.5px solid #2e5339",borderRadius:8,padding:"10px 20px",cursor:"pointer",fontFamily:"inherit",fontSize:14}},"Browse plants \u2192")
      )
    ),
    // No results
    hearted.length>0&&results.length===0&&h("div",{style:{textAlign:"center",padding:"40px 20px",color:"#888"}},
      h("div",{style:{fontSize:40,marginBottom:12}},"\ud83e\udd14"),
      typeFilter&&!search?
        h("div",{style:{fontStyle:"italic",fontSize:15}},
          "No "+typeFilter+"s in your palette yet."
        ):
        h("div",null,
          h("div",{style:{fontStyle:"italic",fontSize:15,marginBottom:12}},"\u201c"+search+"\u201d isn\u2019t in your palette yet."),
          h("button",{style:{background:"#2e5339",color:"white",border:"none",borderRadius:8,padding:"10px 20px",cursor:"pointer",fontFamily:"inherit",fontSize:14}},"+ Suggest this plant")
        )
    ),
    // Plant cards
    h("div",{ref:resultsRef},
      results.map(function(p){
        return h(PlantCard,{key:p.latin,plant:p,siteKey:null,hearted:true,onHeart:onHeart});
      })
    )
  );
}

// ── HomeView ──────────────────────────────────────────────────────────────
function HomeView(props){
  var onNavigate=props.onNavigate,isMobile=props.isMobile;
  var cards=[
    {key:"plants", emoji:"🔍", title:"Browse & discover plants",
     body:"Explore 400+ plants vetted for Massachusetts — natives, near-natives, and ecologically compatible species. Filter by sun, moisture, site conditions, and more."},
    {key:"palette", emoji:"♥", title:"Build your palette",
     body:"Save plants you love, then use Suggest a mix to get a layered habitat combination — canopy, shrubs, perennials, and groundcovers — ranked by wildlife value."},
    {key:"bloom",  emoji:"🌸", title:"Explore bloom by month",
     body:"See what's flowering when across your whole plant list. Filter by color, type, and palette to plan for season-long interest."},
    {key:"seeds",  emoji:"🌰", title:"Save seeds & propagate",
     body:"Know what's ripening when, how to collect it, and how to grow more of what you already have."},
  ];
  return h("div",{style:{maxWidth:860,margin:"0 auto",padding:isMobile?"24px 20px 80px":"40px 20px 80px"}},
    h("p",{style:{fontFamily:"'Literata',serif",fontSize:isMobile?16:18,color:"#555",lineHeight:1.7,marginBottom:isMobile?28:40,maxWidth:600}},
      "A tool for designing ecological gardens in Massachusetts \u2014 built around native plants, pollinators, and long-term habitat value."
    ),
    h("div",{style:{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}},
      cards.map(function(c){
        return h("div",{key:c.key,
          onClick:function(){onNavigate(c.key);},
          style:{background:"white",border:"1.5px solid #e0ddd5",borderRadius:14,padding:"22px 24px",cursor:"pointer",
            transition:"border-color 0.15s,box-shadow 0.15s",boxShadow:"none"}
          ,onMouseEnter:function(e){e.currentTarget.style.borderColor="#2e5339";e.currentTarget.style.boxShadow="0 4px 16px rgba(46,83,57,0.10)";}
          ,onMouseLeave:function(e){e.currentTarget.style.borderColor="#e0ddd5";e.currentTarget.style.boxShadow="none";}
        },
          h("div",{style:{fontSize:28,marginBottom:10}},c.emoji),
          h("div",{style:{fontFamily:"'Literata',serif",fontSize:17,fontWeight:600,color:"#2e5339",marginBottom:8,lineHeight:1.3}},c.title),
          h("div",{style:{fontSize:13,color:"#888",lineHeight:1.6}},c.body)
        );
      })
    )
  );
}
