// Plant Palette Builder — data, constants, parsing, filters
var h=React.createElement;
var useState=React.useState,useMemo=React.useMemo,useEffect=React.useEffect,
    useCallback=React.useCallback,useRef=React.useRef;

var SHEET_URL="https://docs.google.com/spreadsheets/d/e/2PACX-1vRiUGIg_9Eqv8Uwgp__RzcAJqNcB5vq7MHTbY1ZMqoEVtgNVlxo4CtocWgvztvQwUEzXOmMvjgP5UGA/pub?output=csv&gid=1137105758";
var SHEET_VIEW="https://docs.google.com/spreadsheets/d/1W1CL_Q4guXnsLfCoPmM61rYXzBwHKB765L_rSAocjEY/edit?usp=sharing";

var MICROZONES=[
  {key:"Mesic South- Facing Heat",label:"South-facing / Hot",emoji:"\u2600\ufe0f",desc:"Hot, dry, south-facing slope or pavement edge",impliesSun:"full"},
  {key:"Dry Upper Slope",label:"High and exposed",emoji:"\ud83c\udfd4\ufe0f",desc:"Top of a slope, drains fast after rain",impliesSun:"full"},
  {key:"Mid-Slope Mesic",label:"Typical yard",emoji:"\ud83c\udf3f",desc:"Average suburban yard, moderate moisture"},
  {key:"Moist Lower Area",label:"Low or soggy",emoji:"\ud83d\udca7",desc:"Low spot, rain garden, holds moisture"},
  {key:"Woodland Edge",label:"Woodland edge",emoji:"\ud83c\udf33",desc:"Where lawn meets trees; dappled light",impliesSun:"part"},
  {key:"Conifer Shade",label:"Under conifers",emoji:"\ud83c\udf32",desc:"Under hemlock, spruce, or fir",impliesSun:"shade"},
  {key:"Dry Slope",label:"Sloped and dry",emoji:"\u26f0\ufe0f",desc:"Grades downhill, drains fast, lean soil",impliesSun:"full"},
];
var ZONE_KEYS=MICROZONES.map(function(z){return z.key;});

var SCORE_LABELS=["","Don't Use","Marginal","OK","Strong","Best Fit"];
var SCORE_COLORS=["#ccc","#ef5350","#ff9800","#fdd835","#66bb6a","#2e7d32"];

var STATUS_OPTS=[
  {key:"native",    label:"Native to MA",   bg:"#e8f5e9",fg:"#2e7d32"},
  {key:"nearnative",label:"Near-Native",    bg:"#e3f2fd",fg:"#1565c0"},
  {key:"cultivar",  label:"Native Cultivar",bg:"#f3e5f5",fg:"#6a1b9a"},
  {key:"nonnative", label:"Safe Non-Native",bg:"#fff8e1",fg:"#f57f17"},
  {key:"invasive",  label:"\u26d4 Invasive",  bg:"#fde8e8",fg:"#b71c1c"},
  {key:"caution",   label:"\u26a0\ufe0f Caution",   bg:"#fff3cd",fg:"#7d4e00"},
];
var STATUS_COLORS_MAP={
  "Native":                   {bg:"#e8f5e9",text:"#2e7d32",label:"Native to MA"},
  "Native Cultivar":          {bg:"#f3e5f5",text:"#6a1b9a",label:"Native Cultivar"},
  "Near-Native":              {bg:"#e3f2fd",text:"#1565c0",label:"Near-Native"},
  "Near Native":              {bg:"#e3f2fd",text:"#1565c0",label:"Near-Native"},
  "Safe Non-Native":          {bg:"#fff8e1",text:"#f57f17",label:"Safe Non-Native"},
  "Safe Non Native":          {bg:"#fff8e1",text:"#f57f17",label:"Safe Non-Native"},
  "Native/Non-Native Hybrid": {bg:"#fce4ec",text:"#880e4f",label:"Hybrid"},
  "Native / Nonnative Hybrid":{bg:"#fce4ec",text:"#880e4f",label:"Hybrid"},
  "Invasive":                 {bg:"#fde8e8",text:"#b71c1c",label:"\u26d4 Invasive"},
  "Caution":                  {bg:"#fff3cd",text:"#7d4e00",label:"\u26a0\ufe0f Caution"},
};

