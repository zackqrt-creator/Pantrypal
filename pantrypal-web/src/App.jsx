import { useState, useEffect, useRef } from "react";

/* ─── Theme ─────────────────────────────────────────────────────────────── */
const C = {
  primary:    "#FF6B35",
  bg:         "#FAF9F6",
  white:      "#FFFFFF",
  text:       "#1A1A2E",
  textMid:    "#424242",
  textLight:  "#9E9E9E",
  border:     "#F0EDE8",
  green:      "#2E7D32",
  greenBg:    "#E8F5E9",
  greenBdr:   "#C8E6C9",
  orange:     "#E65100",
  orangeBg:   "#FFF3E0",
  orangeBdr:  "#FFCC80",
  gray:       "#F5F5F5",
  grayDark:   "#E0E0E0",
};

/* ─── Data ──────────────────────────────────────────────────────────────── */
const CATS = {
  Produce:   { emoji:"🥦", color:"#E8F5E9", accent:"#43A047", label:"Produce"   },
  Protein:   { emoji:"🍗", color:"#FFF3E0", accent:"#EF6C00", label:"Protein"   },
  Dairy:     { emoji:"🧀", color:"#E3F2FD", accent:"#1E88E5", label:"Dairy"     },
  Grains:    { emoji:"🍞", color:"#FFF8E1", accent:"#F9A825", label:"Grains"    },
  Oils:      { emoji:"🫒", color:"#F3E5F5", accent:"#8E24AA", label:"Oils"      },
  Beverages: { emoji:"🥤", color:"#E0F7FA", accent:"#00ACC1", label:"Beverages" },
  Snacks:    { emoji:"🍪", color:"#FCE4EC", accent:"#E91E63", label:"Snacks"    },
  Breakfast: { emoji:"🥣", color:"#FFFDE7", accent:"#F57F17", label:"Breakfast" },
  Other:     { emoji:"📦", color:"#F5F5F5", accent:"#757575", label:"Other"     },
};

const STORES = [
  { key:"instacart", name:"Instacart",     subtitle:"Safeway · Raley's · Target · 1,500+ stores", emoji:"🛍️", color:"#43B02A", bg:"#F0FBF0", border:"#C8E6C9", best:true,  buildUrl:(items) => `https://www.instacart.com/store/s?q=${encodeURIComponent(items[0]||"")}` },
  { key:"safeway",   name:"Safeway",       subtitle:"Pickup & Delivery",                           emoji:"🏪", color:"#E31837", bg:"#FFF5F5", border:"#FFCDD2", best:false, buildUrl:(items) => `https://www.safeway.com/shop/search-results.html?q=${encodeURIComponent(items[0]||"")}` },
  { key:"raleys",    name:"Raley's",       subtitle:"Pickup & Delivery",                           emoji:"🏬", color:"#004990", bg:"#F0F4FF", border:"#BBDEFB", best:false, buildUrl:(items) => `https://www.raleys.com/search/?query=${encodeURIComponent(items[0]||"")}` },
  { key:"target",    name:"Target",        subtitle:"Same-day via Shipt",                          emoji:"🎯", color:"#CC0000", bg:"#FFF5F5", border:"#FFCDD2", best:false, buildUrl:(items) => `https://www.target.com/s?searchTerm=${encodeURIComponent(items[0]||"")}` },
  { key:"kroger",    name:"Kroger/Ralphs", subtitle:"Direct cart integration",                     emoji:"🛒", color:"#004B8D", bg:"#F0F4FF", border:"#BBDEFB", best:false, buildUrl:(items) => `https://www.kroger.com/search?query=${encodeURIComponent(items[0]||"")}` },
];

const AISLE_MAP = [
  { match:/(chicken|beef|pork|turkey|salmon|tuna|shrimp)/i,   aisle:"Aisle 4",  section:"Meat & Seafood",    zone:"Back Left"    },
  { match:/(egg)/i,                                           aisle:"Aisle 2",  section:"Dairy & Eggs",      zone:"Refrigerated" },
  { match:/(milk|cream|butter|cheese|yogurt)/i,               aisle:"Aisle 2",  section:"Dairy",             zone:"Refrigerated" },
  { match:/(spinach|lettuce|kale|arugula)/i,                  aisle:"Aisle 1",  section:"Produce — Greens",  zone:"Front Right"  },
  { match:/(tomato|pepper|onion|garlic|lemon|lime|avocado)/i, aisle:"Aisle 1",  section:"Produce — Veg",     zone:"Front Right"  },
  { match:/(apple|banana|berry|grape|orange|mango)/i,         aisle:"Aisle 1",  section:"Produce — Fruit",   zone:"Front Center" },
  { match:/(pasta|rice|noodle|rotini|spaghetti|penne)/i,      aisle:"Aisle 7",  section:"Pasta & Grains",    zone:"Center"       },
  { match:/(bread|tortilla|bagel|bun|roll)/i,                 aisle:"Aisle 6",  section:"Bread & Bakery",    zone:"Center Right" },
  { match:/(oil|vinegar|sauce|condiment|dressing|mayo)/i,     aisle:"Aisle 8",  section:"Oils & Condiments", zone:"Center"       },
  { match:/(soda|juice|water|tea|coffee)/i,                   aisle:"Aisle 10", section:"Beverages",         zone:"Back Right"   },
  { match:/(chip|cracker|cookie|snack|popcorn)/i,             aisle:"Aisle 9",  section:"Snacks",            zone:"Center Right" },
  { match:/(flour|sugar|baking|vanilla|yeast)/i,              aisle:"Aisle 11", section:"Baking",            zone:"Center Left"  },
];

const getAisle = (name) => {
  for (const r of AISLE_MAP) if (r.match.test(name)) return r;
  return { aisle:"Aisle 3", section:"General Grocery", zone:"Center" };
};

const TODAY = new Date().toISOString().split("T")[0];
const addDays = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate()+n); return dt.toISOString().split("T")[0]; };
const daysLeft = (exp) => exp ? Math.ceil((new Date(exp)-new Date(TODAY))/86400000) : null;
const expiryBadge = (d) => {
  if (d===null) return null;
  if (d<0)   return { text:"Expired",       bg:"#FFEBEE", color:"#C62828" };
  if (d===0) return { text:"Expires today", bg:"#FFF3E0", color:"#E65100" };
  if (d<=2)  return { text:`${d}d left`,    bg:"#FFF3E0", color:"#EF6C00" };
  if (d<=7)  return { text:`${d}d left`,    bg:"#FFFDE7", color:"#F57F17" };
  return null;
};
const guessCategory = (tags=[], name="") => {
  const t = [...tags, name].join(" ").toLowerCase();
  if (/(chicken|beef|pork|fish|meat|shrimp|tuna|salmon|turkey|egg)/.test(t)) return "Protein";
  if (/(milk|cheese|cream|dairy|yogurt|butter)/.test(t)) return "Dairy";
  if (/(pasta|rice|bread|grain|cereal|flour|oat|tortilla)/.test(t)) return "Grains";
  if (/(tomato|lettuce|onion|garlic|lemon|berry|apple|banana|carrot|pepper|spinach|vegetable|fruit)/.test(t)) return "Produce";
  if (/(oil|vinegar|sauce|condiment|dressing|mayo|ketchup)/.test(t)) return "Oils";
  if (/(soda|juice|water|drink|beverage|cola|coffee|tea)/.test(t)) return "Beverages";
  if (/(chip|cookie|snack|candy|chocolate|popcorn|pretzel)/.test(t)) return "Snacks";
  if (/(breakfast|cereal|granola|waffle|pancake|oatmeal)/.test(t)) return "Breakfast";
  return "Other";
};

