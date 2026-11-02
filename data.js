// Catálogo de navegación del escenario académico. Las coordenadas distritales
// son centros aproximados; los puntos interiores UCV son referencias visuales.
const districts = [
  "Ancón","Ate","Barranco","Breña","Carabayllo","Chaclacayo","Chorrillos","Cieneguilla","Comas","El Agustino","Independencia","Jesús María","La Molina","La Victoria","Lima","Lince","Los Olivos","Lurigancho-Chosica","Lurín","Magdalena del Mar","Miraflores","Pachacámac","Pucusana","Pueblo Libre","Puente Piedra","Punta Hermosa","Punta Negra","Rímac","San Bartolo","San Borja","San Isidro","San Juan de Lurigancho","San Juan de Miraflores","San Luis","San Martín de Porres","San Miguel","Santa Anita","Santa María del Mar","Santa Rosa","Santiago de Surco","Surquillo","Villa El Salvador","Villa María del Triunfo"
];

const districtScenarios = [
  ["Ancón",-11.77,-77.17,310],["Ate",-12.03,-76.92,520],["Barranco",-12.15,-77.02,180],["Breña",-12.06,-77.05,260],
  ["Carabayllo",-11.85,-77.03,430],["Chaclacayo",-11.98,-76.77,150],["Chorrillos",-12.18,-77.01,390],
  ["Cieneguilla",-12.08,-76.77,120],["Comas",-11.94,-77.06,610],["El Agustino",-12.04,-76.99,470],
  ["Independencia",-11.99,-77.05,360],["Jesús María",-12.08,-77.05,210],["La Molina",-12.08,-76.94,190],
  ["La Victoria",-12.07,-77.02,560],["Lima",-12.046,-77.042,590],["Lince",-12.08,-77.04,170],
  ["Los Olivos",-11.97,-77.07,480],["Lurigancho-Chosica",-11.94,-76.70,230],["Lurín",-12.27,-76.87,290],
  ["Magdalena del Mar",-12.09,-77.07,140],["Miraflores",-12.12,-77.03,220],["Pachacámac",-12.23,-76.87,200],
  ["Pucusana",-12.48,-76.80,115],["Pueblo Libre",-12.08,-77.06,160],["Puente Piedra",-11.87,-77.08,410],
  ["Punta Hermosa",-12.34,-76.82,145],["Punta Negra",-12.37,-76.80,125],["Rímac",-12.03,-77.03,330],
  ["San Bartolo",-12.39,-76.78,135],["San Borja",-12.10,-76.99,250],["San Isidro",-12.10,-77.03,130],
  ["San Juan de Lurigancho",-11.98,-76.99,720],["San Juan de Miraflores",-12.16,-76.97,530],
  ["San Luis",-12.08,-76.99,190],["San Martín de Porres",-11.99,-77.09,570],["San Miguel",-12.08,-77.09,200],
  ["Santa Anita",-12.04,-76.97,310],["Santa María del Mar",-12.41,-76.77,90],["Santa Rosa",-11.78,-77.16,165],
  ["Santiago de Surco",-12.13,-76.99,280],["Surquillo",-12.11,-77.02,240],
  ["Villa El Salvador",-12.21,-76.94,490],["Villa María del Triunfo",-12.16,-76.92,460]
].map(([name,lat,lng,weight])=>({name,lat,lng,weight}));

const UCV_NAME = "Universidad César Vallejo · Campus SJL";
const UCV_CENTER = [-11.98169,-77.00019];
const CAMPUS_SECTOR = "Universidad César Vallejo (Canto Rey)";
// El catálogo de espacios procede del plano publicado por la universidad.
// Los desplazamientos son de presentación, no coordenadas topográficas verificadas.
const campusPoints = [
  ["Pabellón A",-0.00022,-0.00030,48],
  ["Pabellón B",-0.00017,-0.00008,68],
  ["Pabellón C",-0.00015, 0.00014,43],
  ["Pabellón D",-0.00013, 0.00033,36],
  ["Pabellón E", 0.00005,-0.00028,28],
  ["Pabellón F", 0.00005,-0.00008,57],
  ["Pabellón G", 0.00006, 0.00014,31],
  ["Pabellón H", 0.00008, 0.00033,22],
  ["Auditorio principal",0.00025,-0.00023,23],
  ["Restaurante El Patio",0.00024,-0.00003,74],
  ["Explanada del Pabellón B",-0.00031,0.00000,61],
  ["Tienda Listo!",0.00025,0.00015,39],
  ["Loza deportiva",0.00027,0.00033,33],
  ["Sala Tacabamba",-0.00031,0.00028,18],
  ["Zona estudiantil",0.00042,0.00000,67],
  ["UCV LAB",0.00042,-0.00023,26],
  ["Acceso principal",-0.00042,-0.00017,51]
].map(([name,dLat,dLng,weight])=>({name,lat:UCV_CENTER[0]+dLat,lng:UCV_CENTER[1]+dLng,weight}));