var PLANT_TYPES=[
{key:"tree",   label:"Trees",  emoji:"🌳", tip:"Large & understory trees — plants with a single woody trunk",
 cats:{"Tree - Large":1,"Tree - Small":1,"Tall Canopy Tree":1,"Midstory Tree":1}},
{key:"shrub",  label:"Shrubs", emoji:"🌿", tip:"Shrubs of all sizes — multi-stemmed woody plants",
 cats:{"Shrub":1,"Shrub \u2013 Large":1,"Shrub \u2013 Small":1,"Flowering Shrub":1,"Broadleaf Evergreen":1}},
  {key:"perennial",label:"Perennials & Annuals",emoji:"\ud83c\udf3c",cats:{"Flowering Perennial":1,"Foliage Perennial":1,"Annual":1,"Flowering Annual":1,"Biennial":1,"Bulb":1}},
  {key:"grass",   label:"Grasses & sedges", emoji:"\ud83c\udf3e",cats:{"Grass":1}},
  {key:"fern",    label:"Ferns",            emoji:"\ud83c\udf3f",cats:{"Fern":1}},
  {key:"ground",  label:"Groundcovers",     emoji:"\ud83c\udf40",cats:{"Groundcover":1}},
  {key:"vine",    label:"Vines",            emoji:"\ud83c\udf3f",cats:{"Vine":1}},
];

var CONCERN_OPTS=[
  {key:"shadedby_norway", emoji:"\ud83c\udf41",label:"Norway maple",   tip:"Allelopathic roots and dense shade \u2014 one of the hardest sites for plants",group:"shaded"},
  {key:"shadedby_pine",   emoji:"\ud83c\udf32",label:"White pines",    tip:"Dry acidic needle duff; very few plants tolerate this well",group:"shaded"},
  {key:"shadedby_conifer",emoji:"\ud83c\udf32",label:"Other conifers", tip:"Under hemlock, spruce, or fir \u2014 dry, dark, acidic",group:"shaded"},
  {key:"near_walnut",     emoji:"\ud83c\udf30",label:"Black walnut",   tip:"Produces juglone, a chemical toxic to many plants",group:"near"},
  {key:"postconstruction",emoji:"\ud83c\udfd7\ufe0f",label:"Post-construction",tip:"Compacted or disturbed fill soil \u2014 favor tough, adaptable pioneers",group:"site"},
  {key:"dogs",    emoji:"\ud83d\udc15",label:"Dogs",        tip:"Excludes plants toxic to dogs",group:"safety"},
  {key:"cats",    emoji:"\ud83d\udc08",label:"Cats",        tip:"Excludes plants toxic to cats",group:"safety"},
  {key:"children",emoji:"\ud83d\udc76",label:"Children",   tip:"Excludes plants with parts toxic to children",group:"safety"},
  {key:"nospread",emoji:"\ud83d\udeab",label:"No spreaders",tip:"Excludes plants that fill space aggressively",group:"concern"},
];

