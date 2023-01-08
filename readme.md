## 安装
```bash
npm install
```

## 使用方法
### 准备图像
`./mantain.png` 为你的图像文件（缩放后）
```bash
python gen.py
```
将图片转化为数组，存在`data.js`

### 准备token

`./token.txt`为你的`token`

可在控制台运行`localStorage.getItem("token");`获得你的`token`

### 开始维护！

`./main.js`为主文件

需要修改的地方,第22-23行，为图片左上角地址。若图片大小超过画板则行为未定义。
```js
const startX = 50
const startY = 400;
```

`node main.js` 运行

