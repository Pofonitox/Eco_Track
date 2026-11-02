const STORAGE_KEY = "ecotrack_records_lima_v2"; // Conserva el historial previo.
const $ = id => document.getElementById(id);
const colors = ["#4b9a70","#9dcdb0","#e9c27b","#d9e2dc"];
const types = ["Papel/cartón","Plástico","Vidrio","Metal","Orgánico","Otros"];
const destinations = ["Reciclaje","Reutilización","Disposición","Pendiente"];
const districtCenter = Object.fromEntries(districtScenarios.map(p=>[p.name,[p.lat,p.lng]]));
let records=loadRecords(), map=null, mapMarkers=[], campusMarkers=new Map(), coordinateMarker=null, selectedCoordinate=null, pickingCoordinate=false, searchMatches=[];

function loadRecords() {
  try { const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]"); return Array.isArray(data)?data.filter(r=>r&&r.zone):[]; }
  catch { return []; }
}
function saveRecords() {
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify(records)); }
  catch { toast("No se pudo guardar: revisa el almacenamiento del navegador."); }
}
function todayISO(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function formatDate(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v||""))return "—";const [y,m,d]=v.split("-");return `${d}/${m}/${y}`;}
function escapeHTML(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function simplify(v){return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();}
function totalKg(items){return items.reduce((s,r)=>s+(Number(r.weight)||0),0);}
function filteredRecords(){const district=$("filterZone").value,type=$("filterType").value;return records.filter(r=>(!district||r.zone===district)&&(!type||r.type===type));}
function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),3200);}
function chooseColor(weight,campus=false){return weight>=(campus?60:500)?"#dc5b4e":weight>=(campus?35:300)?"#e0a13c":"#299767";}
function campusRecords(name){return records.filter(r=>r.zone==="San Juan de Lurigancho"&&r.sector===CAMPUS_SECTOR&&r.place===name);}

