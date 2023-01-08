//import { ZSTDDecoder } from "https://cdn.jsdelivr.net/npm/zstddec@0.0.2/dist/zstddec.modern.js";
const WebSocket = require('ws')
const ZSTDDecoder = require("./zstd.js")
const WS_URL = "wss://paint.yurzhang.com/api/ws";
const data = require("./data")
let token = null
const fs = require('fs')
fs.readFile('./token.txt', (err, data) => {
    if (err) {
        console.error(err)
        return
    }
    // data 是二进制类型，需要转换成字符串
    console.log(data.toString())
    token = data.toString();
    connectWs();
})

const W = 1000;
const H = 600;

const startX = 50
const startY = 400;
const picY = data.length;
const picX = data[0].length;

//console.log("x,y",picX,picY)

Myboard = Array.from(Array(H), () => new Array(W));
// console.log(Myboard)
function update(a){
    //console.log("update",a.x,a.y);
    Myboard[a.y][a.x]=a.c;
}

let allOk=false;
let ws = null;
const connectWs = () => {

  if (token === null) {
    return;
  }

  try {
    ws = new WebSocket(WS_URL);
  } catch (e) {
    console.log(e)
    //alert("无法连接 WebSocket 服务器！");
    return;
  }

  ws.binaryType = "arraybuffer";

  ws.onopen = () => {
    const hex_token = token.replaceAll("-", "");
    let token_msg = [0xff];
    for (let i = 0; i < 16; ++ i) {
      const byte = parseInt(hex_token.slice(i * 2, i * 2 + 2), 16);
      token_msg.push(byte);
    }
    ws.send(new Uint8Array(token_msg));
  };

  ws.onmessage = (event) => {
    const raw_data = new Uint8Array(event.data);
    const [type, data] = [raw_data[0], raw_data.slice(1)];

    switch (type) {
      case 0xfc: { // Auth success
        console.log("Auth Success");
        ws.send(new Uint8Array([0xf9]));
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

  setInterval(() => { ws.send("p"); }, 10000);
  setInterval(() => { maintain(ws) }, 510);
};

function maintain(ws){
    if (!allOk) {
        return;
    }
    // console.log("Try mantian",ws);
    function coloreq(a,b){
        return a[0]==b[0] && a[1]==b[1] && a[2]==b[2];
    }

    for(let i=startY;i<startY+picY;i++){
        for(let j=startX;j<startX+picX;j++){
            if(!coloreq(Myboard[i][j],data[i-startY][j-startX])){
                console.log("Now matain",i,j)
                change(ws,j,i,data[i-startY][j-startX]);
                return;
            }
            else{
                //console.log(i,j,"is the same(",board[i][j],"vs",data[i][j],")")
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