var CAT_EMOJI={
  "Tree - Large":"\ud83c\udf33","Tree - Small":"\ud83c\udf32","Tall Canopy Tree":"\ud83c\udf33",
  "Midstory Tree":"\ud83c\udf3f","Tree":"\ud83c\udf33",
  "Shrub":"\ud83c\udf3e","Shrub \u2013 Large":"\ud83c\udf3e",
  "Shrub \u2013 Small":"\ud83c\udf3e","Flowering Shrub":"\ud83c\udf38",
  "Flowering Perennial":"\ud83c\udf3c","Foliage Perennial":"\ud83c\udf43",
  "Biennial":"\ud83c\udf31","Bulb":"\ud83c\udf37",
  "Groundcover":"\ud83c\udf3f","Grass":"\ud83c\udf3e","Fern":"\ud83c\udf3f",
  "Broadleaf Evergreen":"\ud83c\udf40","Vine":"\ud83c\udf3f","Annual":"\ud83c\udf3b",
};
var CAT_BG={
  "Tree - Large":"#e8f5e9","Tree - Small":"#e8f5e9","Tall Canopy Tree":"#e8f5e9",
  "Midstory Tree":"#f1f8e9","Tree":"#e8f5e9",
  "Shrub":"#fff8e1","Shrub \u2013 Large":"#fff8e1",
  "Shrub \u2013 Small":"#fff8e1","Flowering Shrub":"#fce4ec",
  "Flowering Perennial":"#fffde7","Foliage Perennial":"#e8f5e9",
  "Biennial":"#f3e5f5","Bulb":"#fce4ec",
  "Groundcover":"#e8f5e9","Grass":"#f9fbe7","Fern":"#e0f2f1",
  "Broadleaf Evergreen":"#e8f5e9","Vine":"#f3e5f5","Annual":"#fff8e1",
};
var CAT_FG={
  "Tree - Large":"#2e7d32","Tree - Small":"#388e3c","Tall Canopy Tree":"#1b5e20",
  "Midstory Tree":"#558b2f","Tree":"#2e7d32",
  "Shrub":"#f57f17","Shrub \u2013 Large":"#e65100",
  "Shrub \u2013 Small":"#f57f17","Flowering Shrub":"#c2185b",
  "Flowering Perennial":"#f9a825","Foliage Perennial":"#388e3c",
  "Biennial":"#7b1fa2","Bulb":"#c2185b",
  "Groundcover":"#2e7d32","Grass":"#827717","Fern":"#00695c",
  "Broadleaf Evergreen":"#1b5e20","Vine":"#6a1b9a","Annual":"#f57f17",
};
var COLOR_MAP={
  white:"#ffffff",cream:"#fffdd0",yellow:"#fdd835",orange:"#ff9800",red:"#ef5350",
  pink:"#f48fb1",rose:"#e91e63",magenta:"#e040fb",purple:"#9c27b0",lavender:"#ce93d8",
  blue:"#42a5f5",violet:"#7e57c2",maroon:"#880e4f",green:"#66bb6a","yellow-green":"#cddc39",
  "blue-gray":"#90a4ae",silver:"#cfd8dc","dark green":"#1b5e20","lime green":"#cddc39",
  burgundy:"#6d1f1f",bronze:"#cd7f32",gold:"#ffc107","blue-green":"#00695c",
};

// Default display hex for bloom calendar bars — more visually accurate than COLOR_MAP
var FLOWER_HEX_MAP={
  white:"#E8E4DC",cream:"#F5E6A3",yellow:"#F9C820",golden:"#FFB300",
  "yellow-green":"#C8D836","orange":"#F4741E",red:"#C0392B",coral:"#E8624A",
  pink:"#E8829A",rose:"#C2456A",magenta:"#C2187A",maroon:"#7B2340",
  burgundy:"#6D1F38",purple:"#7B4EA0",violet:"#5B3E9E",lavender:"#9B89C4",
  blue:"#4A7FC1",
};

var NONSHOWY_COLORS={"green":1,"brown":1,"tan":1,"silver":1};

function getBloomHex(plant){
  if(plant.flowerColorHex)return plant.flowerColorHex;
  var first=(plant.flowerColor||"").split("|")[0].trim().toLowerCase();
  if(!first||NONSHOWY_COLORS[first])return null;
  return FLOWER_HEX_MAP[first]||"#C0BDB8";
}
function getBloomColors(plant,priorityFilter){
  var cols=(plant.flowerColor||"").split(/\s*[|]\s*/).map(function(c){return c.trim().toLowerCase();}).filter(Boolean);
  var seen={};
  var mapped=cols.filter(function(c){return !NONSHOWY_COLORS[c]&&!seen[c]&&(seen[c]=true);}).map(function(c){return{name:c,hex:FLOWER_HEX_MAP[c]||"#C0BDB8"};});
  if(priorityFilter&&priorityFilter!=="all"){
    var allowed=BLOOM_COLOR_GROUPS[priorityFilter]||[];
    mapped.sort(function(a,b){
      var aMatch=allowed.indexOf(a.name)>=0?0:1;
      var bMatch=allowed.indexOf(b.name)>=0?0:1;
      return aMatch-bMatch;
    });
  }
  return mapped.map(function(x){return x.hex;}).slice(0,3);
}

function blooms(plant,m){
  if(plant.bloomStart<0||plant.bloomEnd<0)return false;
  var s=plant.bloomStart,e=plant.bloomEnd;
  if(e<s)e+=12;
  var mAdj=m<s?m+12:m;
  return mAdj>=s&&mAdj<=e;
}

var MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
var MONTHS_SHORT=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

var WOODY_SET={"Tree - Large":1,"Tree - Small":1,"Tall Canopy Tree":1,"Midstory Tree":1,"Shrub":1,"Shrub \u2013 Large":1,"Shrub \u2013 Small":1,"Flowering Shrub":1,"Broadleaf Evergreen":1,"Vine":1};
var CANOPY_SET={"Tree - Large":1,"Tall Canopy Tree":1};