function render(){
  const data=filteredRecords(),total=totalKg(data),recovered=totalKg(data.filter(r=>["Reciclaje","Reutilización"].includes(r.destination)));
  $("totalWeight").innerHTML=`${total.toFixed(1)} <small>kg</small>`;
  $("recoveredWeight").innerHTML=`${recovered.toFixed(1)} <small>kg</small>`;
  $("recoveredPercent").innerHTML=`${total?(100*recovered/total).toFixed(1):"0.0"}<small>%</small>`;
  $("recordCount").textContent=data.length;
  renderTypeChart(data);renderDestination(data);renderTrend(data);renderTable();renderCampusSummary();renderMap();
}
function renderTypeChart(data){
  const sums=types.map(name=>({name,value:totalKg(data.filter(r=>r.type===name))})),max=Math.max(1,...sums.map(x=>x.value));
  $("typeChart").innerHTML=sums.map(x=>`<div class="bar-row"><span>${escapeHTML(x.name)}</span><div class="bar-track"><div class="bar-fill" style="width:${x.value/max*100}%"></div></div><span class="bar-value">${x.value.toFixed(1)}</span></div>`).join("");
}
function renderDestination(data){
  const counts=destinations.map(n=>data.filter(r=>r.destination===n).length),total=counts.reduce((a,b)=>a+b,0);let cursor=0;
  const segments=counts.map((v,i)=>{const start=cursor;cursor+=total?v/total*100:0;return `${colors[i]} ${start}% ${cursor}%`;});
  $("destinationDonut").style.background=total?`conic-gradient(${segments.join(",")})`:"#edf1ed";
  $("donutTotal").textContent=total;
  $("destinationLegend").innerHTML=destinations.map((n,i)=>`<div class="legend-item"><i class="legend-dot" style="background:${colors[i]}"></i>${escapeHTML(n)}<b>${counts[i]}</b></div>`).join("");
}
function renderTrend(data){
  const grouped={};data.forEach(r=>grouped[r.date]=(grouped[r.date]||0)+(Number(r.weight)||0));
  const entries=Object.entries(grouped).sort((a,b)=>a[0].localeCompare(b[0])).slice(-8);
  if(!entries.length){$("trendChart").innerHTML='<span class="muted">Aún no hay registros para mostrar.</span>';return;}
  const max=Math.max(1,...entries.map(x=>x[1]));
  $("trendChart").innerHTML=entries.map(([date,kg])=>`<div class="trend-col" title="${formatDate(date)}: ${kg.toFixed(2)} kg"><div class="trend-bar" style="height:${Math.max(3,kg/max*100)}%"></div><span>${date.slice(5).replace("-","/")}</span></div>`).join("");
}
function renderTable(){
  const sorted=[...records].sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  $("emptyState").style.display=sorted.length?"none":"block";
  $("recordsBody").innerHTML=sorted.map(r=>`<tr>
    <td>${escapeHTML(r.id)}</td><td>${formatDate(r.date)}</td><td>${escapeHTML(r.zone)}</td>
    <td>${escapeHTML(r.sector||"No especificada")}</td><td>${escapeHTML(r.place||"No especificado")}</td>
    <td>${escapeHTML(r.type)}</td><td class="weight-cell">${Number(r.weight||0).toFixed(2)} kg</td>
    <td><span class="severity-chip ${simplify(r.severity||"sin-dato")}">${escapeHTML(r.severity||"—")}</span></td>
    <td>${escapeHTML(r.status||"—")}</td><td><span class="pill">${escapeHTML(r.destination)}</span></td>
    <td><button class="delete-btn" data-delete="${escapeHTML(r.id)}" title="Eliminar registro" aria-label="Eliminar ${escapeHTML(r.id)}">×</button></td>
  </tr>`).join("");
  $("tableCount").textContent=`${sorted.length} ${sorted.length===1?"registro":"registros"}`;
}
function renderCampusSummary(){
  $("campusPointCount").textContent=campusPoints.length;
  $("campusBaseline").textContent=`${totalKg(campusPoints).toFixed(0)} kg`;
  $("campusRecordCount").textContent=records.filter(r=>r.zone==="San Juan de Lurigancho"&&r.sector===CAMPUS_SECTOR).length;
  $("campusPointsList").innerHTML=campusPoints.map((p,i)=>{
    const matches=campusRecords(p.name);
    return `<button type="button" class="campus-point" data-campus-index="${i}"><span class="campus-point-dot" style="background:${chooseColor(p.weight,true)}"></span>
      <span class="point-description"><strong>${escapeHTML(p.name)}</strong><small>${matches.length} registro(s) · ${totalKg(matches).toFixed(1)} kg registrados</small></span>
      <span class="point-weight">${p.weight} kg</span></button>`;
  }).join("");
}

