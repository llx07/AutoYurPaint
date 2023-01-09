//import { ZSTDDecoder } from "https://cdn.jsdelivr.net/npm/zstddec@0.0.2/dist/zstddec.modern.js";
const WebSocket = require('ws')
const ZSTDDecoder = require("./zstd.js")
const WS_URL = "wss://paint.yurzhang.com/api/ws";
const data = require("./data")

const fs = require('fs')
fs.readFile('./token.txt', (err, data) => {
  if (err) {
    console.error(err)
    return
  }
  // data 是二进制类型，需要转换成字符串
  console.log(data.toString())
  tokens = data.toString().split(/\r?\n/);
  if(tokens == 0){
    console.alert("[ERROR]No Token!")
    return;
  }
  console.log("[INFO]%d token(s) read.",tokens.length);
  console.log("[INFO]try create main ws(%s).",tokens[0].substring(0,6));
  createWs(tokens[0],true)
  for(let i=1;i<tokens.length;i++){
    if(tokens[i]==0){
      console.log("[WARNING] token(%d)=\"%s\" skipped",i+1,tokens[i]);
      continue;
    }
    console.log("[INFO]try create ws(%s).",tokens[i].substring(0,6));
    createWs(tokens[i], false);
  }
  setInterval(maintain,502)
})

const W = 1000;
const H = 600;
let wsList = []
const startX = 20
const startY = 445;
const picY = data.length;
const picX = data[0].length;

console.log("x,y",picX,picY)

const board = Array.from(Array(H), () => new Array(W));
//const boardState = new Array(picY).fill(0).map(() => new Array(picX).fill(0));
//const taskQueue = new Array()

// console.log(Myboard)
function update(a){
    //console.log("update",a.x,a.y);
    // if(startY<=a.y && a.y<startY+picY &&
    //   startX<=a.x && a.x<startX+picX){
    //   realX = a.x-startX;
    //   realY = a.y-startY;
    //   console.log("real",realX,realY);
    //   if(!coloreq(a.c,data[realY][realX]) && boardState[realY][realX]==0){
    //     taskQueue.push([a.y,a.x,a.c]);
    //     boardState[realY][realX]=1;
    //   }
    // }
    board[a.y][a.x]=a.c;
}

let allOk=false;

function createWs(token,isMain){
  let ws = null;
  try {
    ws = new WebSocket(WS_URL);
  } catch (e) {
    console.alert("[ERROR]无法连接 WebSocket 服务器！");
    return;
  }
  ws.binaryType = "arraybuffer";

  ws.onopen = () => {
    const hex_token = token.replaceAll("-", "");
    let token_msg = [0xff];
    console.log("[INFO]token(%s) send auth",token.substring(0,6));
    for (let i = 0; i < 16; ++ i) {
      const byte = parseInt(hex_token.slice(i * 2, i * 2 + 2), 16);
      token_msg.push(byte);
    }
    ws.send(new Uint8Array(token_msg));
  };
  if(isMain){
    ws.onmessage = (event) => {
      const raw_data = new Uint8Array(event.data);
      const [type, data] = [raw_data[0], raw_data.slice(1)];
      switch (type) {
        case 0xfc: { // Auth success
          console.log("[INFO]main token (%s) success",token.substring(0,6));
          ws.send(new Uint8Array([0xf9]));
          wsList.push(ws)
          break;
        }
        case 0xfb: { // Get board
          const decoder = new ZSTDDecoder();
  
          decoder.init()
            .then(() => {
              const board = decoder.decode(data, 1800000);
  
              if (board.length !== 1800000) {
                console.log("Len:", board.length);
                alert("画板损坏！请联系管理员！");
              }
  
              let idx = 0;
              for (let x = 0; x < W; ++ x) {
                for (let y = 0; y < H; ++ y) {
                  update({ y, x, c: board.slice(idx, idx + 3) },0);
                  idx += 3;
                }
              }
              console.log("[INFO]board loaded.");
              allOk = true;
            });
          break;
        }
        case 0xfa: { // Update
          for (let i = 0; i < data.length; i += 7) {
            const x = data[i + 1] * 256 + data[i];
            const y = data[i + 3] * 256 + data[i + 2];
            const c = data.slice(i + 4, i + 7);
            update({ x, y, c },1);
          }
          break;
        }
      }
    };
  }
  else{
    ws.onmessage = (event) => {
      const raw_data = new Uint8Array(event.data);
      const [type, data] = [raw_data[0], raw_data.slice(1)];
      switch (type) {
        case 0xfc: { // Auth success
          console.log("[INFO]token(%s) success",token.substring(0,6));
          wsList.push(ws)
          break;
        }
      }
    };
  }

  setInterval(() => { ws.send("p"); }, 10000);
}

// unfinished
// function multiMaintain(){
//   // console.log("activate ws:%d",wsList.length)
//   if(!allOk)return;
//   let nowWs = 0;
//   for(let i=0;i<taskQueue.length;i++){
//     if(nowWs==wsList.length)return;

//     let task = taskQueue.pop()
//     change(wsList[nowWs],task[0],task[1],task[2]);
//     console.log(task);
//     boardState[task[0]-startY][task[1]-startX]=0;
//     nowWs++;
//   }
// }

function maintain(){
  if (!allOk) return;
  if(wsList.length==0)return;
  function coloreq(a,b){
      return a[0]==b[0] && a[1]==b[1] && a[2]==b[2];
  }
  let nowWs = 0;
  for(let i=startY+picY-1;i>=startY;i--){
    for(let j=startX;j<startX+picX;j++){
      if(nowWs == wsList.length)return;
      if(!coloreq(board[i][j],data[i-startY][j-startX])){
        console.log("[INFO]Now maintain (%d,%d) by token#%d",j,i,nowWs+1);
        change(wsList[nowWs],j,i,data[i-startY][j-startX]);
        nowWs++;
      }
    }
  }

}

function change(ws,x,y,c){
    if (!allOk) {
        return;
    }

    const msg = [
        0xfe,
        x & 255, (x >> 8) & 255,
        y & 255, (y >> 8) & 255,
        c[0], c[1], c[2]
    ];

    ws.send(new Uint8Array(msg));
    
};