function dedupePlants(plants){
  var seen={};
  return plants.filter(function(p){if(seen[p.latin])return false;seen[p.latin]=true;return true;});
}

function GoBotanyLink({ latinName }) {
  if (!latinName) return null;
  var parts = latinName.trim().toLowerCase().split(/\s+/);
  if (parts.length < 2) return null;
  var url = "https://gobotany.nativeplanttrust.org/species/" + parts[0] + "/" + parts[1] + "/";
  return h("a", {
    href: url,
    target: "_blank",
    rel: "noopener noreferrer",
    title: "View on Go Botany (Native Plant Trust) — not all plants may be in their database",
    style: { fontSize: "0.75rem", color: "#2e5339", textDecoration: "none", whiteSpace: "nowrap" }
  }, "Native Plant Trust ↗");
}
// ── localStorage ──────────────────────────────────────────────────────────
var LS_KEY="ppb_hearts_v2";
function loadHearts(){try{return JSON.parse(localStorage.getItem(LS_KEY)||"[]");}catch(err){return[];}}
function saveHearts(a){try{localStorage.setItem(LS_KEY,JSON.stringify(a));}catch(err){}}

var LS_LISTS_KEY="ppb_lists_v1";
function loadLists(){try{return JSON.parse(localStorage.getItem(LS_LISTS_KEY)||"[]");}catch(err){return[];}}
function saveLists(a){try{localStorage.setItem(LS_LISTS_KEY,JSON.stringify(a));}catch(err){}}

// ── URL helpers ────────────────────────────────────────────────────────────
function readURL(){
var p=new URLSearchParams(window.location.search);
  return{
    view:       p.get("view")||"main",
    search:     p.get("q")||"",
    zone:       p.get("zone")||null,
    ptypes:     p.get("pt")?p.get("pt").split(","):[],
    statuses:   p.get("st")?p.get("st").split(","):["native","nearnative"],
    concerns:   p.get("cx")?p.get("cx").split(","):[],
    heightCap:  p.get("hc")?parseFloat(p.get("hc")):null,
    moisture:   p.get("mo")||null,
    sun:        p.get("su")||null,
    irrigated:  p.get("ir")==="1",
    rflower:    p.get("fl")?p.get("fl").split(","):[],
    rwinter:    p.get("wi")==="1",
    sortBy:     p.get("sb")||"fit",
    label:      p.get("label")||"",
    sharedHearts:p.get("hearts")?p.get("hearts").split(","):[],
  };
}
function pushURL(s){
  var p=new URLSearchParams();
  if(s.view&&s.view!=="main")p.set("view",s.view);
  if(s.search)p.set("q",s.search);
  if(s.zone)p.set("zone",s.zone);
  if(s.ptypes&&s.ptypes.length)p.set("pt",s.ptypes.join(","));
  var def=["native","nearnative"];
  if(JSON.stringify(s.statuses.slice().sort())!==JSON.stringify(def.slice().sort()))p.set("st",s.statuses.join(","));
  if(s.concerns&&s.concerns.length)p.set("cx",s.concerns.join(","));
  if(s.heightCap)p.set("hc",String(s.heightCap));
  if(s.moisture)p.set("mo",s.moisture);
  if(s.sun)p.set("su",s.sun);
  if(s.irrigated)p.set("ir","1");
  if(s.rflower&&s.rflower.length)p.set("fl",s.rflower.join(","));
  if(s.rwinter)p.set("wi","1");
  if(s.sortBy&&s.sortBy!=="fit")p.set("sb",s.sortBy);
  if(s.label)p.set("label",s.label);
  if(s.view==="palette"&&s.hearts&&s.hearts.length)p.set("hearts",s.hearts.join(","));
  var str=p.toString();
  window.history.replaceState(null,"",str?location.pathname+"?"+str:location.pathname);
}

// ── Data parsing ──────────────────────────────────────────────────────────
function parseCSV(text){
  var lines=text.split(/\r?\n/);
  function pl(line){
    var out=[],f="",q=false;
    for(var i=0;i<line.length;i++){
      var c=line[i];
      if(c==='"'){if(q&&line[i+1]==='"'){f+='"';i++;}else q=!q;}
      else if(c===','&&!q){out.push(f);f="";}
      else f+=c;
    }
    out.push(f);return out;
  }
  var headers=pl(lines[0]),rows=[];
  for(var i=1;i<lines.length;i++){
    if(!lines[i].trim())continue;
    var vals=pl(lines[i]),row={};
    headers.forEach(function(h,idx){row[h.trim()]=(vals[idx]||"").trim();});
    rows.push(row);
  }
  return rows;
}