function initMap(){
  if(!window.L){$("limaMap").innerHTML='<div class="map-fallback">No se pudo cargar el mapa. Revisa tu conexión.</div>';return;}
  map=L.map("limaMap").setView([-12.04,-77.02],10);
  L.tileLayer("https://tile.openmaps.fr/opentopomap/{z}/{x}/{y}.png",{
    attribution:'&copy; <a href="https://github.com/sletuffe/OpenTopoMap">OpenTopoMap-R</a> · <a href="https://openmaps.fr/donate">Apoyar</a> · &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom:19,maxNativeZoom:18
  }).addTo(map);
  map.on("zoomend",renderMap);
  map.on("click",e=>{
    if(!pickingCoordinate)return;
    selectedCoordinate={lat:e.latlng.lat,lng:e.latlng.lng};pickingCoordinate=false;
    updateCoordinateMarker();$("pickLocationBtn").textContent="⌖ Cambiar ubicación";$("clearLocationBtn").hidden=false;
    toast("Pin colocado; se guardará en el siguiente registro.");$("registro").scrollIntoView({behavior:"smooth",block:"start"});
  });
  renderMap();
}
function updateCoordinateLabel(){
  $("coordinatesLabel").textContent=`${selectedCoordinate.lat.toFixed(6)}, ${selectedCoordinate.lng.toFixed(6)} · Arrastra el pin si necesitas ajustar.`;
}
function updateCoordinateMarker(){
  if(!map)return;
  if(coordinateMarker){map.removeLayer(coordinateMarker);coordinateMarker=null;}
  if(!selectedCoordinate){$("coordinatesLabel").textContent="Puedes marcar la posición exacta con un clic en el mapa.";return;}
  coordinateMarker=L.marker([selectedCoordinate.lat,selectedCoordinate.lng],{draggable:true,title:"Ubicación elegida"}).addTo(map);
  coordinateMarker.bindPopup("Ubicación precisa del próximo registro.");
  coordinateMarker.on("dragend",()=>{
    const coords=coordinateMarker.getLatLng();selectedCoordinate={lat:coords.lat,lng:coords.lng};updateCoordinateLabel();
  });
  updateCoordinateLabel();
}
function renderMap(){
  if(!map)return;
  mapMarkers.forEach(m=>map.removeLayer(m));mapMarkers=[];campusMarkers.clear();
  const district=$("filterZone").value,data=filteredRecords();
  districtScenarios.filter(p=>!district||p.name===district).forEach(p=>{
    const mine=data.filter(r=>r.zone===p.name),color=chooseColor(p.weight);
    const m=L.circleMarker([p.lat,p.lng],{radius:Math.max(8,Math.min(19,7+p.weight/75)),color,fillColor:color,fillOpacity:.72,weight:2}).addTo(map);
    m.bindPopup(`<strong>${escapeHTML(p.name)}</strong><br>Índice de referencia: <b>${p.weight.toFixed(1)} kg</b><br>Registros propios: <b>${totalKg(mine).toFixed(2)} kg</b><br>${mine.length} eventos registrados<br><small>Centro distrital aproximado</small>`);
    mapMarkers.push(m);
  });
  if(!district||district==="San Juan de Lurigancho"){
    if(map.getZoom()<15){
      const m=L.marker(UCV_CENTER,{title:UCV_NAME}).addTo(map);
      m.bindPopup(`<strong>Campus UCV · San Juan de Lurigancho</strong><br>Av. del Parque 640 · Canto Rey<br>${campusPoints.length} puntos de seguimiento<br>Acércate para ver cada espacio.`);
      mapMarkers.push(m);
    } else {
      campusPoints.forEach(p=>{
        const mine=data.filter(r=>r.zone==="San Juan de Lurigancho"&&r.sector===CAMPUS_SECTOR&&r.place===p.name),color=chooseColor(p.weight,true);
        const m=L.circleMarker([p.lat,p.lng],{radius:9,color:"#fff",fillColor:color,fillOpacity:.96,weight:2}).addTo(map);
        m.bindTooltip(p.name,{direction:"top",offset:[0,-10]});
        m.bindPopup(`<strong>${escapeHTML(p.name)}</strong><br>Campus UCV SJL<br>Índice de referencia: <b>${p.weight} kg</b><br>${mine.length} registro(s) · ${totalKg(mine).toFixed(2)} kg<br><small>Posición interna orientativa</small>`);
        mapMarkers.push(m);campusMarkers.set(p.name,m);
      });
    }
  }
  data.filter(r=>r.lat!==null&&r.lng!==null&&r.lat!==undefined&&r.lng!==undefined&&Number.isFinite(Number(r.lat))&&Number.isFinite(Number(r.lng))).forEach(r=>{
    const m=L.circleMarker([Number(r.lat),Number(r.lng)],{radius:5,color:"#17689e",fillColor:"#43a4e5",fillOpacity:.95,weight:2}).addTo(map);
    m.bindPopup(`<strong>Registro ${escapeHTML(r.id)}</strong><br>${escapeHTML(r.sector||r.zone)} · ${escapeHTML(r.place||"Punto personalizado")}<br>${escapeHTML(r.type)} · <b>${Number(r.weight||0).toFixed(2)} kg</b><br>${escapeHTML(r.status||"Pendiente")}`);
    mapMarkers.push(m);
  });
}
function focusCampus(){
  $("filterZone").value="San Juan de Lurigancho";render();
  if(map)map.flyTo(UCV_CENTER,18,{duration:.7});
  $("mapa").scrollIntoView({behavior:"smooth",block:"start"});
}
function focusCampusPoint(name){
  const p=campusPoints.find(point=>point.name===name);if(!p)return;
  $("filterZone").value="San Juan de Lurigancho";render();
  if(map){
    map.once("moveend",()=>{renderMap();campusMarkers.get(name)?.openPopup();});
    map.flyTo([p.lat,p.lng],19,{duration:.65});
  }
  $("mapa").scrollIntoView({behavior:"smooth",block:"start"});
}
function showDistrict(name){
  if(!districtCenter[name])return;
  $("filterZone").value=name;render();
  if(map)map.flyTo(districtCenter[name],12,{duration:.65});
  $("mapa").scrollIntoView({behavior:"smooth",block:"start"});
}
function resetMap(){$("filterZone").value="";render();if(map)map.flyTo([-12.04,-77.02],10,{duration:.65});}

