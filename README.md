# scratchers.js

经典刮刮卡库， [效果预览](https://codepen.io/liejiayong/pen/eYpOypR)

## 特性

- 兼容 pc ie9+ 及现代浏览器
- 支持移动端，且图片比例自适应
- 支持可定制化
- 用 rollup 压缩打包，支持 es 模式与立即执行模式

# Usage

## install

```bash

npm i scratchers -S

```

### use

```js
import Scratchers from 'scratchers'
// 实例化:el 为挂载点
const install = new Scratchers(el, {
	width: 300, // canvas 宽
	height: 150, // canvas 高
	awardUrl: '', // 奖品图片
	awardColor: '#ffffff', // 奖品默认背景，默认为透明：transparent
	awardMsg: '特等奖', // 奖品文字
	font: 'bold 30px Arial', // 奖品字体样式
	fontColor: '#ffffff', // 奖品字体颜色
	coverUrl: '', // 覆盖层图片
	coverColor: '#cccccc', // 纯色覆盖层
	radius: 28, // 擦除手势半径
	duration: 500, // 展现全部的淡出效果时间（ms）
	percent: 60, // 刮开面积 占 整张刮卡的百分比
	unit: 'px', // 宽高css单位
	containerClass: 'jy-scraping-container', // 装载刮卡的父元素类名
	mode: 'default', // 刮刮卡刮开卡片模式。default:默认模式，一个个像素点刮开；sector:快速模式，以鼠标按下点开始到结束点形成扇形消除像素
	onReady: function() {
		console.log('scratchers ready')
	},
	onProgress: function(rate) {
		console.log('scratchers progress', rate)
	},
	onSuccess: () => {
		console.log('scratchers done')
	} // 全部刮开回调
})
```

### API

- 设置可刮

```js
install.setLock(false)
```

- 设置奖品

```js
install.set({
	coverUrl: 'https://img.zcool.cn/community/01dbd25e8c7128a801216518adf279.jpg@1280w_1l_2o_100sh.jpg',
	awardUrl: 'https://img.zcool.cn/community/01f9485e8af38da801216518361916.jpg@260w_195h_1c_1e_1o_100sh.jpg',
	msg: '特等奖'
})
```