function getTypeKey(cat){
  for(var i=0;i<PLANT_TYPES.length;i++)if(PLANT_TYPES[i].cats[cat])return PLANT_TYPES[i].key;
  var c=cat.toLowerCase();
  if(c.indexOf("tree")>=0||c.indexOf("canopy")>=0)return"tree";
  if(c.indexOf("shrub")>=0||c.indexOf("evergreen")>=0)return"shrub";
  if(c.indexOf("grass")>=0||c.indexOf("sedge")>=0)return"grass";
  if(c.indexOf("fern")>=0)return"fern";
  if(c.indexOf("ground")>=0)return"ground";
  if(c.indexOf("vine")>=0)return"vine";
  return"perennial";
}

function monthIdx(s){
  if(!s)return -1;
  var sl=s.toLowerCase();
  for(var i=0;i<MONTHS_SHORT.length;i++)if(sl.startsWith(MONTHS_SHORT[i].toLowerCase()))return i;
  for(var i=0;i<MONTHS.length;i++)if(sl.startsWith(MONTHS[i].toLowerCase()))return i;
  return -1;
}

function rowToPlant(row){
  var scores={};
  ZONE_KEYS.forEach(function(k){var m=(row[k]||"").match(/\d/);scores[k]=m?parseInt(m[0]):0;});
  var hasScores=Object.values(scores).some(function(s){return s>0;});
  var cur=row["curated image url"]||"";
  var inat=row["inaturalist image url"]||"";
  var status=row["Ecological Status"]||"";
  var cat=row["Category"]||"";
  return{
    common:row["Common Name"]||"",latin:row["Latin Name"]||"",
    category:cat,status:status,
    bloom:row["Bloom Period"]||"",seasonal:row["Seasonal Interest"]||"",
    bloomStart:row["bloom_start_idx"]!==undefined&&row["bloom_start_idx"]!==""?parseInt(row["bloom_start_idx"])-1:-1,
    bloomEnd:row["bloom_end_idx"]!==undefined&&row["bloom_end_idx"]!==""?parseInt(row["bloom_end_idx"])-1:-1,
    flowerColorHex:row["flower_color_hex"]||"",
    evergreen:row["Evergreen"]||"",
    heightFt:parseFloat(row["Max Height (ft)"])||0,
    sun:row["Sun Exposure"]||"",moisture:row["Moisture Preference"]||"",
    notes:row["Notes"]||"",
    image:cur||inat,curatedImage:cur,inatImage:inat,
    role:row["Habitat Patch Role"]||"",aggressive:row["Aggressive"]||"",
    flowerColor:row["Flower Color"]||"",foliageColor:row["Foliage Color"]||"",showyBloom:row["showy_bloom"]||"",
    deerPressure:row["deer_pressure"]||"",rabbitDamage:row["rabbit_damage"]||"",voleRisk:row["vole_girdling_risk"]||"",
    toxicDogs:row["toxic_dogs"]||"",toxicCats:row["toxic_cats"]||"",
    toxicChildren:row["toxic_children"]||"",
    juglone:row["juglone_sensitivity"]||"",
    whitePine:row["white_pine_tolerance"]||"",
    norwayMaple:row["norway_maple_tolerance"]||"",
    seedStart:row["seed_ripe_start"]||"",seedEnd:row["seed_ripe_end"]||"",
    seedStartIdx:monthIdx(row["seed_ripe_start"]||""),
    seedEndIdx:monthIdx(row["seed_ripe_end"]||""),
    seedNotes:row["seed_notes"]||"",propagNotes:row["propagation_notes"]||"",
    caterpillars:parseInt(row["caterpillar_species"])||0,
    edible:!!(row["edible"]||"").trim().match(/^(yes|true|with caveats)/i),
    edibleNotes:row["edible_notes"]||"",
    edibleValue:(row["edible"]||"").trim().toLowerCase(),
    medicinal:!!(row["medicinal"]||"").trim().match(/^(yes|true|with caveats)/i),
    medicinalNotes:row["medicinal_notes"]||"",
    medicinalValue:(row["medicinal"]||"").trim().toLowerCase(),
    isCultivar:status.indexOf("Cultivar")>=0,
    isWoody:!!WOODY_SET[cat]||(cat.toLowerCase().indexOf("tree")>=0||cat.toLowerCase().indexOf("shrub")>=0||cat.toLowerCase().indexOf("canopy")>=0||cat.toLowerCase().indexOf("evergreen")>=0||cat.toLowerCase().indexOf("vine")>=0),
    isCanopy:!!CANOPY_SET[cat]||(cat.toLowerCase().indexOf("canopy")>=0||(cat.toLowerCase().indexOf("tree")>=0&&cat.toLowerCase().indexOf("small")<0&&cat.toLowerCase().indexOf("midstory")<0)),
    typeKey:getTypeKey(cat),scores:scores,hasScores:hasScores,
  };
}

