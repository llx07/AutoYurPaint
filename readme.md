## 安装
```bash
npm install
```

## 使用方法
### 准备图像
```
python gen.py
usage: gen.py [-h] [--width WIDTH] [--height HEIGHT] path

Change the picture to JS

positional arguments:
  path

options:
  -h, --help       show this help message and exit
  --width WIDTH
  --height HEIGHT
```
指定图片文件，如果指定长度和宽度，则会对图片进行缩放，若只指定了其中一个，会等比例放大。

将图片转化为数组，存在`data.js`

### 准备token

`./token.txt`为你的`token`，支持多`token`，用换行符分割

可在控制台运行`localStorage.getItem("token");`获得你的`token`

### 开始维护！

`./main.js`为主文件

需要修改的地方,第37-38行，为图片左上角地址。若图片大小超过画板则行为未定义。
```js
const startX = <X>
const startY = <Y>;
```

`node main.js` 运行