const DEMO_ITEMS = [
  { id:1,  name:"Chicken Breast",  category:"Protein",  emoji:"🍗", qty:2, addedDate:TODAY, expiryDate:addDays(TODAY,3)   },
  { id:2,  name:"Pasta Rotini",    category:"Grains",   emoji:"🍝", qty:1, addedDate:TODAY, expiryDate:addDays(TODAY,365) },
  { id:3,  name:"Olive Oil",       category:"Oils",     emoji:"🫒", qty:1, addedDate:TODAY, expiryDate:addDays(TODAY,180) },
  { id:4,  name:"Cherry Tomatoes", category:"Produce",  emoji:"🍅", qty:1, addedDate:TODAY, expiryDate:addDays(TODAY,5)   },
  { id:5,  name:"Garlic",          category:"Produce",  emoji:"🧄", qty:3, addedDate:TODAY, expiryDate:addDays(TODAY,14)  },
  { id:6,  name:"Parmesan Cheese", category:"Dairy",    emoji:"🧀", qty:1, addedDate:TODAY, expiryDate:addDays(TODAY,1)   },
  { id:7,  name:"Eggs",            category:"Dairy",    emoji:"🥚", qty:6, addedDate:TODAY, expiryDate:addDays(TODAY,21)  },
  { id:8,  name:"Baby Spinach",    category:"Produce",  emoji:"🥬", qty:1, addedDate:TODAY, expiryDate:addDays(TODAY,2)   },
  { id:9,  name:"Heavy Cream",     category:"Dairy",    emoji:"🥛", qty:1, addedDate:TODAY, expiryDate:addDays(TODAY,7)   },
  { id:10, name:"Lemon",           category:"Produce",  emoji:"🍋", qty:2, addedDate:TODAY, expiryDate:addDays(TODAY,10)  },
  { id:11, name:"Yellow Onion",    category:"Produce",  emoji:"🧅", qty:2, addedDate:TODAY, expiryDate:addDays(TODAY,30)  },
  { id:12, name:"Butter",          category:"Dairy",    emoji:"🧈", qty:1, addedDate:TODAY, expiryDate:addDays(TODAY,30)  },
];

const FALLBACK_RECIPES = [
  { title:"Lemon Garlic Chicken",   time:"25 min", difficulty:"Easy",   emoji:"🍗", description:"Bright juicy weeknight chicken with a buttery pan sauce.", ingredients:["Chicken Breast","Garlic","Lemon","Olive Oil","Butter"],                               steps:["Season chicken with salt and pepper on both sides.","Sear in olive oil over medium-high heat, 5–6 min per side.","Remove chicken; add garlic and butter to the same pan.","Squeeze in lemon and stir for 1 minute.","Return chicken, spoon sauce over, and serve."] },
  { title:"Garlic Parmesan Pasta",  time:"20 min", difficulty:"Easy",   emoji:"🍝", description:"Buttery, cheesy, garlicky comfort in a bowl.",               ingredients:["Pasta","Garlic","Parmesan Cheese","Butter","Olive Oil"],                          steps:["Boil salted water and cook pasta until al dente.","Reserve 1 cup pasta water before draining.","Sauté garlic in butter and olive oil for 1 minute.","Toss pasta with parmesan and a splash of pasta water.","Stir until creamy. Top with extra parmesan."] },
  { title:"Cherry Tomato Pasta",    time:"25 min", difficulty:"Easy",   emoji:"🍅", description:"Blistered tomatoes burst into a quick rustic sauce.",         ingredients:["Pasta","Cherry Tomatoes","Baby Spinach","Garlic","Olive Oil","Parmesan Cheese"], steps:["Boil pasta until al dente.","Cook garlic and tomatoes in oil 5 min until burst.","Add spinach and wilt 1 min.","Toss with drained pasta.","Top with parmesan and serve."] },
  { title:"Creamy Chicken Alfredo", time:"30 min", difficulty:"Medium", emoji:"🍝", description:"Restaurant-style alfredo faster than delivery.",             ingredients:["Chicken Breast","Pasta","Heavy Cream","Parmesan Cheese","Garlic","Butter"],      steps:["Sear seasoned chicken in butter 6 min per side. Slice.","Sauté garlic in same pan.","Pour in cream and simmer 3 minutes.","Stir in parmesan until silky.","Toss with pasta and sliced chicken."] },
  { title:"Spinach Frittata",       time:"20 min", difficulty:"Easy",   emoji:"🥧", description:"An any-time Italian baked egg dish packed with greens.",     ingredients:["Eggs","Baby Spinach","Parmesan Cheese","Butter","Garlic"],                       steps:["Heat oven to 400°F. Whisk eggs with parmesan.","Melt butter in oven-safe skillet.","Wilt garlic and spinach 2 min.","Pour eggs over greens, cook 2 min.","Bake 8–10 min until puffed and golden."] },
  { title:"Lemon Butter Pasta",     time:"15 min", difficulty:"Easy",   emoji:"🍋", description:"Bright, citrusy, indulgent, and ready in 15 minutes.",       ingredients:["Pasta","Lemon","Butter","Parmesan Cheese","Garlic"],                             steps:["Cook pasta, reserve pasta water.","Melt butter and sauté garlic 1 min.","Add lemon juice, zest, pasta water.","Toss with pasta.","Finish with parmesan and pepper."] },
];

const matchFallback = (pantryItems, expiringNames=[]) => {
  const txt = pantryItems.map(i=>i.name.toLowerCase()).join(" ");
  const coreMap = {
    "Lemon Garlic Chicken":   ["chicken","garlic","lemon"],
    "Garlic Parmesan Pasta":  ["pasta","garlic","parmesan"],
    "Cherry Tomato Pasta":    ["pasta","tomato","garlic"],
    "Creamy Chicken Alfredo": ["chicken","pasta","cream","parmesan"],
    "Spinach Frittata":       ["egg","spinach"],
    "Lemon Butter Pasta":     ["pasta","lemon","butter"],
  };
  return FALLBACK_RECIPES.map(r => {
    const core = coreMap[r.title]||[];
    const have = core.filter(c=>txt.includes(c)).length;
    const pct  = core.length ? have/core.length : 0;
    const usesExp = r.ingredients.some(ing=>expiringNames.some(e=>e.toLowerCase().includes(ing.toLowerCase().split(" ")[0])||ing.toLowerCase().includes(e.toLowerCase().split(" ")[0])));
    return {...r, score: pct + (usesExp?0.3:0)};
  }).filter(r=>r.score>=0.5).sort((a,b)=>b.score-a.score).slice(0,6);
};