const searchCatalog=[
  {type:"campus",label:UCV_NAME,caption:"Campus UCV · Canto Rey",key:"ucv cesar vallejo universidad campus sjl"},
  ...campusPoints.map(p=>({type:"point",label:p.name,caption:"UCV · San Juan de Lurigancho",key:p.name==="Restaurante El Patio"?"patio de comidas cafeteria restaurante el patio":p.name})),
  ...districtScenarios.map(p=>({type:"district",label:p.name,caption:"Distrito de Lima",key:p.name})),
  ...Object.entries(districtSectors).flatMap(([district,sectors])=>sectors.map(sector=>({
    type:sector===CAMPUS_SECTOR?"campus":"sector",label:sector,caption:district,district,key:sector
  })))
];
function findMapMatches(query){
  const needle=simplify(query);if(needle.length<2)return [];
  return searchCatalog.filter(p=>simplify(`${p.label} ${p.key} ${p.caption}`).includes(needle))
    .sort((a,b)=>searchScore(a,needle)-searchScore(b,needle)).slice(0,10);
}
function searchScore(item,needle){
  const label=simplify(item.label),key=simplify(item.key);
  if(label===needle)return 0;
  if(label.startsWith(needle))return 1;
  if(key.includes(needle))return 2;
  return 3;
}
function renderSearchResults(){
  searchMatches=findMapMatches($("mapSearch").value);
  if(!searchMatches.length){
    $("mapResults").innerHTML=$("mapSearch").value.trim().length>1?'<div class="search-empty">Sin coincidencias. Prueba otro nombre de zona.</div>':"";
    $("mapResults").hidden=!$("mapResults").innerHTML;return;
  }
  $("mapResults").hidden=false;
  $("mapResults").innerHTML=searchMatches.map((p,i)=>`<button type="button" data-search-index="${i}"><strong>${escapeHTML(p.label)}</strong><small>${escapeHTML(p.caption)}</small></button>`).join("");
}
function chooseMapMatch(match){
  if(!match)return;
  $("mapSearch").value=match.label;$("mapResults").hidden=true;
  if(match.type==="point")focusCampusPoint(match.label);
  else if(match.type==="campus")focusCampus();
  else if(match.type==="district")showDistrict(match.label);
  else showDistrict(match.district);
}

