// Plant Palette Builder — App component
// ── App ───────────────────────────────────────────────────────────────────
function App(){
  var _p=useState([]),plants=_p[0],setPlants=_p[1];
  var _l=useState(true),loading=_l[0],setLoading=_l[1];
  var _e=useState(null),error=_e[0],setError=_e[1];

  var initURL=useMemo(readURL,[]);
  var initTab=initURL.view==="seeds"?"seeds":initURL.view==="bloom"?"bloom":initURL.view==="mix"?"palette":initURL.view==="palette"?"palette":initURL.view==="plants"?"plants":initURL.view==="main"?"plants":initURL.sharedHearts&&initURL.sharedHearts.length>0?"palette":initURL.search?"plants":"home";
  var _at=useState(initTab),activeTab=_at[0],setActiveTab=_at[1];
  var _sr=useState(initURL.search),search=_sr[0],setSearch=_sr[1];
  var _z=useState(initURL.zone),zone=_z[0],setZone=_z[1];
  var _op=useState(null),openPop=_op[0],setOpenPop=_op[1];
  var _f=useState({
    statuses:initURL.statuses,ptypes:initURL.ptypes,heightCap:initURL.heightCap,
    concerns:initURL.concerns,moisture:initURL.moisture,sun:initURL.sun,
    irrigated:initURL.irrigated,rflower:initURL.rflower,rwinter:initURL.rwinter,
    edibleOnly:false,medicinalOnly:false,deerLevel:null,rabbitLevel:null,
    voleLevel:null,dogsLevel:null,catsLevel:null,childrenLevel:null,
  }),filters=_f[0],setFilters=_f[1];
  var _sb=useState(initURL.sortBy),sortBy=_sb[0],setSortBy=_sb[1];
  var _lb=useState(initURL.label),label=_lb[0],setLabel=_lb[1];
  var _ss=useState(false),showSuggest=_ss[0],setShowSuggest=_ss[1];
  var _ps=useState(20),patchSize=_ps[0],setPatchSize=_ps[1];
  var _dr=useState(false),drawerOpen=_dr[0],setDrawerOpen=_dr[1];
  var _mob=useState(window.innerWidth<700),isMobile=_mob[0],setIsMobile=_mob[1];

  var _h=useState(function(){return initURL.sharedHearts.length?initURL.sharedHearts:loadHearts();}),hearts=_h[0],setHearts=_h[1];
  var searchRef=useRef(null);

  function focusSearch(){setActiveTab("plants");setTimeout(function(){if(searchRef.current)searchRef.current.focus();},80);}

  var toggleHeart=useCallback(function(latin){
    setHearts(function(prev){
      var next=prev.indexOf(latin)>=0?prev.filter(function(x){return x!==latin;}):[...prev,latin];
      saveHearts(next);return next;
    });
  },[]);

  var _prevSearch=useRef("");
  useEffect(function(){
    if(search.trim()&&!_prevSearch.current.trim()){
      setFilters(function(f){return Object.assign({},f,{ptypes:[],heightCap:null,concerns:[],rflower:[],rwinter:false,edibleOnly:false,medicinalOnly:false,deerLevel:null,rabbitLevel:null,voleLevel:null,dogsLevel:null,catsLevel:null,childrenLevel:null});});
    }
    _prevSearch.current=search;
  },[search]);

  useEffect(function(){
    function onResize(){setIsMobile(window.innerWidth<700);}
    window.addEventListener("resize",onResize);
    return function(){window.removeEventListener("resize",onResize);};
  },[]);

  useEffect(function(){
    pushURL(Object.assign({view:activeTab==="plants"?"main":activeTab==="home"?"":activeTab,search:search,zone:zone,sortBy:sortBy,label:label,hearts:hearts},filters));
  },[activeTab,search,zone,filters,sortBy,label]);

  useEffect(function(){
    requestAnimationFrame(function(){requestAnimationFrame(function(){window.scrollTo(0,0);});});
  },[activeTab]);

  // DATA OWNER TASK: After editing Google Sheets → File > Download > CSV
  //   → save as plants.csv in repo root → commit & push → GitHub Pages auto-redeploys.
  //   The app loads plants.csv first (fast). If missing, falls back to live Sheet fetch.
  useEffect(function(){
    fetch("./plants.csv")
      .then(function(r){if(!r.ok)throw new Error("no local csv");return r.text();})
      .then(function(text){setPlants(dedupePlants(parseCSV(text).map(rowToPlant).filter(Boolean)));setLoading(false);})
      .catch(function(){
        fetch(SHEET_URL)
          .then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.text();})
          .then(function(text){setPlants(dedupePlants(parseCSV(text).map(rowToPlant).filter(Boolean)));setLoading(false);})
          .catch(function(err){setError(err.message);setLoading(false);});
      });
  },[]);

  var inferredSun=useMemo(function(){var z=MICROZONES.find(function(z){return z.key===zone;});return z?z.impliesSun||null:null;},[zone]);
  var effectiveSun=inferredSun||filters.sun;
  var searchActive=search.trim().length>0;
  var allStatuses=["native","nearnative","cultivar","nonnative","invasive","caution"];
  var effectiveFilters=Object.assign({},filters,{sun:searchActive?filters.sun:effectiveSun,statuses:searchActive?allStatuses:filters.statuses,search:search});

  var filtered=useMemo(function(){return applyFilters(plants,effectiveFilters,searchActive?null:zone);},[plants,JSON.stringify(effectiveFilters),zone,searchActive]);
  var mixFilters=useMemo(function(){return Object.assign({},filters,{sun:effectiveSun,search:"",ptypes:[],heightCap:null,rflower:[],rwinter:false,edibleOnly:false,medicinalOnly:false});},[filters,effectiveSun]);
  var mixFiltered=useMemo(function(){return applyFilters(plants,mixFilters,zone);},[plants,mixFilters,zone]);
  var results=useMemo(function(){return sortPlants(filtered,sortBy,zone);},[filtered,sortBy,zone]);

  var zoneInfo=MICROZONES.find(function(z){return z.key===zone;});

  var flowerColors=useMemo(function(){
    var c={};
    plants.forEach(function(p){p.flowerColor.split(/\s*[|]\s*/).forEach(function(x){var t=x.trim().toLowerCase();if(t&&COLOR_MAP[t])c[t]=(c[t]||0)+1;});});
    return Object.entries(c).sort(function(a,b){return b[1]-a[1];}).slice(0,10).map(function(x){return x[0];});
  },[plants]);

  var defaultStatuses=["native","nearnative"];
  var statusesChanged=JSON.stringify(filters.statuses.slice().sort())!==JSON.stringify(defaultStatuses.slice().sort());
  var activeFilterCount=[zone].concat(filters.concerns,filters.ptypes,[filters.heightCap,filters.moisture,filters.sun&&!inferredSun].concat(filters.rflower),[filters.rwinter,filters.edibleOnly,filters.medicinalOnly,statusesChanged,filters.deerLevel,filters.rabbitLevel,filters.voleLevel,filters.dogsLevel,filters.catsLevel,filters.childrenLevel]).filter(Boolean).length;
  var moreCount=filters.rflower.length+[filters.rwinter,filters.edibleOnly,filters.medicinalOnly,filters.deerLevel,filters.rabbitLevel,filters.voleLevel,filters.dogsLevel,filters.catsLevel,filters.childrenLevel].filter(Boolean).length;

  function togSt(k){setFilters(function(f){return Object.assign({},f,{statuses:f.statuses.indexOf(k)>=0?f.statuses.filter(function(v){return v!==k;}):[...f.statuses,k]});});}
  function togCx(k){setFilters(function(f){return Object.assign({},f,{concerns:f.concerns.indexOf(k)>=0?f.concerns.filter(function(v){return v!==k;}):[...f.concerns,k]});});}
  function togPt(k){setFilters(function(f){return Object.assign({},f,{ptypes:f.ptypes.indexOf(k)>=0?f.ptypes.filter(function(v){return v!==k;}):[...f.ptypes,k]});});}
  function togFl(c){setFilters(function(f){return Object.assign({},f,{rflower:f.rflower.indexOf(c)>=0?f.rflower.filter(function(v){return v!==c;}):[...f.rflower,c]});});}
  function togglePop(name){setOpenPop(function(cur){return cur===name?null:name;});}
  function setDeerLevel(v){setFilters(function(f){return Object.assign({},f,{deerLevel:v});});}
  function setRabbitLevel(v){setFilters(function(f){return Object.assign({},f,{rabbitLevel:v});});}
  function setVoleLevel(v){setFilters(function(f){return Object.assign({},f,{voleLevel:v});});}
  function setDogsLevel(v){setFilters(function(f){return Object.assign({},f,{dogsLevel:v});});}
  function setCatsLevel(v){setFilters(function(f){return Object.assign({},f,{catsLevel:v});});}
  function setChildrenLevel(v){setFilters(function(f){return Object.assign({},f,{childrenLevel:v});});}
  var noFilters=!zone&&!filters.concerns.length&&!filters.ptypes.length&&!filters.heightCap&&!filters.moisture&&!filters.sun&&!search&&!filters.deerLevel&&!filters.rabbitLevel&&!filters.voleLevel&&!filters.dogsLevel&&!filters.catsLevel&&!filters.childrenLevel&&!statusesChanged;

  function TipBtn(text,label2,active,dark,onClick){
    return h("span",{className:"tip-wrap"},
      h("button",{onClick:onClick,style:pill(active,dark)},label2),
      h("span",{className:"tip"},text)
    );
  }

  // ── Render ──
  return h("div",{style:{fontFamily:"'Poppins',sans-serif",background:"#D9D9BF",minHeight:"100vh",color:"#2c2c2c",paddingBottom:isMobile?"calc(80px + env(safe-area-inset-bottom,0px))":"0",paddingTop:isMobile?"0":"140px"}},

    // Header + tabs — fixed on desktop, normal flow on mobile
    h("div",{style:{position:isMobile?"relative":"fixed",top:0,left:0,right:0,zIndex:200,background:"#150f09"}},

      // Green photo bar
      h("div",{style:{position:"relative",overflow:"hidden",minHeight:isMobile?100:80}},
        h("img",{src:"/header.jpg",alt:"",style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"center"}}),
        h("div",{style:{position:"absolute",inset:0,background:"rgba(18,38,18,0.80)"}}),
        h("div",{style:{position:"relative",maxWidth:900,margin:"0 auto",padding:isMobile?"20px 20px 18px":"12px 20px 10px",cursor:"pointer"},onClick:function(){setActiveTab("home");},},
          h("div",{style:{fontFamily:"'Poppins',sans-serif",fontSize:11,color:"rgba(255,255,255,0.5)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:isMobile?5:2,cursor:"pointer"}},"Summers EcoScaping"),
          h("div",{style:{fontFamily:"'Literata',serif",fontSize:isMobile?"clamp(20px,4vw,30px)":"22px",fontWeight:600,color:"white",letterSpacing:"-0.3px",lineHeight:1.1,cursor:"pointer"}},"Ecoscaping Planner"),
          !isMobile&&h("div",{style:{fontFamily:"'Poppins',sans-serif",fontSize:11,color:"rgba(255,255,255,0.45)",letterSpacing:"0.05em",marginTop:2}},"Native plants for Massachusetts")
        )
      ),

      // Tab row — desktop only
      !isMobile&&h("div",{className:"no-print",style:{background:"#150f09",borderBottom:"1px solid rgba(255,255,255,0.08)"}},
        h("div",{style:{maxWidth:900,margin:"0 auto",display:"flex",alignItems:"center",padding:"0 8px",gap:0}},
          [
            {key:"plants", label:"Explore"},
            {key:"palette",label:"Palette",count:hearts.length},
            {key:"bloom",  label:"Bloom"},
          ].map(function(tab){
            var active=activeTab===tab.key&&!searchActive;
            return h("button",{key:tab.key,onClick:function(){
              setSearch("");
              setActiveTab(tab.key);
              if(tab.key==="plants"){setDrawerOpen(true);}
              else{setDrawerOpen(false);setShowSuggest(false);}
            },
              style:{padding:"14px 28px",fontFamily:"inherit",fontSize:14,fontWeight:active?700:400,
                color:active?"white":"rgba(255,255,255,0.55)",
                background:"none",border:"none",
                cursor:"pointer",whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:6}
            },
              tab.label,
              tab.count>0&&h("span",{style:{background:"#e57373",color:"white",borderRadius:10,padding:"1px 7px",fontSize:11,fontWeight:600}},tab.count)
            );
          }).concat([
            h("div",{key:"divider",style:{width:1,background:"rgba(255,255,255,0.15)",margin:"8px 6px",flexShrink:0}}),
            h("button",{key:"seeds",onClick:function(){setSearch("");setActiveTab("seeds");setDrawerOpen(false);},
              style:{padding:"14px 20px",fontFamily:"inherit",fontSize:14,fontWeight:activeTab==="seeds"&&!searchActive?700:400,
                color:activeTab==="seeds"&&!searchActive?"white":"rgba(255,255,255,0.55)",
                background:"none",border:"none",
                cursor:"pointer",whiteSpace:"nowrap"}
            },"Seeds"),
            h("div",{key:"divider2",style:{width:1,background:"rgba(255,255,255,0.15)",margin:"8px 6px",flexShrink:0}}),
            h("button",{key:"search",onClick:function(){
              if(searchActive){setTimeout(function(){if(searchRef.current)searchRef.current.focus();},80);}
              else{setActiveTab("plants");setTimeout(function(){if(searchRef.current)searchRef.current.focus();},80);}
            },
              style:{padding:"14px 20px",fontFamily:"inherit",fontSize:14,fontWeight:searchActive?700:400,
                color:searchActive?"white":"rgba(255,255,255,0.55)",
                background:"none",border:"none",
                cursor:"pointer",whiteSpace:"nowrap"}
            },"Search")
          ])
        )
      )
    ),

    // Sticky filter bar
    activeTab!=="home"&&h("div",{className:"no-print",style:{position:"sticky",top:isMobile?0:140,zIndex:100,background:"#D9D9BF",borderBottom:"1px solid rgba(0,0,0,0.08)"}},
      h("div",{style:{maxWidth:900,margin:"0 auto"}},
        activeTab==="plants"&&h("div",{style:{padding:"10px 20px 0"}},
          h("div",{style:{position:"relative",marginBottom:8,display:"flex",gap:8,alignItems:"center"}},
            h("div",{style:{position:"relative",flex:1}},
              h("input",{ref:searchRef,value:search,onChange:function(ev){setSearch(ev.target.value);},placeholder:loading?"Loading\u2026":"Search Massachusetts plants\u2026",style:{width:"100%",padding:"10px 44px 10px 18px",border:"1.5px solid #e0ddd5",borderRadius:10,fontFamily:"inherit",fontSize:16,background:"white",outline:"none",color:"#2c2c2c"}}),
              search&&h("button",{onClick:function(){setSearch("");},style:{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#888",lineHeight:1}},"\u00d7")
            )
          ),
          h("div",{style:{paddingBottom:10}},
            h("button",{onClick:function(){setDrawerOpen(true);},style:{display:"inline-flex",alignItems:"center",gap:7,padding:"8px 16px",borderRadius:10,border:"1.5px solid "+(activeFilterCount>0?"#2e5339":"#e0ddd5"),background:activeFilterCount>0?"#f0faf0":"white",cursor:"pointer",fontFamily:"inherit",fontSize:14,color:activeFilterCount>0?"#2e5339":"#555",fontWeight:activeFilterCount>0?"500":"normal"}},
              "\u25a4 Filters",
              activeFilterCount>0&&h("span",{style:{background:"#2e5339",color:"white",borderRadius:10,padding:"0 8px",fontSize:12}},activeFilterCount)
            )
          )
        )),

    ),

    // Filter drawer — mobile bottom sheet, desktop right panel
    h(FilterDrawer,{open:drawerOpen,onClose:function(){setDrawerOpen(false);},filters:filters,onChange:setFilters,flowerColors:flowerColors,inferredSun:inferredSun,isMobile:isMobile,zone:zone,onSetZone:setZone,onClearSearch:function(){setSearch("");},source:activeTab==="palette"?"palette":"plants"}),

    // Main content
    h("div",{style:{maxWidth:900,margin:"0 auto",padding:isMobile?"12px 16px 120px":"12px 20px 80px"}},

      loading&&h("div",{style:{textAlign:"center",padding:"60px 20px",color:"#888"}},h("div",{style:{fontSize:40,marginBottom:12}},"\ud83c\udf31"),h("div",{style:{fontStyle:"italic",fontSize:16}},"Loading plant data\u2026")),
      error&&h("div",{style:{textAlign:"center",padding:"60px 20px"}},h("div",{style:{fontSize:40,marginBottom:12}},"\u26a0\ufe0f"),h("div",{style:{fontWeight:"bold",color:"#b71c1c",marginBottom:8,fontSize:16}},"Could not load plant data"),h("div",{style:{fontSize:13,color:"#888"}},error)),

      !loading&&!error&&(
        activeTab==="home"?h("div",null,
          h(HomeView,{onNavigate:function(tab){setActiveTab(tab);},isMobile:isMobile}),
          h("div",{style:{marginTop:32,paddingTop:24,borderTop:"1px solid #e0ddd5"}},
            h("div",{style:{fontSize:12,fontWeight:500,color:"#2e5339",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}},"About this tool"),
            h("p",{style:{fontSize:13,color:"#666",lineHeight:1.7,marginBottom:10}},"This tool is designed for gardeners and garden designers \u2014 not conservation databases or academic research. It\u2019s built to help you make good planting decisions faster, with real site conditions in mind."),
            h("p",{style:{fontSize:13,color:"#666",lineHeight:1.7,marginBottom:10}},"Plant data is drawn from public sources including iNaturalist, BONAP, and published research on caterpillar host relationships. It has been curated and combined by hand. While we\u2019ve worked to be accurate, errors exist \u2014 if precision matters for your project, please cross-check with primary sources."),
            h("p",{style:{fontSize:13,color:"#666",lineHeight:1.7}},"Near-native plants (species native to adjacent regions with documented ecological relationships in Massachusetts) are included and labeled. Use your judgment.")
          )
        ):
        activeTab==="palette"?h(PaletteView,{hearts:hearts,plants:plants,onHeart:toggleHeart,onClear:function(){setHearts([]);saveHearts([]);},onGoToPlants:function(){setActiveTab("plants");},mixFiltered:mixFiltered,patchSize:patchSize,concerns:filters.concerns,activeFilterCount:activeFilterCount,onOpenFilters:function(){setDrawerOpen(true);},isMobile:isMobile,label:label,onLabelChange:setLabel,onLoosen:function(type){
            if(type==="shadedby")setFilters(function(f){return Object.assign({},f,{concerns:f.concerns.filter(function(c){return c.indexOf("shadedby")<0;})});});
            if(type==="near_walnut")setFilters(function(f){return Object.assign({},f,{concerns:f.concerns.filter(function(c){return c!=="near_walnut";})});});
            if(type==="height")setFilters(function(f){return Object.assign({},f,{heightCap:null});});
          }}):
        activeTab==="bloom"?h(BloomCalendar,{plants:plants,embedded:true,onHeart:toggleHeart,hearts:hearts}):
        activeTab==="seeds"?h(SeedCalendar,{plants:plants,embedded:true}):
        // Plants tab
        h("div",null,
          activeFilterCount>0&&h("div",{style:{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10,marginTop:6}},
            zone&&h("div",{style:{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:5,background:"#f0faf0",border:"1px solid #c8e6c9",fontSize:12,color:"#2e5339"}},"\ud83d\udccd "+(zoneInfo?zoneInfo.label:zone),h("span",{onClick:function(){setZone(null);},style:{cursor:"pointer",opacity:0.5,fontSize:14}},"\xd7")),
            filters.concerns.map(function(c){var opt=CONCERN_OPTS.find(function(o){return o.key===c;});return opt?h("div",{key:c,style:{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:5,background:"#f0faf0",border:"1px solid #c8e6c9",fontSize:12,color:"#2e5339"}},opt.emoji+" "+opt.label,h("span",{onClick:function(){togCx(c);},style:{cursor:"pointer",opacity:0.5,fontSize:14}},"\xd7")):null;}),
            filters.ptypes.map(function(k){var g=PLANT_TYPES.find(function(t){return t.key===k;});return g?h("div",{key:k,style:{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:5,background:"#f0faf0",border:"1px solid #c8e6c9",fontSize:12,color:"#2e5339"}},g.emoji+" "+g.label,h("span",{onClick:function(){togPt(k);},style:{cursor:"pointer",opacity:0.5,fontSize:14}},"\xd7")):null;}),
            filters.heightCap&&h("div",{style:{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:5,background:"#f0faf0",border:"1px solid #c8e6c9",fontSize:12,color:"#2e5339"}},"Under "+filters.heightCap+" ft",h("span",{onClick:function(){setFilters(function(f){return Object.assign({},f,{heightCap:null});});},style:{cursor:"pointer",opacity:0.5,fontSize:14}},"\xd7")),
            statusesChanged&&h("div",{style:{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:5,background:"#fde8e8",border:"1px solid #f5c6c6",fontSize:12,color:"#b71c1c"}},
              filters.statuses.map(function(k){var o=STATUS_OPTS.find(function(x){return x.key===k;});return o?o.label:k;}).join(", "),
              h("span",{onClick:function(){setFilters(function(f){return Object.assign({},f,{statuses:["native","nearnative"]});});},style:{cursor:"pointer",opacity:0.5,fontSize:14}},"\xd7")
            ),
            filters.edibleOnly&&h("div",{style:{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:5,background:"#f0faf0",border:"1px solid #c8e6c9",fontSize:12,color:"#2e5339"}},"\ud83c\udf74 Edible",h("span",{onClick:function(){setFilters(function(f){return Object.assign({},f,{edibleOnly:false});});},style:{cursor:"pointer",opacity:0.5,fontSize:14}},"\xd7")),
            filters.medicinalOnly&&h("div",{style:{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:5,background:"#f0faf0",border:"1px solid #c8e6c9",fontSize:12,color:"#2e5339"}},"\u2615 Medicinal",h("span",{onClick:function(){setFilters(function(f){return Object.assign({},f,{medicinalOnly:false});});},style:{cursor:"pointer",opacity:0.5,fontSize:14}},"\xd7")),
            h("button",{onClick:function(){setZone(null);setSearch("");setFilters({statuses:["native","nearnative"],ptypes:[],heightCap:null,concerns:[],moisture:null,sun:null,irrigated:false,rflower:[],rwinter:false,edibleOnly:false,medicinalOnly:false,deerLevel:null,rabbitLevel:null,voleLevel:null,dogsLevel:null,catsLevel:null,childrenLevel:null});},style:{fontSize:13,color:"#c62828",background:"#fff5f5",border:"1px solid #ffcdd2",borderRadius:5,padding:"4px 12px",cursor:"pointer",fontFamily:"inherit",fontWeight:500}},"✕ Clear all")
          ),
          showSuggest&&h(SuggestPanel,{plants:filtered,siteKey:zone,count:patchSize,hearts:hearts,onHeart:toggleHeart,onClose:function(){setShowSuggest(false);}}),
          noFilters&&!showSuggest&&h("div",{style:{background:"white",border:"1px solid #e0ddd5",borderRadius:12,padding:"16px 20px",marginBottom:16,display:"flex",alignItems:"center",gap:12}},
            h("span",{style:{fontSize:28,flexShrink:0}},"\ud83c\udf31"),
            h("div",null,
              h("div",{style:{fontWeight:500,fontSize:15,marginBottom:3}},"Set your site conditions to find the best plants for your spot"),
              h("div",{style:{fontSize:13,color:"#888"}},"Choose a site type, add filters, or tap \u2728\u202fSuggest a palette to get a curated starting point.")
            )
          ),
          h("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}},
            h("div",{style:{fontSize:14,color:"#888",fontStyle:"italic"}},results.length+" plant"+(results.length!==1?"s":"")+(zone?" for "+(zoneInfo?zoneInfo.label:zone):"")+"\u00b7 Massachusetts"),
            h("div",{style:{display:"flex",gap:5,alignItems:"center"}},
              h("span",{style:{fontSize:12,color:"#aaa"}},"Sort:"),
              [{v:"fit",l:"\ud83d\udccd Best fit"},{v:"wildlife",l:"\ud83e\udd8b Insects"},{v:"alpha",l:"A\u2013Z"}].map(function(x){
                return h("button",{key:x.v,onClick:function(){setSortBy(x.v);},style:{padding:"3px 10px",borderRadius:16,fontSize:12,fontFamily:"inherit",cursor:"pointer",border:"1px solid "+(sortBy===x.v?"#2e5339":"#e0ddd5"),background:sortBy===x.v?"#2e5339":"transparent",color:sortBy===x.v?"white":"#666",borderRadius:5}},x.l);
              })
            )
          ),
          results.map(function(p){return h(PlantCard,{key:p.latin,plant:p,siteKey:zone,hearted:hearts.indexOf(p.latin)>=0,onHeart:toggleHeart,edibleOnly:filters.edibleOnly,medicinalOnly:filters.medicinalOnly});}),
          results.length===0&&h("div",{style:{textAlign:"center",padding:"50px 20px",color:"#888"}},
            h("div",{style:{fontSize:40,marginBottom:12}},"\ud83e\udd14"),
            h("div",{style:{fontStyle:"italic",marginBottom:10,fontSize:16}},"No plants match all your filters."),
            h("div",{style:{fontSize:13}},"Try loosening the height cap, removing a concern, or broadening moisture or sun settings.")
          )
        )
      )
    ),

    // Mobile bottom nav
    isMobile&&h("div",{style:{position:"fixed",bottom:0,left:0,right:0,zIndex:200,background:"white",borderTop:"1px solid #e0ddd5",display:"flex",paddingBottom:"env(safe-area-inset-bottom,0px)",WebkitTransform:"translateZ(0)"}},
      [
        {key:"plants",  label:"Explore",   icon:"\ud83d\udd0d"},
        {key:"palette", label:"Palette",  icon:"\u2665", count:hearts.length},
        {key:"bloom",   label:"Bloom",    icon:"\ud83c\udf38"},
        {key:"seeds",   label:"Seeds",    icon:"\ud83c\udf30"},
        {key:"search",  label:"Search",   icon:"\u2315"},
      ].map(function(tab){
        var active=tab.key==="search"?searchActive:(activeTab===tab.key&&!searchActive);
        var handleClick=function(){
          if(tab.key==="search"){
            if(searchActive){setSearch("");setTimeout(function(){if(searchRef.current)searchRef.current.focus();},80);}
            else{setActiveTab("plants");setTimeout(function(){if(searchRef.current)searchRef.current.focus();},80);}
          } else {
            setSearch("");setActiveTab(tab.key);
            if(tab.key==="plants"){setDrawerOpen(true);}else{setDrawerOpen(false);setShowSuggest(false);}
          }
        };
        return h("button",{key:tab.key,
          onTouchEnd:function(e){e.preventDefault();handleClick();},
          onClick:handleClick,
          style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            padding:"8px 4px 6px",background:"none",border:"none",borderTop:"2px solid "+(active?"#2e5339":"transparent"),cursor:"pointer",
            color:active?"#2e5339":"#aaa",fontFamily:"inherit",position:"relative",touchAction:"manipulation",WebkitTapHighlightColor:"transparent"}
        },
          h("div",{style:{fontSize:18,lineHeight:1,marginBottom:2}},tab.icon),
          h("div",{style:{fontSize:10,fontWeight:active?"500":"normal"}},tab.label),
          tab.count>0&&h("span",{style:{position:"absolute",top:4,right:"50%",transform:"translateX(14px)",background:"#e57373",color:"white",borderRadius:10,padding:"0 5px",fontSize:9,fontWeight:700,lineHeight:"16px"}},tab.count)
        );
      })
    ),

    // Footer
    h("div",{style:{textAlign:"center",padding:"20px 16px",color:"#aaa",fontSize:12,borderTop:"1px solid #e0ddd5",lineHeight:2}},
      h("div",null,"Created by ",h("a",{href:"https://www.summersgardening.com",target:"_blank",rel:"noopener noreferrer",style:{color:"#2e5339",textDecoration:"none"}},"Rachel Noack Summers / Summers EcoScaping")," \u00b7 Built with Claude (Anthropic)"),
      h("div",null,"Images from iNaturalist and other Creative Commons sources \u00b7 Plant data compiled from publicly available sources"),
      h("div",null,"Native plant designations specific to Massachusetts per ",h("a",{href:"https://gobotany.nativeplanttrust.org",target:"_blank",rel:"noopener noreferrer",style:{color:"#2e5339",textDecoration:"none"}},"Go Botany / Native Plant Trust")),
      h("div",null,h("a",{href:SHEET_VIEW,target:"_blank",rel:"noopener noreferrer",style:{color:"#2e5339",textDecoration:"none"}},"View source data \u2192")," \u00b7 Edits, suggestions, additions and corrections are welcome"),
      h("div",null,"Questions, suggestions, collaboration: ",h("a",{href:"mailto:rsummmmers@gmail.com",style:{color:"#2e5339",textDecoration:"none"}},"rsummmmers@gmail.com"))
    )
  );
}