/* ══════════════════════════════════════════════════════════════════════════
   APP
══════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [tab, setTab]               = useState("pantry");
  const [items, setItems]           = useState(DEMO_ITEMS);
  const [shopList, setShopList]     = useState([]);
  const [recipes, setRecipes]       = useState([]);
  const [recSrc, setRecSrc]         = useState(null);
  const [loadingRec, setLoadingRec] = useState(false);
  const [storeModal, setStoreModal] = useState(null);
  const [toast, setToast]           = useState(null);
  const nextId = useRef(300);

  const showToast = (msg, type="success") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null),2500);
  };

  const expiringSoon = items.filter(i=>{const d=daysLeft(i.expiryDate);return d!==null&&d>=0&&d<=2;});
  const lowStock     = items.filter(i=>i.qty<=2);
  const orderAlerts  = [...expiringSoon,...lowStock.filter(i=>!expiringSoon.find(e=>e.id===i.id))].slice(0,5);
  const pendingCount = shopList.filter(i=>!i.checked).length;

  const changeQty = (id,delta) => {
    setItems(prev=>{
      const next=prev.map(i=>i.id===id?{...i,qty:i.qty+delta}:i);
      const item=next.find(i=>i.id===id);
      if(item&&item.qty<=0){const orig=prev.find(i=>i.id===id);if(orig)autoShop(orig);return prev.filter(i=>i.id!==id);}
      return next;
    });
  };
  const removeItem=(id)=>{const item=items.find(i=>i.id===id);setItems(p=>p.filter(i=>i.id!==id));if(item){autoShop(item);showToast(`${item.name} removed`,"info");}};
  const addItem=(ni)=>setItems(prev=>{const ex=prev.find(i=>i.name===ni.name);if(ex)return prev.map(i=>i.id===ex.id?{...i,qty:i.qty+(ni.qty||1)}:i);return[...prev,{...ni,id:nextId.current++,addedDate:TODAY}];});
  const setExpiry=(id,date)=>setItems(p=>p.map(i=>i.id===id?{...i,expiryDate:date}:i));
  const autoShop=(item)=>setShopList(p=>p.find(s=>s.name===item.name)?p:[...p,{id:Date.now()+Math.random(),name:item.name,emoji:item.emoji,checked:false}]);
  const toggleShop=(id)=>setShopList(p=>p.map(i=>i.id===id?{...i,checked:!i.checked}:i));
  const removeShop=(id)=>setShopList(p=>p.filter(i=>i.id!==id));
  const clearDone=()=>setShopList(p=>p.filter(i=>!i.checked));
  const addToShop=(name,emoji="🛒")=>setShopList(p=>p.find(s=>s.name===name)?p:[...p,{id:Date.now()+Math.random(),name,emoji,checked:false}]);

  const getMissing=(ingredients)=>{
    const pantry=items.map(i=>i.name.toLowerCase());
    return ingredients.filter(ing=>{const k=ing.toLowerCase().split(" ")[0];return!pantry.some(p=>p.includes(k)||k.includes(p.split(" ")[0]));});
  };

  const fetchRecipes=async()=>{
    setLoadingRec(true);
    const expNames=expiringSoon.map(i=>i.name);
    const fb=matchFallback(items,expNames);
    if(fb.length>0){setRecipes(fb);setRecSrc("smart");}
    else{setRecipes(FALLBACK_RECIPES.slice(0,5));setRecSrc("smart");}
    try{
      const list=items.map(i=>i.name).join(", ");
      const note=expNames.length?` Prioritize these expiring items: ${expNames.join(", ")}.`:"";
      const ctrl=new AbortController();
      const tmr=setTimeout(()=>ctrl.abort(),28000);
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",signal:ctrl.signal,headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-opus-4-6",max_tokens:1800,system:"You are a creative friendly home chef. Return ONLY a valid JSON array — no markdown, no backticks. Each object: title, time (e.g. '25 min'), difficulty ('Easy'|'Medium'|'Hard'), emoji (one food emoji), description (one warm sentence), ingredients (array of strings from pantry), steps (array of 4-6 friendly steps).",messages:[{role:"user",content:`My pantry: ${list}.${note} Give me 5 delicious recipes.`}]})});
      clearTimeout(tmr);
      if(!res.ok)throw new Error(`HTTP ${res.status}`);
      const data=await res.json();
      const text=data.content?.find(b=>b.type==="text")?.text||"";
      const m=text.replace(/```json|```/g,"").trim().match(/\[[\s\S]*\]/);
      if(!m)throw new Error("no json");
      const parsed=JSON.parse(m[0]);
      const valid=parsed.filter(r=>r.title&&r.steps&&r.ingredients).map(r=>({title:r.title,time:r.time||"30 min",difficulty:r.difficulty||"Easy",emoji:r.emoji||"🍽️",description:r.description||"",ingredients:Array.isArray(r.ingredients)?r.ingredients:[],steps:Array.isArray(r.steps)?r.steps:[]}));
      if(valid.length>0){setRecipes(valid);setRecSrc("ai");}
    }catch{}
    setLoadingRec(false);
  };

  useEffect(()=>{
    const fb=matchFallback(DEMO_ITEMS,[]);
    setRecipes(fb.length>0?fb:FALLBACK_RECIPES.slice(0,5));
    setRecSrc("smart");
  },[]);

  useEffect(()=>{if(tab==="recipes"&&recSrc==="smart")fetchRecipes();},[tab]);

  /* ── Max-width mobile container ───────────────────────────────────────── */
  return (
    <div style={{minHeight:"100vh",background:"#F0EDE8",display:"flex",justifyContent:"center"}}>
      <div style={{width:"100%",maxWidth:480,minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",position:"relative",boxShadow:"0 0 40px rgba(0,0,0,0.12)"}}>

        {/* Toast */}
        {toast&&(
          <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:1000,background:toast.type==="info"?"#424242":"#2E7D32",color:"#fff",padding:"10px 22px",borderRadius:50,fontWeight:700,fontSize:14,boxShadow:"0 4px 20px rgba(0,0,0,0.18)",whiteSpace:"nowrap",animation:"fadeDown .25s ease",maxWidth:"90vw",overflow:"hidden",textOverflow:"ellipsis"}}>
            {toast.msg}
          </div>
        )}

        {/* Store modal */}
        {storeModal&&<StoreModal items={storeModal.items} onClose={()=>setStoreModal(null)} onAddToList={(itms)=>{itms.forEach(n=>addToShop(n));showToast(`${itms.length} items added to list`);setStoreModal(null);}} />}

        {/* Header */}
        <div style={{background:C.white,padding:"20px 20px 0",borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:20}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div>
              <div style={{fontFamily:"'Lora',serif",fontSize:26,fontWeight:600,color:C.text,lineHeight:1}}>PantryPal 🧺</div>
              <div style={{fontSize:13,color:C.textLight,marginTop:4,fontWeight:600}}>{items.length} items · {pendingCount} on list</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5,alignItems:"flex-end"}}>
              {expiringSoon.length>0&&<button onClick={()=>{setTab("pantry");}} style={{background:C.orangeBg,border:`1.5px solid ${C.orangeBdr}`,borderRadius:10,padding:"6px 10px",cursor:"pointer",fontFamily:"inherit"}}>
                <span style={{fontSize:11,fontWeight:800,color:C.orange}}>⚠ {expiringSoon.length} expiring</span>
              </button>}
              {orderAlerts.length>0&&<button onClick={()=>setStoreModal({items:orderAlerts.map(i=>i.name)})} style={{background:C.greenBg,border:`1.5px solid ${C.greenBdr}`,borderRadius:10,padding:"6px 10px",cursor:"pointer",fontFamily:"inherit"}}>
                <span style={{fontSize:11,fontWeight:700,color:C.green}}>🛒 Order low stock</span>
              </button>}
            </div>
          </div>
          {/* Tabs */}
          <div style={{display:"flex"}}>
            {[{id:"pantry",icon:"🧺",label:"Pantry"},{id:"scanner",icon:"📷",label:"Scan"},{id:"recipes",icon:"🍳",label:"Recipes"},{id:"shopping",icon:"🛒",label:"List",badge:pendingCount}].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"10px 4px",background:"transparent",border:"none",borderBottom:tab===t.id?`3px solid ${C.primary}`:"3px solid transparent",color:tab===t.id?C.primary:C.textLight,fontFamily:"inherit",fontSize:12,fontWeight:tab===t.id?800:600,cursor:"pointer",position:"relative",transition:"all .15s"}}>
                <div style={{fontSize:20,marginBottom:2}}>{t.icon}</div>
                {t.label}
                {t.badge>0&&<span style={{position:"absolute",top:6,right:"50%",transform:"translateX(10px)",background:C.primary,color:"#fff",borderRadius:50,width:17,height:17,fontSize:10,fontWeight:900,display:"inline-flex",alignItems:"center",justifyContent:"center"}}>{t.badge}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div style={{flex:1,overflowY:"auto"}}>
          {tab==="pantry"&&<PantryTab items={items} expiringSoon={expiringSoon} changeQty={changeQty} removeItem={removeItem} setExpiry={setExpiry} onOrder={(name)=>setStoreModal({items:[name]})} onGoRecipes={()=>setTab("recipes")} />}
          {tab==="scanner"&&<ScannerTab addItem={addItem} showToast={showToast} />}
          {tab==="recipes"&&<RecipesTab recipes={recipes} recSrc={recSrc} loadingRec={loadingRec} items={items} getMissing={getMissing} onRefresh={fetchRecipes} onOrder={(missing)=>setStoreModal({items:missing})} />}
          {tab==="shopping"&&<ShoppingTab shopList={shopList} pendingCount={pendingCount} toggleShop={toggleShop} removeShop={removeShop} clearDone={clearDone} addToShop={addToShop} onOrder={(its)=>setStoreModal({items:its})} />}
        </div>
      </div>
      <style>{`@keyframes fadeDown{from{opacity:0;transform:translateX(-50%) translateY(-8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

/* ── Pantry Tab ─────────────────────────────────────────────────────────── */
function PantryTab({items,expiringSoon,changeQty,removeItem,setExpiry,onOrder,onGoRecipes}){
  const [search,setSearch]=useState("");
  const [catFilter,setCat]=useState("All");
  const [expSort,setExpSort]=useState(false);
  const allCats=["All",...Object.keys(CATS).filter(c=>items.some(i=>i.category===c))];
  const visible=(()=>{
    let list=catFilter==="All"?items:items.filter(i=>i.category===catFilter);
    if(search.trim())list=list.filter(i=>i.name.toLowerCase().includes(search.toLowerCase()));
    if(expSort)list=[...list].sort((a,b)=>(daysLeft(a.expiryDate)??9999)-(daysLeft(b.expiryDate)??9999));
    return list;
  })();
  return(
    <div style={{padding:16,paddingBottom:40}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search pantry..." style={{...inputSt,width:"100%",marginBottom:12}} />
      {expiringSoon.length>0&&(
        <div onClick={onGoRecipes} style={{background:"linear-gradient(135deg,#FFF3E0,#FFE0B2)",borderRadius:14,padding:"12px 14px",marginBottom:12,border:`1.5px solid ${C.orangeBdr}`,display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
          <span style={{fontSize:26}}>🍽️</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:800,color:C.orange}}>Use it up tonight</div>
            <div style={{fontSize:12,color:"#BF360C",fontWeight:600}}>{expiringSoon.slice(0,2).map(i=>i.name).join(", ")}{expiringSoon.length>2?` +${expiringSoon.length-2} more`:""} expiring soon</div>
          </div>
          <span style={{fontSize:18,color:C.orange}}>›</span>
        </div>
      )}
      <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4,marginBottom:10}}>
        {allCats.map(cat=>(
          <button key={cat} onClick={()=>setCat(cat)} style={{flexShrink:0,padding:"7px 16px",borderRadius:50,border:"none",background:catFilter===cat?C.primary:"#fff",color:catFilter===cat?"#fff":"#757575",fontFamily:"inherit",fontWeight:700,fontSize:13,cursor:"pointer",boxShadow:catFilter===cat?"0 2px 8px rgba(255,107,53,.35)":"0 1px 4px rgba(0,0,0,.08)",transition:"all .18s"}}>
            {cat==="All"?"All Items":`${CATS[cat]?.emoji} ${cat}`}
          </button>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
        <button onClick={()=>setExpSort(x=>!x)} style={{background:expSort?C.orangeBg:"#fff",border:`1.5px solid ${expSort?C.orangeBdr:C.grayDark}`,borderRadius:8,padding:"5px 12px",color:expSort?C.orange:C.textLight,fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer"}}>
          {expSort?"⏰ Sorted by expiry":"⏰ Sort by expiry"}
        </button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {visible.map((item,idx)=><PantryCard key={item.id} item={item} idx={idx} badge={expiryBadge(daysLeft(item.expiryDate))} onQty={changeQty} onRemove={removeItem} onExpiry={setExpiry} onOrder={onOrder} />)}
        {visible.length===0&&<div style={{textAlign:"center",padding:"50px 20px"}}><div style={{fontSize:48,marginBottom:12}}>{search?"🔍":"🤷"}</div><div style={{fontSize:16,fontWeight:700,color:"#BDBDBD"}}>{search?"No matches":"Nothing here yet"}</div></div>}
      </div>
    </div>
  );
}

function PantryCard({item,badge,onQty,onRemove,onExpiry,onOrder,idx}){
  const [expanded,setExpanded]=useState(false);
  const cat=CATS[item.category]||CATS.Other;
  return(
    <div style={{...cardSt,overflow:"hidden",animation:`fadeUp .3s ease ${Math.min(idx,8)*.04}s both`}}>
      <div style={{display:"flex",alignItems:"center",gap:12,padding:14}}>
        <div style={{width:48,height:48,borderRadius:14,background:cat.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{item.emoji}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:800,fontSize:15,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3,flexWrap:"wrap"}}>
            <span style={{...pillSt,background:cat.color,color:cat.accent}}>{cat.label}</span>
            {badge&&<span style={{...pillSt,background:badge.bg,color:badge.color}}>{badge.text}</span>}
            {item.qty<=1&&<span style={{...pillSt,background:C.orangeBg,color:C.orange}}>Low stock</span>}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
          <button onClick={()=>onQty(item.id,-1)} style={qBtnSt}>−</button>
          <span style={{fontSize:16,fontWeight:900,minWidth:22,textAlign:"center",color:C.text}}>{item.qty}</span>
          <button onClick={()=>onQty(item.id,1)} style={qBtnSt}>+</button>
        </div>
        <button onClick={()=>onOrder(item.name)} style={{background:C.greenBg,border:"none",borderRadius:8,padding:"7px 9px",cursor:"pointer",fontSize:16}}>🛒</button>
        <button onClick={()=>onRemove(item.id)} style={{background:"none",border:"none",color:C.grayDark,cursor:"pointer",fontSize:18,padding:"0 0 0 2px"}}>🗑</button>
      </div>
      <button onClick={()=>setExpanded(x=>!x)} style={{width:"100%",background:"none",border:"none",borderTop:`1px solid #F9F9F9`,padding:"8px 0",cursor:"pointer",fontSize:11,color:"#BDBDBD",fontWeight:600,fontFamily:"inherit"}}>
        {item.expiryDate?`📅 Expires: ${item.expiryDate}`:"+ Add expiry date"} {expanded?"▲":"▼"}
      </button>
      {expanded&&(
        <div style={{padding:"0 16px 14px",borderTop:`1px solid ${C.border}`}}>
          <div style={{fontSize:12,fontWeight:800,color:C.textLight,marginBottom:6,marginTop:10,letterSpacing:.5}}>EXPIRY DATE</div>
          <input type="date" value={item.expiryDate||""} onChange={e=>onExpiry(item.id,e.target.value)} style={{...inputSt,width:"100%"}} />
        </div>
      )}
    </div>
  );
}