function fillSelect(id,placeholder,values){
  $(id).innerHTML=`<option value="">${escapeHTML(placeholder)}</option>`+values.map(v=>`<option value="${escapeHTML(v)}">${escapeHTML(v)}</option>`).join("");
}
function fillDistricts(){
  fillSelect("zone","Seleccionar distrito",districts);
  fillSelect("filterZone","Todos los distritos",districts);
  fillSelect("filterType","Todos los residuos",types);
}
function updateSectorOptions(){
  const district=$("zone").value;
  fillSelect("sector",district?"Seleccionar zona o sector":"Primero selecciona un distrito",district?[...(districtSectors[district]||[]),"Otra zona (especificar)"]:[]);
  $("sector").disabled=!district;
  $("customSectorLabel").hidden=true;$("customSector").required=false;$("customSector").value="";
  updatePlaceOptions();
}
function updatePlaceOptions(){
  const sector=$("sector").value,custom=sector==="Otra zona (especificar)";
  $("customSectorLabel").hidden=!custom;$("customSector").required=custom;
  const choices=sector?(sector===CAMPUS_SECTOR?[...campusPoints.map(p=>p.name),"Otro punto (especificar)"]:regularPlaceOptions):[];
  fillSelect("place",sector?"Seleccionar punto específico":"Primero selecciona una zona",choices);
  $("place").disabled=!sector;updateCustomPlace();
}
function updateCustomPlace(){
  const custom=$("place").value==="Otro punto (especificar)";
  $("customPlaceLabel").hidden=!custom;$("customPlace").required=custom;
  if(!custom)$("customPlace").value="";
}
function chosenSector(){return $("sector").value==="Otra zona (especificar)"?$("customSector").value.trim():$("sector").value;}
function chosenPlace(){return $("place").value==="Otro punto (especificar)"?$("customPlace").value.trim():$("place").value;}
function resetForm(){
  $("wasteForm").reset();$("date").value=todayISO();$("status").value="Pendiente";
  updateSectorOptions();selectedCoordinate=null;pickingCoordinate=false;
  $("clearLocationBtn").hidden=true;$("pickLocationBtn").textContent="⌖ Seleccionar en el mapa";updateCoordinateMarker();
}
function addRecord(event){
  event.preventDefault();
  const weight=Number($("weight").value),sector=chosenSector(),place=chosenPlace();
  if(!Number.isFinite(weight)||weight<=0||!sector||!place){
    $("formMessage").textContent="Completa la ubicación y un peso válido mayor que cero.";return;
  }
  records.push({
    id:`R-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`,
    date:$("date").value,zone:$("zone").value,sector,place,locationType:$("locationType").value,
    type:$("type").value,weight,destination:$("destination").value,
    severity:$("severity").value,status:$("status").value,bags:$("bags").value===""?"":Number($("bags").value),
    frequency:$("frequency").value,observation:$("observation").value.trim(),
    lat:selectedCoordinate?Number(selectedCoordinate.lat.toFixed(7)):null,
    lng:selectedCoordinate?Number(selectedCoordinate.lng.toFixed(7)):null
  });
  saveRecords();resetForm();
  $("formMessage").textContent="Registro guardado correctamente. Se agregó al historial y al mapa.";
  render();toast("Registro guardado correctamente.");
}