function getSiteScore(plant,key){
  if(!key)return null;
  if(ZONE_KEYS.indexOf(key)>=0)return plant.scores[key]||0;
  if(key==="shadedby_norway"||key==="norway-maple"){
    if(plant.norwayMaple==="avoid"||!plant.norwayMaple)return 0;
    var b=plant.scores["Conifer Shade"]||0;
    return plant.norwayMaple==="tolerant"?Math.min(5,b+1):b;
  }
  if(key==="shadedby_pine"||key==="white-pine"){
    if(plant.whitePine==="avoid"||!plant.whitePine)return 0;
    var b=plant.scores["Conifer Shade"]||0;
    return plant.whitePine==="tolerant"?Math.min(5,b+1):b;
  }
  if(key==="shadedby_conifer")return plant.scores["Conifer Shade"]||0;
  if(key==="near_walnut"){if(plant.juglone==="sensitive")return 0;return Math.max(plant.scores["Mid-Slope Mesic"]||0,plant.scores["Woodland Edge"]||0);}
  if(key==="postconstruction")return Math.max(plant.scores["Dry Upper Slope"]||0,plant.scores["Dry Slope"]||0);
  return 0;
}

function matchStatus(plant,statuses){
  if(!statuses||!statuses.length)return true;
  var s=plant.status.toLowerCase().replace(/-/g,"").replace(/ /g,"");
  if(statuses.indexOf("native")>=0&&s==="native")return true;
  if(statuses.indexOf("cultivar")>=0&&s.indexOf("cultivar")>=0)return true;
  if(statuses.indexOf("nearnative")>=0&&(s==="nearnative"||s==="nearnative"))return true;
  if(statuses.indexOf("nonnative")>=0&&(s==="safenonnative"||s==="nonnative"||s.indexOf("hybrid")>=0))return true;
  if(statuses.indexOf("invasive")>=0&&s.indexOf("invasive")>=0)return true;
  if(statuses.indexOf("caution")>=0&&(s==="caution"||s.indexOf("aggressive")>=0))return true;
  return false;
}

