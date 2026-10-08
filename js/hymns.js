const HymnalData = (() => {
let hymns=[];
const normalize=value=>String(value??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();
const flattenSections=sections=>sections.map(s=>s.type+" "+(s.number??"")+" "+s.text).join(" ");
const prepare=hymn=>({...hymn,_search:normalize([hymn.number,hymn.title,hymn.firstLine,hymn.author,hymn.composer,hymn.tune,flattenSections(hymn.sections||[])].join(" "))});
async function load(){if(hymns.length)return hymns;const response=await fetch("./data/hymns.json",{cache:"no-cache"});if(!response.ok)throw new Error("Unable to load hymn data.");hymns=(await response.json()).map(prepare);return hymns}
function search(query){const term=normalize(query);if(!term)return hymns;const exactNumber=Number.parseInt(term,10);return hymns.map(h=>{const title=normalize(h.title),author=normalize(h.author),composer=normalize(h.composer),first=normalize(h.firstLine),words=normalize(flattenSections(h.sections||[]));let score=0;if(String(h.number)===term||(!Number.isNaN(exactNumber)&&Number(h.number)===exactNumber))score+=100;if(title===term)score+=90;if(title.startsWith(term))score+=70;if(first.startsWith(term))score+=60;if(author.startsWith(term))score+=50;if(composer.startsWith(term))score+=45;if(title.includes(term))score+=35;if(first.includes(term))score+=30;if(author.includes(term))score+=25;if(composer.includes(term))score+=20;if(words.includes(term))score+=15;if(h._search.includes(term))score+=5;return{h,score}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.h.number-b.h.number).map(x=>x.h)}
function getById(id){const n=Number.parseInt(id,10);return hymns.find(h=>h.number===n)}
function getHymnOfDay(){if(!hymns.length)return null;const now=new Date(),start=new Date(now.getFullYear(),0,0),day=Math.floor((now-start)/86400000);return hymns[day%hymns.length]}
return{load,search,getById,getHymnOfDay};
})();