/* ── Scanner Tab ────────────────────────────────────────────────────────── */
function ScannerTab({addItem,showToast}){
  const [mode,setMode]=useState("idle");
  const [barcode,setBarcode]=useState("");
  const [result,setResult]=useState(null);
  const [qty,setQty]=useState("1");
  const [expiry,setExpiry]=useState("");
  const [name,setName]=useState("");
  const [cat,setCat]=useState("Produce");
  const [mQty,setMQty]=useState("1");
  const videoRef=useRef(null);
  const streamRef=useRef(null);
  const readerRef=useRef(null);

  const lookup=async(code)=>{
    if(!code.trim())return;
    setMode("loading");
    try{
      const res=await fetch(`https://world.openfoodfacts.org/api/v0/product/${code.trim()}.json`);
      const data=await res.json();
      if(data.status===1&&data.product){
        const p=data.product;
        const nm=p.product_name_en||p.product_name||`Item ${code.slice(-4)}`;
        const tags=[...(p.categories_tags||[]),(p.food_groups_tags||[])];
        const catG=guessCategory(tags,nm);
        setResult({name:nm,category:catG,emoji:CATS[catG]?.emoji||"📦",brand:p.brands||"",image:p.image_front_small_url||null});
      }else{setResult({name:`Item ${code.slice(-4)}`,category:"Other",emoji:"📦",brand:"",image:null});}
    }catch{setResult({name:`Item ${code.slice(-4)}`,category:"Other",emoji:"📦",brand:"",image:null});}
    setMode("result");
  };

  const startCamera=async()=>{
    setMode("camera");
    try{
      const ZXing=await new Promise((res,rej)=>{
        if(window.__ZXingLoaded){res(window.ZXingBrowser);return;}
        const s=document.createElement("script");
        s.src="https://cdnjs.cloudflare.com/ajax/libs/zxing-js/0.21.3/zxing-browser.min.js";
        s.onload=()=>{window.__ZXingLoaded=true;res(window.ZXingBrowser);};
        s.onerror=rej;
        document.head.appendChild(s);
      });
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
      streamRef.current=stream;
      if(videoRef.current)videoRef.current.srcObject=stream;
      const reader=new ZXing.BrowserMultiFormatReader();
      readerRef.current=reader;
      reader.decodeFromVideoDevice(null,videoRef.current,(res)=>{
        if(res){stopCamera();lookup(res.getText());}
      });
    }catch{setMode("manual");showToast("Camera unavailable — enter barcode below","info");}
  };

  const stopCamera=()=>{
    try{readerRef.current?.reset?.();}catch{}
    try{streamRef.current?.getTracks().forEach(t=>t.stop());}catch{}
    streamRef.current=null;
    setMode("idle");
  };

  useEffect(()=>()=>stopCamera(),[]);

  const handleAdd=()=>{
    if(!result)return;
    addItem({name:result.name,category:result.category,emoji:result.emoji,qty:parseInt(qty)||1,expiryDate:expiry||null});
    showToast(`${result.name} added! 🎉`);
    setResult(null);setMode("idle");setBarcode("");setQty("1");setExpiry("");
  };

  const handleManualAdd=()=>{
    if(!name.trim()){showToast("Enter an item name","info");return;}
    addItem({name:name.trim(),category:cat,emoji:CATS[cat]?.emoji||"📦",qty:parseInt(mQty)||1,expiryDate:null});
    showToast(`${name.trim()} added! 🎉`);
    setName("");setMQty("1");
  };

  return(
    <div style={{padding:16,paddingBottom:40}}>
      {/* Viewfinder */}
      <div style={{borderRadius:24,overflow:"hidden",background:"#1A1A2E",marginBottom:16,boxShadow:"0 8px 32px rgba(0,0,0,.18)",height:220,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8}}>
        <video ref={videoRef} autoPlay playsInline muted style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",display:mode==="camera"?"block":"none"}} />
        {mode!=="camera"&&<><span style={{fontSize:mode==="loading"?40:48}}>{mode==="loading"?"⏳":"📷"}</span><span style={{fontSize:13,color:"rgba(255,255,255,.5)",fontWeight:600,textAlign:"center",padding:"0 20px"}}>{mode==="loading"?"Looking up product…":"Point camera at a barcode"}</span></>}
        {[{top:14,left:14,bt:2.5,bl:2.5},{top:14,right:14,bt:2.5,br:2.5},{bottom:14,left:14,bb:2.5,bl:2.5},{bottom:14,right:14,bb:2.5,br:2.5}].map((p,i)=>(
          <div key={i} style={{position:"absolute",width:22,height:22,borderTopWidth:p.bt||0,borderBottomWidth:p.bb||0,borderLeftWidth:p.bl||0,borderRightWidth:p.br||0,borderStyle:"solid",borderColor:C.primary,...p}} />
        ))}
      </div>

      {mode==="idle"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
          <button onClick={startCamera} style={{...btnPrimSt,width:"100%"}}>📷  Scan with Camera</button>
          <button onClick={()=>setMode("manual")} style={{...btnSecSt,width:"100%"}}>⌨️  Enter Barcode Manually</button>
        </div>
      )}
      {mode==="camera"&&<button onClick={stopCamera} style={{...btnSecSt,width:"100%",marginBottom:16}}>✕  Stop Camera</button>}
      {(mode==="manual"||mode==="idle")&&mode!=="camera"&&(
        <div style={{...cardSt,padding:16,marginBottom:16}}>
          <div style={labelSt}>ENTER BARCODE</div>
          <div style={{display:"flex",gap:8}}>
            <input value={barcode} onChange={e=>setBarcode(e.target.value)} onKeyDown={e=>e.key==="Enter"&&lookup(barcode)} placeholder="e.g. 012000001765" style={{...inputSt,flex:1}} />
            <button onClick={()=>lookup(barcode)} style={btnPrimSt}>Look up</button>
          </div>
          <div style={{fontSize:11,color:"#BDBDBD",marginTop:8}}>Demo: 012000001765 · 021130126026 · 070038640257</div>
        </div>
      )}

      {mode==="result"&&result&&(
        <div style={{...cardSt,padding:20,marginBottom:16,animation:"fadeUp .3s ease"}}>
          <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:16}}>
            {result.image?<img src={result.image} alt={result.name} style={{width:60,height:60,objectFit:"contain",borderRadius:12,background:"#F9F9F9",padding:4}} />
              :<div style={{width:60,height:60,borderRadius:12,background:CATS[result.category]?.color||"#F5F5F5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>{result.emoji}</div>}
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:16,color:C.text}}>{result.name}</div>
              {result.brand&&<div style={{fontSize:12,color:C.textLight,marginTop:2}}>{result.brand}</div>}
              <span style={{...pillSt,background:CATS[result.category]?.color,color:CATS[result.category]?.accent,display:"inline-block",marginTop:4}}>{result.emoji} {result.category}</span>
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:14}}>
            <div style={{flex:1}}><div style={labelSt}>QTY</div><input type="number" value={qty} min={1} onChange={e=>setQty(e.target.value)} style={{...inputSt,width:"100%",textAlign:"center"}} /></div>
            <div style={{flex:2}}><div style={labelSt}>EXPIRY (optional)</div><input type="date" value={expiry} onChange={e=>setExpiry(e.target.value)} style={{...inputSt,width:"100%"}} /></div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={handleAdd} style={{...btnPrimSt,flex:1}}>Add to Pantry ✓</button>
            <button onClick={()=>{setResult(null);setMode("idle");}} style={{padding:"13px 16px",background:C.gray,border:"none",borderRadius:12,color:C.textLight,fontFamily:"inherit",fontWeight:700,fontSize:14,cursor:"pointer"}}>✕</button>
          </div>
        </div>
      )}

      <div style={{display:"flex",alignItems:"center",gap:12,margin:"16px 0"}}>
        <div style={{flex:1,height:1,background:C.border}}/><span style={{fontSize:12,color:"#BDBDBD",fontWeight:700}}>or add manually</span><div style={{flex:1,height:1,background:C.border}}/>
      </div>

      <div style={{...cardSt,padding:18}}>
        <div style={labelSt}>ADD ITEM</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Item name (e.g. Butter)" style={{...inputSt,width:"100%"}} />
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
            {Object.keys(CATS).map(c=><button key={c} onClick={()=>setCat(c)} style={{flexShrink:0,padding:"6px 12px",borderRadius:50,border:"none",background:cat===c?C.primary:"#F5F5F5",color:cat===c?"#fff":"#757575",fontFamily:"inherit",fontWeight:700,fontSize:12,cursor:"pointer"}}>{CATS[c].emoji} {c}</button>)}
          </div>
          <div style={{display:"flex",gap:8}}>
            <input type="number" value={mQty} min={1} onChange={e=>setMQty(e.target.value)} style={{...inputSt,width:70,textAlign:"center"}} placeholder="Qty" />
            <button onClick={handleManualAdd} style={{...btnPrimSt,flex:1}}>Add to Pantry</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Recipes Tab ────────────────────────────────────────────────────────── */
