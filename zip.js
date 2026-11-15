/* KXZIP: tiny dependency-free ZIP writer (stored/uncompressed entries only - our files are
   already-compressed PDFs/images, so DEFLATE would buy nothing). Works fully offline, no CDN. */
(function(){
var CRCT=(function(){var t=new Uint32Array(256);for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);t[n]=c>>>0}return t})();
function crc32(buf){var crc=0xFFFFFFFF;for(var i=0;i<buf.length;i++)crc=CRCT[(crc^buf[i])&0xFF]^(crc>>>8);return(crc^0xFFFFFFFF)>>>0}
function u16(v){return[v&255,(v>>8)&255]}
function u32(v){return[v&255,(v>>8)&255,(v>>16)&255,(v>>>24)&255]}
function strBytes(s){var a=[];for(var i=0;i<s.length;i++){var c=s.charCodeAt(i);if(c<128)a.push(c);else a.push(95)}return a} // ascii-safe names
function dosDT(d){d=d||new Date();var time=((d.getHours()&31)<<11)|((d.getMinutes()&63)<<5)|((d.getSeconds()>>1)&31),date=(((Math.max(0,d.getFullYear()-1980))&127)<<9)|(((d.getMonth()+1)&15)<<5)|(d.getDate()&31);return{time:time,date:date}}
function make(entries){ // entries: [{name:string, data:Uint8Array|ArrayBuffer}]
 var parts=[],central=[],offset=0,dt=dosDT(),count=0;
 entries.forEach(function(e){
  var data=e.data instanceof Uint8Array?e.data:new Uint8Array(e.data),nb=strBytes(e.name),crc=crc32(data),size=data.length;
  var lfh=new Uint8Array([].concat(u32(0x04034b50),u16(20),u16(0),u16(0),u16(dt.time),u16(dt.date),u32(crc),u32(size),u32(size),u16(nb.length),u16(0),nb));
  parts.push(lfh,data);
  central.push(new Uint8Array([].concat(u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(dt.time),u16(dt.date),u32(crc),u32(size),u32(size),u16(nb.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),nb)));
  offset+=lfh.length+data.length;count++});
 var centralStart=offset,centralSize=0;central.forEach(function(c){centralSize+=c.length});
 var eocd=new Uint8Array([].concat(u32(0x06054b50),u16(0),u16(0),u16(count),u16(count),u32(centralSize),u32(centralStart),u16(0)));
 return new Blob(parts.concat(central,[eocd]),{type:'application/zip'})}
window.KXZIP={make:make};
})();
