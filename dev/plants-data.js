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

function normLatin(latin){
  return latin.replace(/^[×x]\s*/,"").replace(/\s+[×\xd7]\s+/g," x ").trim();
}
function baseSpecies(latin){
  var clean=normLatin(latin).replace(/\s*['''\x27].*$/,"").replace(/\s+(var|subsp|f)\b.*/i,"").trim();
  var parts=clean.split(/\s+/);
  var n=parts[1]==="x"?3:2;
  return parts.slice(0,n).join(" ");
}
function vbLookup(vbData,latin){
  return vbData[latin.toLowerCase()]||vbData[baseSpecies(latin).toLowerCase()]||null;
}
function vbLookupAll(vbData,latin){
  var all=vbData&&vbData._allSizes;
  if(!all)return null;
  return all[latin.toLowerCase()]||all[baseSpecies(latin).toLowerCase()]||null;
}

function applyInheritance(plants){
  var speciesMap={};
  plants.forEach(function(p){if(!p.isCultivar)speciesMap[normLatin(p.latin)]=p;});

  var STR_FIELDS=["bloom","sun","moisture","role","seasonal","foliageColor","evergreen","notes",
    "aggressive","deerPressure","rabbitDamage","voleRisk","toxicDogs","toxicCats",
    "toxicChildren","juglone","whitePine","norwayMaple","edibleNotes","edibleValue",
    "medicinalNotes","medicinalValue","seedStart","seedEnd","seedNotes","propagNotes",
    "category","showyBloom"];

  return plants.map(function(p){
    if(!p.isCultivar)return p;
    var base=baseSpecies(p.latin);
    var parent=speciesMap[base];
    if(!parent)return p;
    var patch={};
    STR_FIELDS.forEach(function(k){if(!p[k])patch[k]=parent[k];});
    if(p.bloomStart===-1)patch.bloomStart=parent.bloomStart;
    if(p.bloomEnd===-1)patch.bloomEnd=parent.bloomEnd;
    if(p.seedStartIdx===-1)patch.seedStartIdx=parent.seedStartIdx;
    if(p.seedEndIdx===-1)patch.seedEndIdx=parent.seedEndIdx;
    if(!p.heightFt)patch.heightFt=parent.heightFt;
    if(!p.caterpillars)patch.caterpillars=parent.caterpillars;
    if(!p.edible)patch.edible=parent.edible;
    if(!p.medicinal)patch.medicinal=parent.medicinal;
    if(!p.hasScores){patch.scores=parent.scores;patch.hasScores=parent.hasScores;}
    if(!p.image&&parent.image){patch.image=parent.image;patch.curatedImage=parent.curatedImage;patch.inatImage=parent.inatImage;patch.inheritedImage=true;}
    if(!p.typeKey||p.typeKey==="perennial")patch.typeKey=parent.typeKey;
    if(!p.isWoody)patch.isWoody=parent.isWoody;
    if(!p.isCanopy)patch.isCanopy=parent.isCanopy;
    return Object.assign({},p,patch);
  });
}

// Go Botany (Native Plant Trust) only covers New England native/naturalized
// flora -- most exotic ornamental cultivars (the bulk of the Van Berkum
// import) legitimately aren't in it at all, and GoBotanyLink's URLs are
// guessed client-side with no way to live-check a 404: GoBotany sends no
// CORS headers, so a browser fetch() to their domain can't read the
// response status (confirmed via curl -- HEAD requests work fine
// server-side, just not from client JS across origins). So instead of
// guessing and risking a dead link, this is gated on a precomputed allowlist
// of genus/species pairs verified (via a HEAD request per pair) to actually
// return 200. Verified 2026-09-17: 596 of 1018 candidate pairs in the DB at
// the time existed on Go Botany, 422 did not.
// To refresh after adding many new plants: re-run the same batch HEAD-check
// against https://gobotany.nativeplanttrust.org/species/<genus>/<species>/
// for every new baseSpecies() pair and regenerate this object.
var GOBOTANY_VERIFIED={"abies balsamea":1,"acer campestre":1,"acer ginnala":1,"acer negundo":1,"acer palmatum":1,"acer pensylvanicum":1,"acer platanoides":1,"acer pseudoplatanus":1,"acer rubrum":1,"acer saccharinum":1,"acer saccharum":1,"achillea filipendulina":1,"achillea millefolium":1,"aconitum napellus":1,"actaea pachypoda":1,"actaea racemosa":1,"actaea rubra":1,"actinidia arguta":1,"adiantum pedatum":1,"aegopodium podagraria":1,"aesculus hippocastanum":1,"agastache foeniculum":1,"ageratina altissima":1,"agrostis perennans":1,"ailanthus altissima":1,"ajuga reptans":1,"alcea rosea":1,"alliaria petiolata":1,"allium schoenoprasum":1,"allium tricoccum":1,"alnus glutinosa":1,"alnus incana":1,"amelanchier canadensis":1,"amelanchier laevis":1,"amelanchier spicata":1,"ammophila breviligulata":1,"amorpha fruticosa":1,"ampelopsis glandulosa":1,"amsonia tabernaemontana":1,"anaphalis margaritacea":1,"andromeda polifolia":1,"andropogon gerardii":1,"andropogon glomeratus":1,"anemone acutiloba":1,"anemone canadensis":1,"anemone multifida":1,"anemone virginiana":1,"angelica atropurpurea":1,"antennaria plantaginifolia":1,"anthriscus sylvestris":1,"apocynum cannabinum":1,"aquilegia canadensis":1,"aralia elata":1,"aralia nudicaulis":1,"aralia racemosa":1,"aralia spinosa":1,"arctostaphylos uva-ursi":1,"arisaema dracontium":1,"arisaema triphyllum":1,"armoracia rusticana":1,"aronia arbutifolia":1,"aronia floribunda":1,"aronia melanocarpa":1,"artemisia stelleriana":1,"artemisia vulgaris":1,"arthraxon hispidus":1,"aruncus dioicus":1,"asarum canadense":1,"asclepias incarnata":1,"asclepias syriaca":1,"asclepias tuberosa":1,"asparagus officinalis":1,"asplenium trichomanes":1,"aster tataricus":1,"astrantia major":1,"athyrium angustum":1,"aurinia saxatilis":1,"baccharis halimifolia":1,"baptisia australis":1,"baptisia tinctoria":1,"berberis thunbergii":1,"berberis vulgaris":1,"betula alleghaniensis":1,"betula lenta":1,"betula nigra":1,"betula papyrifera":1,"betula populifolia":1,"bidens frondosa":1,"boltonia asteroides":1,"bouteloua gracilis":1,"buddleja davidii":1,"butomus umbellatus":1,"cabomba caroliniana":1,"caltha palustris":1,"calycanthus floridus":1,"campanula carpatica":1,"campanula glomerata":1,"campanula persicifolia":1,"campanula rotundifolia":1,"campsis radicans":1,"cardamine concatenata":1,"cardamine impatiens":1,"carex amphibola":1,"carex appalachica":1,"carex arctata":1,"carex brevior":1,"carex crinita":1,"carex eburnea":1,"carex intumescens":1,"carex kobomugi":1,"carex laxiculmis":1,"carex lurida":1,"carex pensylvanica":1,"carex plantaginea":1,"carex radiata":1,"carex sprengelii":1,"carex squarrosa":1,"carex swanii":1,"carpinus caroliniana":1,"carthamus lanatus":1,"carya laciniosa":1,"carya ovata":1,"castanea dentata":1,"castanea mollissima":1,"caulophyllum giganteum":1,"caulophyllum thalictroides":1,"ceanothus americanus":1,"celastrus orbiculatus":1,"celastrus scandens":1,"celtis occidentalis":1,"centaurea stoebe":1,"cephalanthus occidentalis":1,"cerastium tomentosum":1,"cercidiphyllum japonicum":1,"cercis canadensis":1,"chaenomeles speciosa":1,"chamaecrista fasciculata":1,"chamaecyparis thyoides":1,"chamaedaphne calyculata":1,"chamerion angustifolium":1,"cheilanthes lanosa":1,"chelone glabra":1,"chelone lyonii":1,"chionanthus virginicus":1,"clematis terniflora":1,"clematis virginiana":1,"clethra alnifolia":1,"comptonia peregrina":1,"convallaria majalis":1,"coreopsis grandiflora":1,"coreopsis lanceolata":1,"coreopsis tinctoria":1,"coreopsis tripteris":1,"coreopsis verticillata":1,"corylus americana":1,"corylus cornuta":1,"cotinus coggygria":1,"crocus vernus":1,"crupina vulgaris":1,"cynanchum louiseae":1,"cynanchum rossicum":1,"cypripedium acaule":1,"cystopteris bulbifera":1,"cytisus scoparius":1,"danthonia spicata":1,"dennstaedtia punctilobula":1,"deschampsia cespitosa":1,"deschampsia flexuosa":1,"desmodium canadense":1,"desmodium paniculatum":1,"deutzia scabra":1,"dianthus carthusianorum":1,"dicentra cucullaria":1,"dicentra eximia":1,"diervilla lonicera":1,"digitalis grandiflora":1,"digitalis purpurea":1,"diospyros virginiana":1,"doellingeria umbellata":1,"dryopteris cristata":1,"dryopteris filix-mas":1,"dryopteris marginalis":1,"echinacea pallida":1,"echinacea purpurea":1,"echinocystis lobata":1,"egeria densa":1,"elaeagnus angustifolia":1,"elaeagnus umbellata":1,"elodea canadensis":1,"elymus canadensis":1,"elymus hystrix":1,"emex spinosa":1,"epigaea repens":1,"epilobium hirsutum":1,"eragrostis curvula":1,"eragrostis spectabilis":1,"erigeron acris":1,"erigeron annuus":1,"erigeron canadensis":1,"erigeron hyssopifolius":1,"erigeron philadelphicus":1,"erigeron pulchellus":1,"erigeron strigosus":1,"eryngium planum":1,"eryngium yuccifolium":1,"erythronium americanum":1,"euonymus alatus":1,"euonymus fortunei":1,"eupatorium hyssopifolium":1,"eupatorium perfoliatum":1,"euphorbia corollata":1,"euphorbia cyparissias":1,"euphorbia esula":1,"eurybia divaricata":1,"eurybia macrophylla":1,"euthamia graminifolia":1,"eutrochium dubium":1,"eutrochium maculatum":1,"exochorda racemosa":1,"fagus grandifolia":1,"fagus sylvatica":1,"fallopia sachalinensis":1,"festuca filiformis":1,"ficaria verna":1,"ficus carica":1,"filipendula rubra":1,"fragaria vesca":1,"fragaria virginiana":1,"frangula alnus":1,"gaillardia aristata":1,"galanthus nivalis":1,"galega officinalis":1,"galium odoratum":1,"gaultheria procumbens":1,"gaylussacia baccata":1,"gaylussacia frondosa":1,"gentiana clausa":1,"geranium maculatum":1,"geum fragarioides":1,"gillenia trifoliata":1,"glaucium flavum":1,"gleditsia triacanthos":1,"glyceria maxima":1,"gymnocarpium dryopteris":1,"gymnocladus dioicus":1,"hamamelis virginiana":1,"hedera helix":1,"helenium autumnale":1,"helenium flexuosum":1,"helianthus divaricatus":1,"helianthus tuberosus":1,"heliopsis helianthoides":1,"hemerocallis fulva":1,"heracleum mantegazzianum":1,"hesperis matronalis":1,"heuchera americana":1,"hibiscus moscheutos":1,"hibiscus syriacus":1,"houstonia caerulea":1,"houstonia longifolia":1,"humulus japonicus":1,"humulus lupulus":1,"hydrangea arborescens":1,"hydrangea paniculata":1,"hydrangea quercifolia":1,"hydrilla verticillata":1,"hylotelephium telephium":1,"hyssopus officinalis":1,"iberis sempervirens":1,"ilex crenata":1,"ilex glabra":1,"ilex opaca":1,"ilex verticillata":1,"impatiens capensis":1,"ionactis linariifolia":1,"iris cristata":1,"iris ensata":1,"iris germanica":1,"iris pseudacorus":1,"iris sibirica":1,"iris versicolor":1,"iva frutescens":1,"jacobaea vulgaris":1,"juglans cinerea":1,"juglans nigra":1,"juncus effusus":1,"juncus tenuis":1,"juniperus horizontalis":1,"juniperus virginiana":1,"kalmia angustifolia":1,"kalmia latifolia":1,"kerria japonica":1,"koelreuteria paniculata":1,"kolkwitzia amabilis":1,"lamium maculatum":1,"lamprocapnos spectabilis":1,"larix laricina":1,"lavandula angustifolia":1,"lepidium latifolium":1,"liatris novae-angliae":1,"liatris spicata":1,"ligustrum obtusifolium":1,"ligustrum vulgare":1,"lilium canadense":1,"lilium philadelphicum":1,"lilium superbum":1,"linaria vulgaris":1,"lindera benzoin":1,"liquidambar styraciflua":1,"liriodendron tulipifera":1,"lobelia cardinalis":1,"lobelia siphilitica":1,"lolium perenne":1,"lonicera japonica":1,"lonicera maackii":1,"lonicera morrowii":1,"lonicera sempervirens":1,"lonicera tatarica":1,"lupinus perennis":1,"lupinus polyphyllus":1,"lychnis coronaria":1,"lysimachia clethroides":1,"lysimachia nummularia":1,"lysimachia punctata":1,"lythrum salicaria":1,"magnolia acuminata":1,"magnolia tripetala":1,"magnolia virginiana":1,"maianthemum canadense":1,"maianthemum racemosum":1,"malus floribunda":1,"malva alcea":1,"malva sylvestris":1,"matteuccia struthiopteris":1,"melissa officinalis":1,"mertensia virginica":1,"micranthes virginiensis":1,"microstegium vimineum":1,"mimulus ringens":1,"miscanthus sacchariflorus":1,"miscanthus sinensis":1,"mitchella repens":1,"mitella diphylla":1,"molinia caerulea":1,"monarda didyma":1,"monarda fistulosa":1,"monarda punctata":1,"morella caroliniensis":1,"morus rubra":1,"mycelis muralis":1,"myosotis scorpioides":1,"myosotis sylvatica":1,"myrica gale":1,"myriophyllum aquaticum":1,"myriophyllum heterophyllum":1,"myriophyllum spicatum":1,"najas minor":1,"narcissus pseudonarcissus":1,"nipponanthemum nipponicum":1,"nuttallanthus canadensis":1,"nymphoides peltata":1,"nyssa sylvatica":1,"oenothera biennis":1,"oenothera fruticosa":1,"onoclea sensibilis":1,"opuntia humifusa":1,"origanum vulgare":1,"osmunda claytoniana":1,"osmunda regalis":1,"osmundastrum cinnamomeum":1,"ostrya virginiana":1,"pachysandra terminalis":1,"packera aurea":1,"packera obovata":1,"paeonia lactiflora":1,"panicum virgatum":1,"parthenium integrifolium":1,"parthenocissus quinquefolia":1,"penstemon digitalis":1,"penstemon hirsutus":1,"persicaria perfoliata":1,"persicaria virginiana":1,"phalaris arundinacea":1,"phegopteris connectilis":1,"phegopteris hexagonoptera":1,"phellodendron amurense":1,"philadelphus coronarius":1,"phlox divaricata":1,"phlox paniculata":1,"phlox stolonifera":1,"phlox subulata":1,"phragmites australis":1,"physocarpus opulifolius":1,"physostegia virginiana":1,"picea abies":1,"picea glauca":1,"pieris floribunda":1,"pinus banksiana":1,"pinus resinosa":1,"pinus rigida":1,"pinus strobus":1,"pinus thunbergii":1,"platanus occidentalis":1,"podophyllum peltatum":1,"polemonium reptans":1,"polygonatum biflorum":1,"polypodium virginianum":1,"polystichum acrostichoides":1,"populus deltoides":1,"populus tremuloides":1,"potamogeton crispus":1,"potentilla simplex":1,"primula japonica":1,"prunella vulgaris":1,"prunus americana":1,"prunus avium":1,"prunus cerasus":1,"prunus domestica":1,"prunus maritima":1,"prunus nigra":1,"prunus persica":1,"prunus pumila":1,"prunus serotina":1,"prunus serrulata":1,"prunus virginiana":1,"pseudognaphalium obtusifolium":1,"pueraria montana":1,"pulmonaria saccharata":1,"pycnanthemum muticum":1,"pycnanthemum tenuifolium":1,"pycnanthemum verticillatum":1,"pycnanthemum virginianum":1,"pyrus calleryana":1,"pyrus communis":1,"quercus alba":1,"quercus bicolor":1,"quercus coccinea":1,"quercus ilicifolia":1,"quercus macrocarpa":1,"quercus montana":1,"quercus palustris":1,"quercus rubra":1,"quercus velutina":1,"ranunculus repens":1,"ratibida pinnata":1,"rhamnus cathartica":1,"rheum rhabarbarum":1,"rhododendron calendulaceum":1,"rhododendron catawbiense":1,"rhododendron groenlandicum":1,"rhododendron maximum":1,"rhododendron periclymenoides":1,"rhododendron prinophyllum":1,"rhododendron viscosum":1,"rhodotypos scandens":1,"rhus aromatica":1,"rhus copallinum":1,"rhus glabra":1,"ribes americanum":1,"ribes hirtellum":1,"ribes triste":1,"robinia hispida":1,"robinia pseudoacacia":1,"rorippa amphibia":1,"rosa carolina":1,"rosa multiflora":1,"rosa palustris":1,"rosa virginiana":1,"rubus canadensis":1,"rubus idaeus":1,"rubus occidentalis":1,"rubus odoratus":1,"rubus phoenicolasius":1,"rudbeckia fulgida":1,"rudbeckia hirta":1,"rudbeckia laciniata":1,"rudbeckia subtomentosa":1,"rudbeckia triloba":1,"ruta graveolens":1,"salix bebbiana":1,"salix cinerea":1,"salix discolor":1,"salix eriocephala":1,"salix humilis":1,"salix lucida":1,"salix nigra":1,"salix purpurea":1,"salvia nemorosa":1,"salvia officinalis":1,"salvia verticillata":1,"sambucus nigra":1,"sanguinaria canadensis":1,"sanguisorba canadensis":1,"sanguisorba officinalis":1,"sassafras albidum":1,"schizachyrium scoparium":1,"scirpus cyperinus":1,"securigera varia":1,"sedum sexangulare":1,"sedum ternatum":1,"sempervivum tectorum":1,"senna hebecarpa":1,"setaria pumila":1,"sibbaldiopsis tridentata":1,"silene caroliniana":1,"sisyrinchium angustifolium":1,"solidago bicolor":1,"solidago caesia":1,"solidago canadensis":1,"solidago flexicaulis":1,"solidago juncea":1,"solidago nemoralis":1,"solidago odora":1,"solidago puberula":1,"solidago rugosa":1,"solidago sempervirens":1,"solidago speciosa":1,"solidago uliginosa":1,"sorbus americana":1,"sorghastrum nutans":1,"spiraea alba":1,"spiraea tomentosa":1,"sporobolus heterolepis":1,"stachys byzantina":1,"staphylea trifolia":1,"symphoricarpos albus":1,"symphoricarpos orbiculatus":1,"symphyotrichum cordifolium":1,"symphyotrichum laeve":1,"symphyotrichum lateriflorum":1,"symphyotrichum novae-angliae":1,"symphyotrichum novi-belgii":1,"symphyotrichum puniceum":1,"symphytum officinale":1,"syringa reticulata":1,"syringa vulgaris":1,"taxus baccata":1,"taxus canadensis":1,"taxus cuspidata":1,"thalictrum dioicum":1,"thalictrum pubescens":1,"thalictrum thalictroides":1,"thelypteris palustris":1,"thuja occidentalis":1,"tiarella cordifolia":1,"tilia americana":1,"tradescantia ohiensis":1,"tradescantia virginiana":1,"trapa natans":1,"trichostema dichotomum":1,"tricyrtis hirta":1,"trillium cernuum":1,"trillium erectum":1,"trillium grandiflorum":1,"trollius laxus":1,"tsuga canadensis":1,"tulipa gesneriana":1,"tussilago farfara":1,"typha latifolia":1,"ulmus americana":1,"ulmus pumila":1,"ulmus rubra":1,"uvularia grandiflora":1,"uvularia sessilifolia":1,"vaccinium angustifolium":1,"vaccinium corymbosum":1,"vaccinium macrocarpon":1,"verbena bonariensis":1,"verbena hastata":1,"verbena urticifolia":1,"verbesina alternifolia":1,"vernonia noveboracensis":1,"veronicastrum virginicum":1,"viburnum dentatum":1,"viburnum lentago":1,"viburnum nudum":1,"viburnum opulus":1,"viburnum plicatum":1,"viburnum prunifolium":1,"vinca minor":1,"viola canadensis":1,"viola odorata":1,"viola pedata":1,"viola pubescens":1,"viola sororia":1,"viola striata":1,"vitis aestivalis":1,"vitis labrusca":1,"vitis riparia":1,"wisteria frutescens":1,"wisteria sinensis":1,"woodsia obtusa":1,"woodwardia areolata":1,"xanthorhiza simplicissima":1,"zizia aptera":1,"zizia aurea":1};

function GoBotanyLink({ latinName }) {
  if (!latinName) return null;
  // Caller passes baseSpecies(plant.latin) so this already has any cultivar
  // name stripped; also drop a bare hybrid marker ("x"/"×") so a hybrid taxon
  // like "Astilbe x arendsii" links to genus/species, not genus/x.
  var parts = latinName.trim().toLowerCase().split(/\s+/).filter(function(p){return p!=="x"&&p!=="\xd7";});
  if (parts.length < 2) return null;
  if (!GOBOTANY_VERIFIED[parts[0]+" "+parts[1]]) return null;
  var url = "https://gobotany.nativeplanttrust.org/species/" + parts[0] + "/" + parts[1] + "/";
  return h("a", {
    href: url,
    target: "_blank",
    rel: "noopener noreferrer",
    title: "View on Go Botany (Native Plant Trust) — the regional native-flora reference",
    style: { fontSize: "0.75rem", color: "#2e5339", textDecoration: "none", whiteSpace: "nowrap" }
  }, "Native Plant Trust ↗");
}
// ── VB nursery data ───────────────────────────────────────────────────────
function loadVBData(){
  function parseRow(line){
    var out=[],f="",q=false;
    for(var i=0;i<line.length;i++){
      var c=line[i];
      if(c==='"'){if(q&&line[i+1]==='"'){f+='"';i++;}else q=!q;}
      else if(c===','&&!q){out.push(f);f="";}
      else f+=c;
    }
    out.push(f);return out;
  }
  return Promise.all([
    fetch("./vb_availability.csv").then(function(r){return r.ok?r.text():"";}).catch(function(){return "";}),
    fetch("./nursery_crosswalk.csv").then(function(r){return r.ok?r.text():"";}).catch(function(){return "";})
  ]).then(function(results){
    var availText=results[0],cwText=results[1];
    // Build crosswalk lookup: vb_normalized and example names → db_latin
    var cwByNorm={},cwByExample={},cwVbName={};
    cwText.split(/\r?\n/).slice(1).forEach(function(line){
      if(!line.trim())return;
      var parts=line.split(",");
      if(parts.length<2)return;
      var dbLatin=parts[0].trim(),vbNorm=parts[1].trim();
      var examples=parts.slice(2).join(",");
      cwByNorm[vbNorm.toLowerCase()]=dbLatin;
      cwVbName[dbLatin]=vbNorm;
      examples.split("|").forEach(function(ex){
        var e=ex.trim().toLowerCase();
        if(e){cwByExample[e]=dbLatin;}
      });
    });
    function isCultivar(name){return /[‘’’\x27‘’]/.test(name);}
    function matchVBName(vbName){
      var low=vbName.toLowerCase().trim();
      if(cwByExample[low])return cwByExample[low];
      var base=low.replace(/\s*[‘’’\x27’’].*/,"").trim();
      if(cwByNorm[base]){
        // Don’t match a plain-species VB name to a cultivar DB entry
        if(!isCultivar(vbName)&&isCultivar(cwByNorm[base]))return null;
        return cwByNorm[base];
      }
      var parts=base.split(/\s+/);
      if(parts.length>=2&&/^[a-z]\.$/.test(parts[1])){
        var genus=parts[0],abbr=parts[1][0];
        for(var key in cwByNorm){
          var kp=key.split(/\s+/);
          if(kp[0]===genus&&kp[1]&&kp[1][0]===abbr)return cwByNorm[key];
        }
      }
      return null;
    }
    // Parse availability CSV
    var lines=availText.split(/\r?\n/);
    var weekOf="",headerIdx=-1;
    for(var i=0;i<lines.length;i++){
      if(lines[i].indexOf("WEEK OF")>=0){
        var m=lines[i].match(/WEEK OF\s+([^,"\r\n]+)/i);
        if(m)weekOf=m[1].trim().replace(/"/g,"");
      }
      var row0=parseRow(lines[i])[0]||"";
      if(row0.trim().toUpperCase()==="QTY"){headerIdx=i;break;}
    }
    var map={},allSizes={};
    if(headerIdx>=0){
      for(var i=headerIdx+1;i<lines.length;i++){
        var row=parseRow(lines[i]);
        var vbName=(row[1]||"").trim();
        if(!vbName)continue;
        var outOfStock=(row[0]||"").trim().toUpperCase()==="X";
        var size=(row[2]||"").trim();
        var price=parseFloat(row[4])||0;
        var qty=parseInt(row[5])||0;
        var nextDate=(row[6]||"").trim();
        var rating=(row[7]||"").trim();
        var inStock=!outOfStock&&qty>0;
        var dbLatin=matchVBName(vbName);
        if(!dbLatin)continue;
        var key=dbLatin.toLowerCase();
        var existing=map[key];
        var isTray=size.toUpperCase().indexOf("TRAY")>=0;
        var existingIsTray=existing&&existing.size&&existing.size.toUpperCase().indexOf("TRAY")>=0;
        if(!existing||(!existing.inStock&&inStock)||(existing.inStock===inStock&&((isTray&&!existingIsTray)||(isTray===existingIsTray&&qty>existing.qty)))){
          map[key]={vb:true,inStock:inStock,qty:qty,price:price,size:size,vbName:cwVbName[dbLatin]||vbName,nextDate:nextDate,rating:rating};
        }
        if(!allSizes[key])allSizes[key]=[];
        var existingSz=allSizes[key].find(function(s){return s.size===size;});
        if(!existingSz||(!existingSz.inStock&&inStock)||(existingSz.inStock===inStock&&qty>existingSz.qty)){
          if(existingSz){allSizes[key].splice(allSizes[key].indexOf(existingSz),1);}
          allSizes[key].push({vb:true,inStock:inStock,qty:qty,price:price,size:size,vbName:cwVbName[dbLatin]||vbName,nextDate:nextDate,rating:rating});
        }
      }
    }
    // Sort each allSizes array: in-stock first, then trays, then by qty desc
    Object.keys(allSizes).forEach(function(k){
      allSizes[k].sort(function(a,b){
        if(a.inStock!==b.inStock)return a.inStock?-1:1;
        var at=a.size.toUpperCase().indexOf("TRAY")>=0,bt=b.size.toUpperCase().indexOf("TRAY")>=0;
        if(at!==bt)return at?-1:1;
        return b.qty-a.qty;
      });
    });
    map._weekOf=weekOf;
    map._allSizes=allSizes;
    return map;
  }).catch(function(){return {};});
}

// ── localStorage ──────────────────────────────────────────────────────────
var LS_KEY="ppb_hearts_v2";
function loadHearts(){try{return JSON.parse(localStorage.getItem(LS_KEY)||"[]");}catch(err){return[];}}
function saveHearts(a){try{localStorage.setItem(LS_KEY,JSON.stringify(a));}catch(err){}}

var LS_LISTS_KEY="ppb_lists_v1";
function loadLists(){try{return JSON.parse(localStorage.getItem(LS_LISTS_KEY)||"[]");}catch(err){return[];}}
function saveLists(a){try{localStorage.setItem(LS_LISTS_KEY,JSON.stringify(a));}catch(err){}}

// Strips a cultivar's quoted name, "cultivar"/"hybrid" words, a var/subsp
// suffix, and a bare hybrid marker ("x"/"×") down to a genus (+ species, when
// present) that iNaturalist's taxa search can actually match against. Shared
// by PhotoGallery's live per-plant photo lookup and the grid/thumbnail
// fallback below, so both search iNaturalist the same way.
function taxonQ(latin){
  return latin.replace(/['''"][^'''"]*['''"]/g,"").replace(/cultivars?/ig,"")
    .replace(/hybrids?/ig,"").replace(/spp?/ig,"").replace(/var\b.*/ig,"")
    .replace(/[x\xd7]\s+/g,"").trim().split(/\s+/).slice(0,2).join(" ");
}

// ── Live photo fallback (grid/thumbnail scale) ───────────────────────────
// For any plant with no curated/iNat image of its own -- cultivar or not --
// look up a photo live via iNaturalist instead of leaving a blank
// placeholder. For a cultivar this generally lands on the parent species'
// (or, for a genus-only cultivar, the genus's) representative photo -- not
// an exact match, but far better than a blank tile.
//
// Uses the SAME two-step lookup as the detail modal's PhotoGallery (resolve
// a taxon, then take its top-voted research-grade observation photo) rather
// than the taxon's own "default_photo" -- those are two different iNaturalist
// selections and can genuinely disagree (e.g. genus Heuchera's default_photo
// is a dried seedhead, not a representative coral-bells shot), which showed
// up as the grid card and the modal displaying two different photos for the
// same plant. Matching PhotoGallery's approach keeps them consistent.
//
// Results are cached in localStorage per search query (including a "no
// photo found" miss, so a genuinely unmatched query isn't re-fetched every
// render) and requests are throttled to a few at a time so rendering a full
// results grid doesn't fire 100+ simultaneous calls at iNaturalist.
var INAT_FALLBACK_CACHE_KEY="ppb_inat_fallback_v2";
function loadInatFallbackCache(){try{return JSON.parse(localStorage.getItem(INAT_FALLBACK_CACHE_KEY)||"{}");}catch(err){return{};}}
function saveInatFallbackCache(c){try{localStorage.setItem(INAT_FALLBACK_CACHE_KEY,JSON.stringify(c));}catch(err){}}
var _inatFallbackCache=loadInatFallbackCache();
var _inatFallbackQueue=[],_inatFallbackActive=0,INAT_FALLBACK_MAX_CONCURRENT=3;
function _inatFallbackPump(){
  while(_inatFallbackActive<INAT_FALLBACK_MAX_CONCURRENT&&_inatFallbackQueue.length){
    var job=_inatFallbackQueue.shift();
    _inatFallbackActive++;
    fetch("https://api.inaturalist.org/v1/taxa?q="+encodeURIComponent(job.query)+"&per_page=1")
      .then(function(r){return r.json();})
      .then(function(data){
        var taxon=data&&data.results&&data.results[0];
        if(!taxon)return Promise.reject("no taxon");
        return fetch("https://api.inaturalist.org/v1/observations?taxon_id="+taxon.id+"&quality_grade=research&photos=true&per_page=1&order_by=votes&photo_license=cc-by-nc,cc-by-nc-sa,cc-by-nc-nd");
      })
      .then(function(r){return r.json();})
      .then(function(data){
        var obs=data&&data.results&&data.results[0];
        var ph=obs&&obs.photos&&obs.photos[0];
        var url=(ph&&ph.url&&ph.url.indexOf("http")>=0)?ph.url.replace("square","medium"):null;
        _inatFallbackCache[job.query]=url;
        saveInatFallbackCache(_inatFallbackCache);
        job.resolve(url);
      })
      .catch(function(){
        _inatFallbackCache[job.query]=null;
        saveInatFallbackCache(_inatFallbackCache);
        job.resolve(null);
      })
      .then(function(){_inatFallbackActive--;_inatFallbackPump();});
  }
}
function fetchPlantFallbackImage(latin){
  var query=taxonQ(latin);
  if(!query)return Promise.resolve(null);
  if(_inatFallbackCache[query]!==undefined)return Promise.resolve(_inatFallbackCache[query]);
  return new Promise(function(resolve){_inatFallbackQueue.push({query:query,resolve:resolve});_inatFallbackPump();});
}

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
    heightMin:  p.get("hf")?parseFloat(p.get("hf")):null,
    showCultivars: p.get("cv")==="1",
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
  if(s.heightMin)p.set("hf",String(s.heightMin));
  if(s.showCultivars)p.set("cv","1");
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
// Single-pass, quote-aware CSV parser. Tracks quote state across the WHOLE
// text, not per-line -- a field containing a literal embedded newline (a
// normal, legal CSV construct, e.g. a multi-paragraph Notes cell) stays
// part of that one field/row instead of corrupting the row it's in and
// silently truncating everything after it. (The old per-line-split version
// had exactly this bug -- fixed 2026-09-16.)
function parseCSV(text){
  var rows=[],row=[],field="",q=false;
  for(var i=0;i<text.length;i++){
    var c=text[i];
    if(q){
      if(c==='"'){
        if(text[i+1]==='"'){field+='"';i++;}
        else q=false;
      } else field+=c;
    } else {
      if(c==='"')q=true;
      else if(c===',' ){row.push(field);field="";}
      else if(c==='\r'){ /* skip; \n below ends the row */ }
      else if(c==='\n'){row.push(field);field="";rows.push(row);row=[];}
      else field+=c;
    }
  }
  if(field!==""||row.length>0){row.push(field);rows.push(row);}
  if(!rows.length)return [];
  var headers=rows[0],out=[];
  for(var r=1;r<rows.length;r++){
    var vals=rows[r];
    if(vals.length===1&&!vals[0].trim())continue; // skip blank lines, same as before
    var obj={};
    headers.forEach(function(h,idx){obj[h.trim()]=(vals[idx]||"").trim();});
    out.push(obj);
  }
  return out;
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

// A cultivar name in the wild uses any of these quote styles around the
// cultivar name, e.g. Digitalis purpurea 'Snow Thimble' or Leucanthemum x
// superbum "Snow Lady". A quoted name is a definitive cultivar marker on its
// own, independent of Ecological Status -- Ajuga reptans 'Black Scallop' and
// Miscanthus sinensis 'Gracillimus' are cultivars whether their status is
// Safe Non-Native, Caution, or Invasive. So this applies to any status; the
// separate "Cultivar" text check just covers legacy rows (e.g. "Native
// Cultivar") that don't carry a quoted name at all.
var CULTIVAR_NAME_RE=/[‘’'"]/;

function rowToPlant(row){
  var scores={};
  ZONE_KEYS.forEach(function(k){var m=(row[k]||"").match(/\d/);scores[k]=m?parseInt(m[0]):0;});
  var hasScores=Object.values(scores).some(function(s){return s>0;});
  var cur=row["curated image url"]||"";
  var inat=row["inaturalist image url"]||"";
  var status=row["Ecological Status"]||"";
  var cat=row["Category"]||"";
  var latinName=row["Latin Name"]||"";
  var isCultivar=status.indexOf("Cultivar")>=0||CULTIVAR_NAME_RE.test(latinName);
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
    notes:row["Notes"]||"",cultivarNotes:row["cultivar_notes"]||"",
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
    isCultivar:isCultivar,
    isWoody:!!WOODY_SET[cat]||(cat.toLowerCase().indexOf("tree")>=0||cat.toLowerCase().indexOf("shrub")>=0||cat.toLowerCase().indexOf("canopy")>=0||cat.toLowerCase().indexOf("evergreen")>=0||cat.toLowerCase().indexOf("vine")>=0),
    isCanopy:!!CANOPY_SET[cat]||(cat.toLowerCase().indexOf("canopy")>=0||(cat.toLowerCase().indexOf("tree")>=0&&cat.toLowerCase().indexOf("small")<0&&cat.toLowerCase().indexOf("midstory")<0)),
    typeKey:getTypeKey(cat),scores:scores,hasScores:hasScores,
  };
}

// Conservative fallback estimate for a plant with all 7 microzone scores blank.
// Never returns above 3 ("OK") — deliberately withholds "Strong"/"Best Fit" since
// Sun/Moisture text alone can't support that level of confidence. Only used when
// plant.hasScores is false; real manually-entered scores always take precedence
// and this function is never consulted for a plant that has any of them.
function zoneFallbackScore(plant,zoneKey){
  var sun=(plant.sun||"").toLowerCase();
  var moist=(plant.moisture||"").toLowerCase();
  var fullSun=sun.indexOf("full sun")>=0;
  var partSun=sun.indexOf("part")>=0;
  var shade=sun.indexOf("shade")>=0;
  var dryish=moist.indexOf("dry")>=0||moist.indexOf("mesic")>=0;
  var wetish=moist.indexOf("moist")>=0||moist.indexOf("wet")>=0;
  function score(matches,contradicts){
    if(contradicts)return 1;      // data actively points away from this zone
    if(matches)return 3;          // data plausibly aligns — capped at "OK", not higher
    return 2;                     // no clear signal either way — neutral, not confident
  }
  switch(zoneKey){
    // "High and exposed" and "Sloped and dry" both reduce to the same signal
    // (full sun + dry) from Sun/Moisture text alone — the data can't tell slope
    // position or wind exposure apart, so both deliberately get identical treatment
    // rather than a manufactured distinction.
    case "Dry Upper Slope":
    case "Dry Slope":
      return score(fullSun&&dryish&&!wetish,wetish);
    case "Mesic South- Facing Heat":
      return score(fullSun&&dryish&&!wetish,shade||wetish);
    case "Mid-Slope Mesic":
      // "Typical yard" = average conditions by definition — the least
      // differentiated zone, so most plants plausibly fit here absent better data.
      return 3;
    case "Moist Lower Area":
      return score(wetish,dryish&&!wetish);
    case "Woodland Edge":
      return score((partSun||shade)&&!dryish,fullSun&&!partSun&&!shade);
    case "Conifer Shade":
      return score(shade,fullSun);
    default:
      return 2;
  }
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
  // Strip "cultivar" before tier-matching -- cultivar-ness is now an
  // independent axis (see isCultivar / the "Show cultivars" filter),
  // not part of the native/near-native/non-native tier itself. This keeps
  // e.g. "Native Cultivar" correctly matching the "Native" tier checkbox.
  var s=plant.status.toLowerCase().replace(/-/g,"").replace(/ /g,"").replace(/cultivar/g,"");
  if(statuses.indexOf("native")>=0&&s==="native")return true;
  if(statuses.indexOf("nearnative")>=0&&(s==="nearnative"||s==="nearnative"))return true;
  if(statuses.indexOf("nonnative")>=0&&(s==="safenonnative"||s==="nonnative"||s.indexOf("hybrid")>=0))return true;
  if(statuses.indexOf("invasive")>=0&&s.indexOf("invasive")>=0)return true;
  if(statuses.indexOf("caution")>=0&&(s==="caution"||s.indexOf("aggressive")>=0))return true;
  return false;
}

function applyFilters(plants,f,siteKey){
  return plants.filter(function(p){
    var s=p.status.toLowerCase().replace(/[-\s]/g,"");
    if(!f.search){
      if(s.indexOf("invasive")>=0&&f.statuses.indexOf("invasive")<0)return false;
      if(s==="caution"&&f.statuses.indexOf("caution")<0)return false;
      if(!matchStatus(p,f.statuses))return false;
    }
    if(f.ptypes&&f.ptypes.length&&f.ptypes.indexOf(p.typeKey)<0)return false;
    if(f.heightCap&&p.heightFt>f.heightCap)return false;
    if(f.heightMin&&p.heightFt<f.heightMin)return false;
    if(!f.showCultivars&&p.isCultivar&&!f.search)return false;
    if(f.search){var re=new RegExp('\\b'+f.search.trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');if(!re.test(p.common)&&!re.test(p.latin))return false;}
    if(siteKey&&ZONE_KEYS.indexOf(siteKey)>=0&&(p.hasScores?(p.scores[siteKey]||0):zoneFallbackScore(p,siteKey))<3)return false;
    var cx=f.concerns||[];
    if(cx.indexOf("shadedby_norway")>=0&&(p.norwayMaple==="avoid"||!p.norwayMaple))return false;
    if(cx.indexOf("shadedby_pine")>=0&&(p.whitePine==="avoid"||!p.whitePine))return false;
    if(cx.indexOf("shadedby_conifer")>=0&&(p.hasScores?(p.scores["Conifer Shade"]||0):zoneFallbackScore(p,"Conifer Shade"))<2)return false;
    if(cx.indexOf("near_walnut")>=0&&p.juglone==="sensitive")return false;
    if(cx.indexOf("postconstruction")>=0&&(p.hasScores?getSiteScore(p,"postconstruction"):Math.max(zoneFallbackScore(p,"Dry Upper Slope"),zoneFallbackScore(p,"Dry Slope")))<3)return false;
    if(f.deerLevel==="high"&&p.deerPressure==="high")return false;
    if(f.deerLevel==="mod"&&(p.deerPressure==="high"||p.deerPressure==="medium"))return false;
    if(f.rabbitLevel==="high"&&p.rabbitDamage==="high")return false;
    if(f.rabbitLevel==="mod"&&(p.rabbitDamage==="high"||p.rabbitDamage==="medium"))return false;
    if(f.voleLevel==="high"&&p.voleRisk==="high")return false;
    if(f.voleLevel==="mod"&&(p.voleRisk==="high"||p.voleRisk==="medium"))return false;
    if(f.dogsLevel==="strict"&&p.toxicDogs==="yes")return false;
    if(f.dogsLevel==="mild"&&(p.toxicDogs==="yes"||p.toxicDogs==="medium"))return false;
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
    if(f.bloomMonth!==null&&!blooms(p,f.bloomMonth))return false;
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