function RecipesTab({recipes,recSrc,loadingRec,items,getMissing,onRefresh,onOrder}){
  const [selected,setSelected]=useState(null);
  const DIFF={Easy:"#2E7D32",Medium:"#E65100",Hard:"#C62828"};
  return(
    <div style={{padding:16,paddingBottom:40}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div>
          <div style={{fontFamily:"'Lora',serif",fontSize:22,fontWeight:600,color:C.text}}>What can I make?</div>
          <div style={{fontSize:13,color:C.textLight,fontWeight:600,marginTop:2}}>Based on {items.length} pantry items</div>
        </div>
        <button onClick={onRefresh} disabled={loadingRec} style={{background:C.white,border:`1.5px solid ${C.grayDark}`,borderRadius:10,padding:"8px 14px",color:C.textLight,fontFamily:"inherit",fontWeight:700,fontSize:13,cursor:"pointer",opacity:loadingRec?.6:1}}>
          {loadingRec?"⟳":"↺ Refresh"}
        </button>
      </div>

      {recSrc==="ai"&&<div style={{...sourceBadge,background:"#E8F5E9",marginBottom:12}}><span style={{fontSize:11,fontWeight:700,color:"#43A047"}}>✨ AI-curated by Claude Opus</span></div>}
      {recSrc==="smart"&&<div style={{...sourceBadge,background:"#E3F2FD",marginBottom:12}}><span style={{fontSize:11,fontWeight:700,color:"#1E88E5"}}>🧠 Smart-matched from your pantry</span></div>}

      {loadingRec&&recipes.length===0&&<div style={{textAlign:"center",padding:"60px 20px"}}><div style={{fontSize:56,marginBottom:12}}>🍳</div><div style={{fontSize:15,fontWeight:700,color:"#BDBDBD"}}>Cooking up ideas…</div></div>}

      {selected&&(
        <div style={{animation:"fadeUp .3s ease"}}>
          <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:C.primary,fontFamily:"inherit",fontWeight:700,fontSize:14,cursor:"pointer",padding:0,marginBottom:14}}>← Back to recipes</button>
          <div style={{...cardSt,padding:20}}>
            <div style={{fontSize:52,textAlign:"center",marginBottom:10}}>{selected.emoji}</div>
            <div style={{fontFamily:"'Lora',serif",fontSize:22,fontWeight:600,color:C.text,textAlign:"center",marginBottom:8}}>{selected.title}</div>
            <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:14}}>
              <span style={{...pillSt,background:C.gray,color:C.textLight}}>⏱ {selected.time}</span>
              <span style={{...pillSt,background:C.gray,color:DIFF[selected.difficulty]||C.textLight}}>{selected.difficulty}</span>
            </div>
            {selected.description&&<p style={{fontSize:14,color:C.textLight,lineHeight:1.7,textAlign:"center",marginBottom:20,fontStyle:"italic",fontFamily:"'Lora',serif"}}>{selected.description}</p>}
            {(()=>{
              const miss=getMissing(selected.ingredients);
              return miss.length>0?(
                <div style={{background:C.orangeBg,borderRadius:14,padding:14,marginBottom:20,border:`1.5px solid ${C.orangeBdr}`}}>
                  <div style={{fontSize:12,fontWeight:800,color:C.orange,marginBottom:8}}>YOU NEED {miss.length} MORE ITEM{miss.length!==1?"S":""}</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>{miss.map((m,i)=><span key={i} style={{fontSize:12,fontWeight:700,color:C.orange,background:"#fff",padding:"4px 10px",borderRadius:50,border:`1px solid ${C.orangeBdr}`}}>{m}</span>)}</div>
                  <button onClick={()=>onOrder(miss)} style={{...btnPrimSt,width:"100%"}}>🛒 Order from a nearby store</button>
                </div>
              ):(
                <div style={{background:C.greenBg,borderRadius:12,padding:12,marginBottom:20,display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:20}}>✅</span><span style={{fontSize:13,fontWeight:700,color:C.green}}>You have everything — let's cook!</span>
                </div>
              );
            })()}
            <div style={{background:"#F9F9F9",borderRadius:14,padding:14,marginBottom:18}}>
              <div style={labelSt}>INGREDIENTS</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {selected.ingredients.map((ing,i)=>{const miss=getMissing([ing]).length>0;return<span key={i} style={{fontSize:12,fontWeight:700,color:miss?C.orange:"#2E7D32",background:miss?C.orangeBg:"#E8F5E9",padding:"4px 10px",borderRadius:50}}>{miss?"✗ ":"✓ "}{ing}</span>;})}
              </div>
            </div>
            <div style={labelSt}>STEPS</div>
            {selected.steps.map((step,i)=>(
              <div key={i} style={{display:"flex",gap:12,marginBottom:14,alignItems:"flex-start"}}>
                <div style={{flexShrink:0,width:28,height:28,borderRadius:50,background:C.primary,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#fff",marginTop:1}}>{i+1}</div>
                <div style={{fontSize:14,color:C.textMid,lineHeight:1.7,paddingTop:4}}>{step}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!selected&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {recipes.map((r,i)=>{
            const missing=getMissing(r.ingredients);
            return(
              <div key={i} style={{...cardSt,overflow:"hidden",animation:`fadeUp .35s ease ${Math.min(i,8)*.07}s both`}}>
                <div onClick={()=>setSelected(r)} style={{padding:16,cursor:"pointer",display:"flex",gap:14,alignItems:"center"}}>
                  <div style={{width:56,height:56,borderRadius:14,background:"#FFF3E0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,flexShrink:0}}>{r.emoji}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:800,fontSize:15,color:C.text,marginBottom:4}}>{r.title}</div>
                    <div style={{display:"flex",gap:6,marginBottom:4,flexWrap:"wrap"}}>
                      <span style={{...pillSt,background:C.gray,color:C.textLight}}>⏱ {r.time}</span>
                      <span style={{...pillSt,background:C.gray,color:DIFF[r.difficulty]||C.textLight}}>{r.difficulty}</span>
                      {missing.length===0?<span style={{...pillSt,background:"#E8F5E9",color:"#2E7D32"}}>✓ All set</span>:<span style={{...pillSt,background:C.orangeBg,color:C.orange}}>Need {missing.length}</span>}
                    </div>
                    <div style={{fontSize:12,color:C.textLight,lineHeight:1.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.description}</div>
                  </div>
                  <span style={{color:"#E0E0E0",fontSize:22}}>›</span>
                </div>
                <div style={{padding:"0 16px 14px",borderTop:"1px solid #F5F5F5",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                  <span style={{fontSize:11,color:C.textLight,fontWeight:600,flex:1}}>
                    {missing.length>0?`Missing: ${missing.slice(0,2).join(", ")}${missing.length>2?` +${missing.length-2}`:""}` :"✓ You have everything"}
                  </span>
                  <button onClick={()=>onOrder(missing.length>0?missing:r.ingredients)} style={{background:missing.length>0?C.primary:"#43A047",border:"none",borderRadius:8,padding:"6px 14px",color:"#fff",fontFamily:"inherit",fontWeight:800,fontSize:12,cursor:"pointer",flexShrink:0}}>
                    🛒 {missing.length>0?"Order":"Shop"}
                  </button>
                </div>
              </div>
            );
          })}
          {recipes.length===0&&!loadingRec&&<div style={{textAlign:"center",padding:"50px 20px"}}><div style={{fontSize:48,marginBottom:12}}>👨‍🍳</div><div style={{fontSize:15,fontWeight:700,color:"#BDBDBD"}}>Add pantry items first</div></div>}
        </div>
      )}
    </div>
  );
}

/* ── Shopping Tab ───────────────────────────────────────────────────────── */
function ShoppingTab({shopList,pendingCount,toggleShop,removeShop,clearDone,addToShop,onOrder}){
  const [newItem,setNewItem]=useState("");
  const pending=shopList.filter(i=>!i.checked);
  const done=shopList.filter(i=>i.checked);
  const handleAdd=()=>{if(!newItem.trim())return;addToShop(newItem.trim());setNewItem("");};
  return(
    <div style={{padding:16,paddingBottom:40}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <div style={{fontFamily:"'Lora',serif",fontSize:22,fontWeight:600,color:C.text}}>Shopping List</div>
          <div style={{fontSize:13,color:C.textLight,fontWeight:600,marginTop:2}}>{pendingCount} item{pendingCount!==1?"s":""} to grab</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {pending.length>0&&<button onClick={()=>onOrder(pending.map(i=>i.name))} style={{background:C.greenBg,border:`1.5px solid ${C.greenBdr}`,borderRadius:10,padding:"8px 12px",color:C.green,fontFamily:"inherit",fontWeight:800,fontSize:12,cursor:"pointer"}}>🛒 Order all</button>}
          {done.length>0&&<button onClick={clearDone} style={{...btnSecSt,padding:"8px 14px",fontSize:13}}>Clear done</button>}
        </div>
      </div>
      {shopList.length===0&&<div style={{textAlign:"center",padding:"60px 20px"}}><div style={{fontSize:56,marginBottom:12}}>🛒</div><div style={{fontSize:15,fontWeight:700,color:"#BDBDBD"}}>Your list is empty</div><div style={{fontSize:13,color:"#E0E0E0",marginTop:6,lineHeight:1.6}}>Items auto-add when you run out<br/>of something in your pantry</div></div>}
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
        {[...pending,...done].map(item=>(
          <div key={item.id} style={{...cardSt,padding:14,display:"flex",alignItems:"center",gap:12,opacity:item.checked?.45:1,transition:"opacity .2s"}}>
            <button onClick={()=>toggleShop(item.id)} style={{width:24,height:24,borderRadius:50,flexShrink:0,border:`2px solid ${item.checked?C.primary:C.grayDark}`,background:item.checked?C.primary:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:900}}>
              {item.checked?"✓":""}
            </button>
            <span style={{fontSize:22}}>{item.emoji}</span>
            <span style={{flex:1,fontWeight:700,fontSize:15,color:item.checked?"#BDBDBD":C.text,textDecoration:item.checked?"line-through":"none"}}>{item.name}</span>
            {!item.checked&&<button onClick={()=>onOrder([item.name])} style={{background:C.greenBg,border:"none",borderRadius:8,padding:"5px 10px",color:C.green,fontFamily:"inherit",fontWeight:800,fontSize:12,cursor:"pointer"}}>Order</button>}
            <button onClick={()=>removeShop(item.id)} style={{background:"none",border:"none",color:C.grayDark,cursor:"pointer",fontSize:20,lineHeight:1,padding:0}}>×</button>
          </div>
        ))}
      </div>
      <div style={{...cardSt,padding:16}}>
        <div style={labelSt}>ADD TO LIST</div>
        <div style={{display:"flex",gap:8}}>
          <input value={newItem} onChange={e=>setNewItem(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAdd()} placeholder="e.g. Oat milk, Avocados…" style={{...inputSt,flex:1}} />
          <button onClick={handleAdd} style={btnPrimSt}>+ Add</button>
        </div>
      </div>
    </div>
  );
}

/* ── Store Modal ────────────────────────────────────────────────────────── */
function StoreModal({items,onClose,onAddToList}){
  const [selectedStore,setSelected]=useState(null);
  const openStore=(store,itms)=>{
    const a=document.createElement("a");
    a.href=store.buildUrl(itms);
    a.target="_blank";
    a.rel="noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  return(
    <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",flexDirection:"column",justifyContent:"flex-end",alignItems:"center"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(2px)"}} />
      <div style={{position:"relative",background:"#FAF9F6",borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,maxHeight:"88vh",overflow:"hidden",display:"flex",flexDirection:"column",animation:"fadeUp .3s ease"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"12px 0 0"}}><div style={{width:40,height:4,borderRadius:50,background:"#E0E0E0"}} /></div>
        <div style={{padding:"12px 20px 0",display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
          <div>
            {selectedStore&&<button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:C.primary,fontFamily:"inherit",fontWeight:700,fontSize:13,cursor:"pointer",padding:"0 0 4px 0"}}>← Back</button>}
            <div style={{fontFamily:"'Lora',serif",fontSize:20,fontWeight:600,color:C.text}}>{selectedStore?selectedStore.name:"Choose a store"}</div>
            <div style={{fontSize:12,color:C.textLight,fontWeight:600,marginTop:2}}>{items.length} item{items.length!==1?"s":""} to order</div>
          </div>
          <button onClick={onClose} style={{background:"#F0F0F0",border:"none",borderRadius:50,width:32,height:32,cursor:"pointer",fontSize:16,color:"#757575",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{overflowY:"auto",padding:"16px 20px 40px",flex:1}}>
          {!selectedStore&&(
            <>
              <div style={{...cardSt,padding:14,marginBottom:12}}>
                <div style={labelSt}>ITEMS TO ORDER ({items.length})</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {items.map((name,i)=>{const cat=guessCategory([],name);return<span key={i} style={{...pillSt,background:CATS[cat]?.color||"#F5F5F5",color:CATS[cat]?.accent||"#757575"}}>{CATS[cat]?.emoji} {name}</span>;})}
                </div>
              </div>
              <button onClick={()=>onAddToList(items)} style={{width:"100%",background:"#F9F9F9",border:`1.5px dashed ${C.grayDark}`,borderRadius:14,padding:14,cursor:"pointer",display:"flex",alignItems:"center",gap:12,fontFamily:"inherit",marginBottom:8}}>
                <span style={{fontSize:22}}>📋</span>
                <div style={{textAlign:"left"}}>
                  <div style={{fontSize:13,fontWeight:800,color:C.textMid}}>Save to Shopping List</div>
                  <div style={{fontSize:11,color:C.textLight}}>Add all items to your list for later</div>
                </div>
              </button>
              <div style={{display:"flex",alignItems:"center",gap:12,margin:"12px 0"}}>
                <div style={{flex:1,height:1,background:C.border}}/><span style={{fontSize:11,color:"#BDBDBD",fontWeight:700}}>or order now from</span><div style={{flex:1,height:1,background:C.border}}/>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {STORES.map(store=>(
                  <button key={store.key} onClick={()=>setSelected(store)} style={{background:store.bg,border:`1.5px solid ${store.border}`,borderRadius:16,padding:14,cursor:"pointer",display:"flex",alignItems:"center",gap:14,fontFamily:"inherit",width:"100%",textAlign:"left",transition:"transform .15s"}}>
                    <span style={{fontSize:32}}>{store.emoji}</span>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:15,fontWeight:800,color:C.text}}>{store.name}</span>
                        {store.best&&<span style={{...pillSt,background:"#E8F5E9",color:"#43B02A",fontSize:10}}>Best</span>}
                      </div>
                      <div style={{fontSize:11,fontWeight:700,color:store.color,marginTop:2}}>{store.subtitle}</div>
                    </div>
                    <span style={{color:"#E0E0E0",fontSize:20}}>›</span>
                  </button>
                ))}
              </div>
            </>
          )}
          {selectedStore&&(
            <>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {items.map((name,i)=>{
                  const cat=guessCategory([],name);
                  const aisle=getAisle(name);
                  return(
                    <div key={i} style={{...cardSt,padding:14}}>
                      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                        <div style={{width:44,height:44,borderRadius:12,background:CATS[cat]?.color||"#F5F5F5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{CATS[cat]?.emoji||"📦"}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:14,fontWeight:800,color:C.text}}>{name}</div>
                          <div style={{fontSize:11,color:CATS[cat]?.accent||"#757575",fontWeight:700,marginTop:2}}>{CATS[cat]?.label||"Grocery"}</div>
                        </div>
                        <a href={selectedStore.buildUrl([name])} target="_blank" rel="noopener noreferrer" style={{background:selectedStore.color,borderRadius:10,padding:"7px 14px",color:"#fff",fontFamily:"inherit",fontWeight:800,fontSize:12,textDecoration:"none",display:"inline-block"}}>Find →</a>
                      </div>
                      <div style={{background:"#F9F9F9",borderRadius:10,padding:10,display:"flex",gap:10,alignItems:"center"}}>
                        <span style={{fontSize:20}}>📍</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,fontWeight:800,color:C.text}}>{aisle.aisle} — {aisle.section}</div>
                          <div style={{fontSize:11,color:C.textLight,marginTop:2}}>📌 {aisle.zone} of store</div>
                        </div>
                        <div style={{background:"#E8F5E9",borderRadius:8,padding:"4px 8px",fontSize:10,fontWeight:800,color:"#43A047"}}>{aisle.aisle}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <a href={selectedStore.buildUrl(items)} target="_blank" rel="noopener noreferrer" style={{...btnPrimSt,display:"block",textAlign:"center",textDecoration:"none",marginTop:16,background:selectedStore.color}}>
                Shop all {items.length} items at {selectedStore.name} →
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Shared styles ──────────────────────────────────────────────────────── */
const cardSt={background:C.white,borderRadius:16,boxShadow:"0 2px 10px rgba(0,0,0,.06)"};
const pillSt={fontSize:11,padding:"3px 9px",borderRadius:50,fontWeight:700,display:"inline-block"};
const inputSt={background:"#F9F9F9",border:"1.5px solid #EEEEEE",borderRadius:10,padding:"11px 14px",color:C.text,fontFamily:"'Nunito',sans-serif",fontSize:14,fontWeight:600,outline:"none"};
const btnPrimSt={background:C.primary,color:"#fff",border:"none",borderRadius:12,padding:"13px 20px",fontWeight:800,fontFamily:"'Nunito',sans-serif",fontSize:14,cursor:"pointer"};
const btnSecSt={background:C.white,color:"#757575",border:`1.5px solid ${C.grayDark}`,borderRadius:12,padding:"13px 20px",fontWeight:700,fontFamily:"'Nunito',sans-serif",fontSize:14,cursor:"pointer"};
const qBtnSt={width:32,height:32,borderRadius:10,background:"#F5F5F5",border:"none",color:C.textMid,cursor:"pointer",fontSize:18,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Nunito',sans-serif"};
const labelSt={fontSize:12,fontWeight:800,color:"#9E9E9E",letterSpacing:.5,marginBottom:10};
const sourceBadge={alignSelf:"flex-start",padding:"4px 10px",borderRadius:50,display:"inline-block"};