function safeCell(value){
  const valueText=String(value??"");
  return /^[=+@\-\t\r]/.test(valueText)?"'"+valueText:valueText;
}
const recordHeaders=["ID","Fecha","Distrito","Zona / sector","Punto específico","Tipo de ubicación","Residuo","Peso (kg)","Destino","Nivel","Estado","Bolsas","Frecuencia","Observaciones","Latitud","Longitud"];
const districtHeaders=["Distrito","Índice referencial (kg)","Registros propios","Peso registrado (kg)","Latitud ref.","Longitud ref."];
const campusHeaders=["Punto UCV SJL","Índice referencial (kg)","Registros propios","Peso registrado (kg)","Latitud orientativa","Longitud orientativa"];
function recordExportRows(){
  return records.map(r=>[r.id,r.date,r.zone,r.sector||"",r.place||"",r.locationType||"",r.type,Number(r.weight)||0,r.destination,r.severity||"",r.status||"",r.bags??"",r.frequency||"",r.observation||"",r.lat??"",r.lng??""]);
}
function districtExportRows(){
  return districtScenarios.map(p=>{
    const mine=records.filter(r=>r.zone===p.name);
    return [p.name,p.weight,mine.length,Number(totalKg(mine).toFixed(2)),p.lat,p.lng];
  });
}
function campusExportRows(){
  return campusPoints.map(p=>{
    const mine=campusRecords(p.name);
    return [p.name,p.weight,mine.length,Number(totalKg(mine).toFixed(2)),Number(p.lat.toFixed(7)),Number(p.lng.toFixed(7))];
  });
}
function exportExcel(){
  if(!window.XLSX){toast("No se cargó el módulo Excel. Revisa la conexión.");return;}
  const workbook=XLSX.utils.book_new();
  function sheet(name,headers,rows,widths){
    const ws=XLSX.utils.aoa_to_sheet([headers,...rows.map(row=>row.map(v=>typeof v==="string"?safeCell(v):v))]);
    ws["!cols"]=widths.map(w=>({wch:w}));XLSX.utils.book_append_sheet(workbook,ws,name);
  }
  sheet("Registros",recordHeaders,recordExportRows(),[21,14,28,32,28,25,18,13,17,13,19,10,16,45,17,17]);
  sheet("Escenario Lima",districtHeaders,districtExportRows(),[30,25,18,24,17,17]);
  sheet("Campus UCV SJL",campusHeaders,campusExportRows(),[32,25,18,24,20,20]);
  sheet("Metodologia",["Información","Descripción"],[
    ["Proyecto","EcoTrack Lima - prototipo académico"],
    ["Escenario","Índices referenciales creados para el análisis académico; no son mediciones oficiales."],
    ["Registros","Datos ingresados manualmente y guardados en este navegador."],
    ["Georreferenciación","Posiciones interiores del campus orientativas; el usuario puede precisar el punto con un pin."],
    ["Referencia UCV","https://www.ucv.edu.pe/san-juan-de-lurigancho"]
  ],[24,96]);
  XLSX.writeFile(workbook,`EcoTrack_Lima_reporte_${todayISO()}.xlsx`);
  toast("Reporte Excel descargado con 4 hojas.");
}
function exportPDF(){
  const ctor=window.jspdf?.jsPDF;
  if(!ctor){toast("No se cargó el módulo PDF. Revisa la conexión.");return;}
  const doc=new ctor({orientation:"landscape",unit:"mm",format:"a4"});
  if(typeof doc.autoTable!=="function"){toast("No se pudo preparar la tabla del PDF.");return;}
  const total=totalKg(records),recovered=totalKg(records.filter(r=>["Reciclaje","Reutilización"].includes(r.destination)));
  const heading=(text,y=16)=>{doc.setTextColor(28,95,65);doc.setFont("helvetica","bold");doc.setFontSize(14);doc.text(text,12,y);doc.setFont("helvetica","normal");doc.setTextColor(75,98,85);doc.setFontSize(8);};
  doc.setFillColor(34,117,80);doc.rect(0,0,297,29,"F");
  doc.setTextColor(255,255,255);doc.setFont("helvetica","bold");doc.setFontSize(19);doc.text("EcoTrack Lima | Reporte ambiental",12,17);
  doc.setFont("helvetica","normal");doc.setFontSize(9);
  doc.text(`Emitido: ${formatDate(todayISO())}    |    Registros: ${records.length}    |    Peso: ${total.toFixed(2)} kg    |    Recuperado: ${recovered.toFixed(2)} kg`,12,24);
  heading("Seguimiento del campus UCV - San Juan de Lurigancho",39);
  doc.text("Av. del Parque 640, Canto Rey. Posiciones internas orientativas.",12,45);
  doc.autoTable({startY:49,head:[campusHeaders.slice(0,4)],body:campusExportRows().map(r=>r.slice(0,4)),theme:"striped",margin:{left:12,right:12},styles:{fontSize:8,cellPadding:2.1},headStyles:{fillColor:[38,117,79]}});
  doc.addPage();heading("Índices por distrito",16);
  doc.autoTable({startY:22,head:[districtHeaders.slice(0,4)],body:districtExportRows().map(r=>r.slice(0,4)),theme:"striped",margin:{left:12,right:12},styles:{fontSize:7.5,cellPadding:1.8},headStyles:{fillColor:[38,117,79]}});
  doc.addPage();heading("Historial de residuos registrados",16);
  if(records.length){
    const indexes=[1,2,3,4,6,7,8,9,10,13];
    doc.autoTable({startY:22,head:[indexes.map(i=>recordHeaders[i])],body:recordExportRows().map(row=>indexes.map(i=>String(row[i]??""))),theme:"grid",margin:{left:7,right:7},styles:{fontSize:6,cellPadding:1.5,overflow:"linebreak"},headStyles:{fillColor:[38,117,79]}});
  } else {doc.setTextColor(95,112,100);doc.setFontSize(10);doc.text("No se han ingresado registros propios.",12,28);}
  const pages=doc.internal.getNumberOfPages();
  for(let page=1;page<=pages;page++){
    doc.setPage(page);doc.setFontSize(7);doc.setTextColor(105,119,110);
    doc.text("Índices de escenario académico: valores referenciales, no mediciones oficiales.",12,201);
    doc.text(`${page} / ${pages}`,283,201,{align:"right"});
  }
  doc.save(`EcoTrack_Lima_reporte_${todayISO()}.pdf`);
  toast("Reporte PDF descargado.");
}

