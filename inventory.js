const products = [
  { name: 'Shampoo 500ml', stock: 12, minimum: 10 },
  { name: 'Arroz Premium 1kg', stock: 8, minimum: 8 },
  { name: 'Detergente 3L', stock: 2, minimum: 5 },
];
function parseMessage(message) {
  const text = message.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/\b(actualiza\w*|agrega\w*|elimina\w*|borra\w*|modifica\w*|cambia\w*|descuenta\w*|admin\w*|ignora\w*|instrucciones|userid|u001|insert|delete|update)\b/.test(text)) return null;
  const product = products.find(p => text.includes(p.name.split(' ')[0].toLowerCase()));
  if (product) return {kind:'search', product, message:`Consultar stock de ${product.name}`};
  if (/bajo|minimo|alerta|reponer/.test(text)) return {kind:'low', message:'Consultar productos con stock por debajo del mínimo'};
  if (/reporte|informe/.test(text)) return {kind:'report', message:'Generar reporte de consulta del inventario, sin modificar datos'};
  if (/resumen|inventario|stock|producto|unidades/.test(text)) return {kind:'summary', message:'Consultar resumen general del inventario'};
  return {kind:'help', message:''};
}
function mockResult(intent, fallback=false) {
  const rows = intent.kind==='low' ? products.filter(p=>p.stock<p.minimum) : intent.kind==='search' ? [intent.product] : intent.kind==='help' ? [] : products;
  const text = intent.kind==='low' ? 'Detergente 3L está bajo el mínimo: quedan 2 unidades y necesita 3 más para alcanzar el umbral de 5.' : intent.kind==='search' ? `${intent.product.name}: ${intent.product.stock} unidades disponibles. Mínimo: ${intent.product.minimum}.` : intent.kind==='help' ? 'Puedes consultar el resumen, el stock bajo o buscar Shampoo, Arroz y Detergente. Esta demo permite únicamente consultas.' : 'Tu inventario tiene 3 productos y 22 unidades. Detergente requiere reposición; Arroz está justo en el mínimo.';
  return {source:'mock', fallback, text, products:rows, metrics:intent.kind==='summary'||intent.kind==='report'?{products:3,units:22,alerts:1}:undefined, report:intent.kind==='report'};
}

module.exports=async function handler(req,res){
 const send=(body,status=200)=>{res.setHeader('Cache-Control','no-store');return res.status(status).json(body);};
 if(req.method!=='POST'){res.setHeader('Allow','POST');return send({error:'Método no permitido.'},405);}
 const origin=req.headers.origin;
 if(origin){try{if(new URL(origin).host!==req.headers.host)return send({error:'Origen no permitido.'},403);}catch{return send({error:'Origen no permitido.'},403);}}
 if(!req.headers['content-type']?.includes('application/json'))return send({error:'Formato no permitido.'},415);
 let body=req.body;try{if(typeof body==='string')body=JSON.parse(body);}catch{return send({error:'Consulta inválida.'},400);}
 if(!body||typeof body.message!=='string'||Object.keys(body).some(k=>k!=='message')||!body.message.trim()||body.message.length>500)return send({error:'Envía únicamente un mensaje de hasta 500 caracteres.'},400);
 const intent=parseMessage(body.message);if(!intent)return send({error:'La demo es de solo lectura. Consulta stock, alertas o reportes.'},403);
 const mode=process.env.INVENTORY_MODE||'mock';if(mode==='mock'||intent.kind==='help')return send(mockResult(intent));
 if(!['test','production'].includes(mode))return send({error:'Configuración inválida.'},503);
 const endpoint=mode==='test'?process.env.N8N_INVENTORY_WEBHOOK_TEST:process.env.N8N_INVENTORY_WEBHOOK_PRODUCTION;
 try{
  if(!endpoint||new URL(endpoint).protocol!=='https:')throw Error('config');
  const response=await fetch(endpoint,{method:'POST',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(10000),headers:{'Content-Type':'application/json',...(process.env.N8N_WEBHOOK_TOKEN?{Authorization:`Bearer ${process.env.N8N_WEBHOOK_TOKEN}`}:{})},body:JSON.stringify({message:intent.message,userId:'U003',userName:'Lectura Demo'})});
  if(!response.ok)throw Error('upstream');
  const raw=await response.text();if(raw.length>100000)throw Error('size');
  const data=JSON.parse(raw),payload=Array.isArray(data)?data[0]:data;
  const answer=payload?.text??payload?.output??payload?.response??payload?.message;if(typeof answer!=='string'||!answer.trim())throw Error('shape');
  const rows=Array.isArray(payload.products)?payload.products.filter(p=>p&&typeof p.name==='string'&&Number.isFinite(p.stock)&&Number.isFinite(p.minimum)&&p.stock>=0&&p.minimum>=0).slice(0,100).map(p=>({name:p.name.slice(0,200),stock:p.stock,minimum:p.minimum})):[];
  return send({source:'n8n',text:answer.slice(0,20000),products:rows,report:intent.kind==='report',...(rows.length?{metrics:{products:rows.length,units:rows.reduce((s,p)=>s+p.stock,0),alerts:rows.filter(p=>p.stock<p.minimum).length}}:{})});
 }catch{
  if(mode==='test'&&process.env.INVENTORY_MOCK_FALLBACK!=='false')return send(mockResult(intent,true));
  return send({error:'No pudimos consultar el inventario. Intenta nuevamente.'},502);
 }
};
