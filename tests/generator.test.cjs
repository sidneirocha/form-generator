const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const source=html.match(/<script>([\s\S]*)<\/script>/)[1];
const template=JSON.parse(source.match(/const TEMPLATE=(.*);\nlet extras=/)[1]);
const backend=JSON.parse(source.match(/const GS_BODY=(.*);\nconst backend=/)[1]);
const options=['Recepção','Manutenção','Limpeza Geral'];
function fixture(required=true){
  let saved=0,mailed=0;const answers=[],props={FORM_ID:'form',MAPA:JSON.stringify({extra_servico:7})};
  const definition={key:'extra_servico',label:'Serviço',question:'Serviço desejado',type:'select',required,options};
  const item={getId:()=>7,getTitle:()=>definition.question,getType:()=> 'LIST',asListItem(){return this;},isRequired:()=>required,getChoices:()=>options.map(value=>({getValue:()=>value})),createResponse:value=>({value})};
  const form={getItems:()=>[item],isAcceptingResponses:()=>true,getId:()=> 'form',getItemById:()=>item,createResponse:()=>({withItemResponse(x){answers.push(x.value);return this;},submit(){saved++;}})};
  const ctx={DEFINICOES:[definition],CAMPOS:{extra_servico:definition.question},ANTISPAM:{ativo:false},DESTINATARIOS:['cliente@example.com'],NOME_CLIENTE:'Cliente',NOME_REMETENTE:'Site',REMETENTE:'',ASSUNTO:'Contato',PLANILHA_ID:'sheet',ABA_ID:1,FormApp:{ItemType:{TEXT:'TEXT',PARAGRAPH_TEXT:'PARAGRAPH_TEXT',LIST:'LIST'},openById:()=>form,openByUrl:()=>form},SpreadsheetApp:{openById:()=>({getSheets:()=>[{getSheetId:()=>1,getFormUrl:()=> 'form-url'}]})},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k],setProperties:o=>Object.assign(props,o)})},MailApp:{getRemainingDailyQuota:()=>100},GmailApp:{getAliases:()=>[],sendEmail:()=>mailed++},LockService:{getScriptLock:()=>({tryLock:()=>true,hasLock:()=>true,releaseLock(){}})},Utilities:{DigestAlgorithm:{SHA_256:'SHA_256'},Charset:{UTF_8:'UTF_8'},computeDigest:()=>[1],base64EncodeWebSafe:()=> 'digest'},CacheService:{getScriptCache:()=>({get:()=>null,put(){}})},ContentService:{MimeType:{JSON:'JSON'},createTextOutput:text=>({setMimeType:()=>JSON.parse(text)})},console:{log(){},error(){},warn(){}}};
  vm.createContext(ctx);vm.runInContext(backend,ctx);
  return {ctx,definition,props,answers,get saved(){return saved;},get mailed(){return mailed;},post:value=>ctx.doPost({postData:{contents:JSON.stringify({extra_servico:value,requestId:'request-12345678901234567890'})}})};
}
test('gerador e scripts exportados têm sintaxe válida',()=>{
  new vm.Script(source);new vm.Script(backend);
  for(const match of template.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(match[1].replace('__CONFIG__','{}'));
});
test('listas exigem opções únicas e preservam acentos',()=>{
  const fn=source.match(/function validSelectOptions\(options\)\{[^\n]*\}/)[0];
  const ctx={};vm.createContext(ctx);vm.runInContext(fn,ctx);
  assert.equal(ctx.validSelectOptions(options),true);
  for(const invalid of [[],['a','a'],[''],['a'.repeat(501)],null])assert.equal(ctx.validSelectOptions(invalid),false);
});
test('configuração reconhece Lista suspensa no Google Forms',()=>{
  const f=fixture();f.ctx.configurar();assert.equal(JSON.parse(f.props.MAPA).extra_servico,7);
});
test('opções divergentes no Forms impedem a configuração',()=>{
  const f=fixture();f.definition.options=['Outra'];assert.throws(()=>f.ctx.configurar(),/opções e ordem/);
});
test('resposta válida de lista é gravada e incluída na notificação',()=>{
  const f=fixture();assert.equal(f.post('Limpeza Geral').ok,true);assert.deepEqual(f.answers,['Limpeza Geral']);assert.equal(f.saved,1);assert.equal(f.mailed,1);
});
test('valores inventados e lista obrigatória vazia são recusados',()=>{
  for(const value of ['Serviço inexistente','']){const f=fixture();assert.equal(f.post(value).ok,false);assert.equal(f.saved,0);assert.equal(f.mailed,0);}
});
test('lista opcional pode ficar vazia',()=>{
  const f=fixture(false);assert.equal(f.post('').ok,true);assert.equal(f.saved,1);assert.equal(f.answers.length,0);
});
test('criador do Forms gera ListItem com as opções configuradas',()=>{
  const f=fixture();delete f.props.FORM_CRIADO;f.ctx.PLANILHA_ID='';let created;
  const item={setTitle(v){this.title=v;return this;},setRequired(v){this.required=v;return this;},setChoiceValues(v){this.options=v;return this;}};
  f.ctx.FormApp.create=()=>({addListItem:()=>{created=item;return item;},setDestination(){},getId:()=> 'new-form',getEditUrl:()=> 'edit-url',getPublishedUrl:()=> 'public-url'});
  f.ctx.FormApp.DestinationType={SPREADSHEET:'SPREADSHEET'};
  f.ctx.SpreadsheetApp.create=()=>({getId:()=> 'new-sheet',getUrl:()=> 'sheet-url'});
  f.ctx.criarFormulario();assert.equal(created.title,'Serviço desejado');assert.equal(created.required,true);assert.deepEqual(created.options,options);assert.equal(f.props.FORM_CRIADO,'new-form');
});