function applyFilters(plants,f,siteKey){
  return plants.filter(function(p){
    var s0=p.status.toLowerCase().replace(/[-\s]/g,"");
    if(!p.hasScores&&!f.search&&s0.indexOf("invasive")<0&&s0.indexOf("caution")<0)return false;
    var s=p.status.toLowerCase().replace(/[-\s]/g,"");
    if(s.indexOf("invasive")>=0&&f.statuses.indexOf("invasive")<0)return false;
    if(s==="caution"&&f.statuses.indexOf("caution")<0)return false;
    if(!matchStatus(p,f.statuses))return false;
    if(f.ptypes&&f.ptypes.length&&f.ptypes.indexOf(p.typeKey)<0)return false;
    if(f.heightCap&&p.heightFt>f.heightCap)return false;
    if(f.search){var q=f.search.toLowerCase();if(p.common.toLowerCase().indexOf(q)<0&&p.latin.toLowerCase().indexOf(q)<0)return false;}
    if(siteKey&&ZONE_KEYS.indexOf(siteKey)>=0&&(p.scores[siteKey]||0)<3)return false;
    var cx=f.concerns||[];
    if(cx.indexOf("shadedby_norway")>=0&&(p.norwayMaple==="avoid"||!p.norwayMaple))return false;
    if(cx.indexOf("shadedby_pine")>=0&&(p.whitePine==="avoid"||!p.whitePine))return false;
    if(cx.indexOf("shadedby_conifer")>=0&&(p.scores["Conifer Shade"]||0)<2)return false;
    if(cx.indexOf("near_walnut")>=0&&p.juglone==="sensitive")return false;
    if(cx.indexOf("postconstruction")>=0&&(getSiteScore(p,"postconstruction")||0)<3)return false;
    if(f.deerLevel==="high"&&p.deerPressure==="high")return false;
    if(f.deerLevel==="mod"&&(p.deerPressure==="high"||p.deerPressure==="medium"))return false;
    if(f.rabbitLevel==="high"&&p.rabbitDamage==="high")return false;
    if(f.rabbitLevel==="mod"&&(p.rabbitDamage==="high"||p.rabbitDamage==="medium"))return false;
    if(f.voleLevel==="high"&&p.voleRisk==="high")return false;
    if(f.voleLevel==="mod"&&(p.voleRisk==="high"||p.voleRisk==="medium"))return false;
    if(f.dogsLevel==="strict"&&p.toxicDogs==="yes")return false;
    if(f.dogsLevel==="mild"&&(p.toxicDogs==="yes"||p.toxicDogs==="medium"||p.toxicDogs==="mild"))return false;
    if(f.catsLevel==="strict"&&p.toxicCats==="yes")return false;
    if(f.catsLevel==="mild"&&(p.toxicCats==="yes"||p.toxicCats==="mild"))return false;
    if(f.childrenLevel==="strict"&&p.toxicChildren==="yes")return false;
    if(f.childrenLevel==="mild"&&(p.toxicChildren==="yes"||p.toxicChildren==="mild"))return false;
    if(cx.indexOf("nospread")>=0&&(p.aggressive==="Y"||p.aggressive==="M"))return false;
    if(f.sun){var sun=(p.sun||"").toLowerCase();if(f.sun==="full"&&sun.indexOf("full sun")<0)return false;if(f.sun==="shade"&&sun.indexOf("shade")<0)return false;if(f.sun==="part"&&sun.indexOf("part")<0)return false;}
    if(f.moisture){var m=(p.moisture||"").toLowerCase();var eff=f.irrigated?(f.moisture==="dry"?"average":f.moisture==="average"?"moist":"moist"):f.moisture;if(eff==="dry"&&m.indexOf("dry")<0&&m.indexOf("mesic")<0)return false;if(eff==="moist"&&m.indexOf("moist")<0&&m.indexOf("wet")<0)return false;if(eff==="average"&&m.indexOf("mesic")<0)return false;}
    if(f.rflower&&f.rflower.length){var cols=p.flowerColor.split(/\s*[|]\s*/).map(function(c){return c.trim().toLowerCase();});if(!f.rflower.some(function(rc){return cols.indexOf(rc)>=0;}))return false;}
    if(f.edibleOnly&&!p.edible)return false;
    if(f.medicinalOnly&&!p.medicinal)return false;
    if(f.rwinter){var w=(p.seasonal||"").toLowerCase().indexOf("winter")>=0||(p.evergreen||"").toLowerCase()==="yes";if(!w)return false;}
    return true;
  });
}

function sortPlants(plants,sortBy,siteKey){
  return plants.slice().sort(function(a,b){
    if(sortBy==="wildlife")return(b.caterpillars||0)-(a.caterpillars||0);
    if(sortBy==="alpha")return a.common.localeCompare(b.common);
    // "fit" mode: sort by site score if available, otherwise by wildlife value
    if(siteKey){var d=(getSiteScore(b,siteKey)||0)-(getSiteScore(a,siteKey)||0);if(d!==0)return d;}
    return(b.caterpillars||0)-(a.caterpillars||0);
  });
}



// ── Style helpers ─────────────────────────────────────────────────────────
function pill(active,dark){
  return{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 12px",
    borderRadius:20,cursor:"pointer",fontFamily:"'Poppins',sans-serif",fontSize:13,
    whiteSpace:"nowrap",border:"1.5px solid "+(active?"#2e5339":"#e0ddd5"),
    background:active?(dark?"#2e5339":"#f0faf0"):"transparent",
    color:active?(dark?"white":"#2e5339"):"#555",
    fontWeight:active?"500":"normal"};
}
function btn(bg,fg,extra){
  return Object.assign({background:bg,color:fg,border:"none",borderRadius:8,
    padding:"8px 16px",cursor:"pointer",fontFamily:"'Poppins',sans-serif",
    fontSize:14,fontWeight:500},extra||{});
}