$("todayLabel").textContent=new Intl.DateTimeFormat("es-PE",{day:"2-digit",month:"short",year:"numeric"}).format(new Date());
fillDistricts();resetForm();render();initMap();
$("zone").addEventListener("change",updateSectorOptions);
$("sector").addEventListener("change",updatePlaceOptions);
$("place").addEventListener("change",updateCustomPlace);
$("wasteForm").addEventListener("submit",addRecord);
$("filterZone").addEventListener("change",()=>{
  render();const district=$("filterZone").value;
  if(map)map.flyTo(district?districtCenter[district]:[-12.04,-77.02],district?12:10,{duration:.55});
});
$("filterType").addEventListener("change",render);
$("topAddBtn").addEventListener("click",()=>$("registro").scrollIntoView({behavior:"smooth"}));
$("focusUcvBtn").addEventListener("click",focusCampus);
$("resetMapBtn").addEventListener("click",resetMap);
$("campusPointsList").addEventListener("click",e=>{
  const button=e.target.closest("[data-campus-index]");
  if(button)focusCampusPoint(campusPoints[Number(button.dataset.campusIndex)].name);
});
$("mapSearch").addEventListener("input",renderSearchResults);
$("mapSearch").addEventListener("keydown",e=>{
  if(e.key==="Enter"){e.preventDefault();chooseMapMatch(findMapMatches($("mapSearch").value)[0]);}
  if(e.key==="Escape")$("mapResults").hidden=true;
});
$("mapSearchBtn").addEventListener("click",()=>{
  const first=findMapMatches($("mapSearch").value)[0];
  if(first)chooseMapMatch(first);else toast("No se encontró esa zona en el catálogo.");
});
$("mapResults").addEventListener("click",e=>{
  const button=e.target.closest("[data-search-index]");
  if(button)chooseMapMatch(searchMatches[Number(button.dataset.searchIndex)]);
});
document.addEventListener("click",e=>{if(!e.target.closest(".map-search-box"))$("mapResults").hidden=true;});
$("pickLocationBtn").addEventListener("click",()=>{
  if(!map){toast("El mapa no está disponible en este momento.");return;}
  pickingCoordinate=true;$("pickLocationBtn").textContent="Haz clic en el mapa…";
  const selectedPoint=campusPoints.find(p=>$("sector").value===CAMPUS_SECTOR&&p.name===$("place").value);
  const center=selectedPoint?[selectedPoint.lat,selectedPoint.lng]:($("zone").value?districtCenter[$("zone").value]:[-12.04,-77.02]);
  map.flyTo(center,selectedPoint?19:($("sector").value===CAMPUS_SECTOR?18:13),{duration:.6});
  $("mapa").scrollIntoView({behavior:"smooth",block:"start"});
  toast("Haz clic en el mapa para colocar el pin. Luego puedes arrastrarlo.");
});
$("clearLocationBtn").addEventListener("click",()=>{
  selectedCoordinate=null;pickingCoordinate=false;$("clearLocationBtn").hidden=true;
  $("pickLocationBtn").textContent="⌖ Seleccionar en el mapa";updateCoordinateMarker();
});
$("recordsBody").addEventListener("click",e=>{
  const button=e.target.closest("[data-delete]");if(!button)return;
  records=records.filter(r=>r.id!==button.dataset.delete);saveRecords();render();toast("Registro eliminado.");
});
$("clearBtn").addEventListener("click",()=>{
  if(records.length&&confirm("¿Seguro que deseas eliminar todos los registros ingresados? Los índices del mapa se conservarán.")){
    records=[];saveRecords();render();toast("Historial eliminado. El mapa conserva sus índices.");
  }
});
$("excelBtn").addEventListener("click",exportExcel);
$("pdfBtn").addEventListener("click",exportPDF);