// Zonas de referencia para facilitar la selección. El usuario puede añadir
// otras mediante la opción "Otra zona" si su sector no figura en la lista.
const districtSectors = {
 "Ancón":["Ancón Centro","Playa Hermosa","Las Colinas","Piedras Gordas"],
 "Ate":["Vitarte","Santa Clara","Huaycán","Salamanca","Mayorazgo","Ceres"],
 "Barranco":["Barranco Centro","Bulevar de Barranco","Bajada de Baños","Zona del malecón"],
 "Breña":["Breña Centro","Chacra Colorada","Zona de la avenida Venezuela","Zona de la avenida Arica"],
 "Carabayllo":["San Pedro","El Progreso","Tungasuca","Lomas de Carabayllo"],
 "Chaclacayo":["Chaclacayo Centro","Los Cóndores","Ñaña","Morón"],
 "Chorrillos":["Chorrillos Centro","Villa","Matellini","La Campiña","Alto Perú"],
 "Cieneguilla":["Cieneguilla Centro","Huaycán de Cieneguilla","Tambo Viejo","Zona de la avenida Nueva Toledo"],
 "Comas":["Comas Centro","Collique","La Pascana","Santa Luzmila","Año Nuevo"],
 "El Agustino":["El Agustino Centro","Riva Agüero","Santoyo","Ancieta","Cerro El Agustino"],
 "Independencia":["Independencia Centro","Tahuantinsuyo","El Ermitaño","Payet"],
 "Jesús María":["Jesús María Centro","Campo de Marte","San Felipe","Zona de la avenida Brasil"],
 "La Molina":["La Molina Vieja","Santa Patricia","Camacho","Las Viñas","Musa"],
 "La Victoria":["La Victoria Centro","Gamarra","Balconcillo","Santa Catalina","San Cosme"],
 "Lima":["Centro histórico","Barrios Altos","Monserrate","Cercado Oeste","Mesa Redonda"],
 "Lince":["Lince Centro","Parque Castilla","Zona de la avenida Arequipa","Zona de Risso"],
 "Los Olivos":["Pro","Covida","Mercurio","Naranjal","Villa Sol"],
 "Lurigancho-Chosica":["Chosica Centro","Huachipa","Cajamarquilla","Jicamarca","Carapongo"],
 "Lurín":["Lurín Centro","Julio C. Tello","Pachacámac Rural","Zona industrial"],
 "Magdalena del Mar":["Magdalena Centro","Mercado de Magdalena","Zona del malecón","Zona de la avenida Brasil"],
 "Miraflores":["Miraflores Centro","Parque Kennedy","Larcomar","Zona del malecón","Santa Cruz"],
 "Pachacámac":["Pachacámac Centro","Manchay","Quebrada Verde","Huertos de Manchay"],
 "Pucusana":["Pucusana Centro","La Playa","Naplo","Zona del muelle"],
 "Pueblo Libre":["Pueblo Libre Centro","Plaza Bolívar","Zona de la avenida Sucre","Zona de la avenida Bolívar"],
 "Puente Piedra":["Puente Piedra Centro","Zapallal","Shangri-La","Laderas de Chillón"],
 "Punta Hermosa":["Punta Hermosa Centro","Playa Norte","Playa Sur","Zona del malecón"],
 "Punta Negra":["Punta Negra Centro","Playa Punta Negra","Zona de la avenida principal"],
 "Rímac":["Rímac Centro","Amancaes","Flor de Amancaes","Caquetá"],
 "San Bartolo":["San Bartolo Centro","Playa Norte","Playa Sur","Zona comercial"],
 "San Borja":["San Borja Centro","Pentagonito","San Borja Sur","Chacarilla"],
 "San Isidro":["San Isidro Centro","El Olivar","Centro financiero","Zona de Camino Real"],
 "San Juan de Lurigancho":[CAMPUS_SECTOR,"Canto Rey","Canto Grande","Zárate","Caja de Agua","Las Flores","Bayóvar","San Carlos","Huáscar","Mariscal Cáceres","Campoy","Mangomarca","La Huayrona","10 de Octubre","Santa María"],
 "San Juan de Miraflores":["Ciudad de Dios","Pamplona Alta","San Juan Zona A","José Gálvez","Nueva Rinconada"],
 "San Luis":["San Luis Centro","San Luis Antiguo","Urbanización El Pino","Zona de la avenida Canadá"],
 "San Martín de Porres":["San Martín Centro","Condevilla","Fiori","Habich","Naranjal","Valdiviezo"],
 "San Miguel":["San Miguel Centro","Maranga","Pando","Costanera","La Marina"],
 "Santa Anita":["Santa Anita Centro","Los Ficus","Cooperativa Universal","Zona del óvalo Santa Anita"],
 "Santa María del Mar":["Santa María Centro","Playa Santa María","Zona del malecón"],
 "Santa Rosa":["Santa Rosa Centro","La Arboleda","Zona de playa","Zona residencial"],
 "Santiago de Surco":["Surco Viejo","Monterrico","Chacarilla","Higuereta","Valle Hermoso"],
 "Surquillo":["Surquillo Centro","Mercado N.º 1","Limatambo","La Calera"],
 "Villa El Salvador":["Sector 1","Sector 2","Sector 3","Parque Industrial","Zona de playas"],
 "Villa María del Triunfo":["José Carlos Mariátegui","Nueva Esperanza","Tablada de Lurín","Cercado VMT","José Gálvez"]
};

const regularPlaceOptions = ["Avenida / vía principal","Mercado o zona comercial","Parque o área verde","Contenedor / punto ecológico","Paradero o acceso","Zona residencial","Otro punto (especificar)"];
