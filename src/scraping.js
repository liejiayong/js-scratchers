import { preStyle, getPixelRatio } from './util'
import './simulateTouch'
;('use strict')

class Scratchers {
	constructor($el = null, config) {
		const DEFAULT_CONFIG = {
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
			onReady: () => {},
			onProgress: () => {},
			onSuccess: () => {} // 全部刮开回调
		}
		this.config = Object.assign({}, DEFAULT_CONFIG, config)
		this.el = $el // 父挂载点
		this.parent = null // canvas挂载点
		this.cCover = null // canvas涂层
		this.cDisplayer = null // canvas奖品
		this.width = this.config.width // canvas width
		this.height = this.config.height // canvas height
		this.point = { left: 0, top: 0, prevX: 0, prevY: 0 } // 手势在canvas位置
		this.pixelRatio = 1

		// this.version = pkg.version
		this.isDown = false // 手指按下
		this.isReady = false // onReady
		this.isDone = false // 是否清除刮刮卡图层
		this.lock = true // 锁住不能刮

		this._init()
	}
	setLock(lock) {
		if (typeof lock !== 'boolean') return new Error(' the paramtar must be Boolean false or true')
		const self = this,
      { canvas } = self.cDisplayer
      
		this.lock = lock

		if (lock) {
			canvas.style.opacity = 0
		} else {
			canvas.style.opacity = 1
    }
	}
	set(params = { awardUrl: this.config.awardUrl, msg: this.config.awardMsg, coverUrl: this.config.coverUrl }) {
		const { awardUrl, msg, coverUrl } = params

		this.setLock(true)
		this.setCover(coverUrl)

		setTimeout(() => {
			this.setAward({ url: awardUrl, msg: msg })
		}, 30)
	}
	/**
	 * 设置刮刮卡封面
	 */
	setCover(url = this.config.coverUrl) {
		const self = this,
			{ ctx, widthReal, heightReal } = this.cCover
		// 图层背景
		if (url) {
			self.loadImg(
				url,
				function({ image, width, height }) {
					ctx.save()
					ctx.globalCompositeOperation = 'source-over'
					ctx.drawImage(image, 0, 0, width, height, 0, 0, widthReal, heightReal)
					ctx.restore()
				},
				function() {
					console.log('the cover image load error.')
				}
			)
		}

		// 如果没设置图片涂层，则使用纯色涂层
		else {
			ctx.save()
			ctx.globalCompositeOperation = 'source-over'
			ctx.fillStyle = this.config.coverColor
			ctx.fillRect(0, 0, widthReal, heightReal)
			ctx.restore()
		}

		ctx.canvas.style.opacity = '1'
	}
	/**
	 * 设置奖品图片
	 */
	setAward(params = { url: this.config.awardUrl, msg: this.config.awardMsg }) {
		const self = this,
			{ ctx, widthReal, heightReal } = this.cDisplayer,
			{ awardColor } = this.config,
			{ url, msg } = params

		this.config.awardMsg = msg
		this.config.awardUrl = url

		// 默认背景颜色
		if (awardColor !== 'transparent') {
			ctx.save()
			ctx.fillStyle = awardColor
			ctx.fillRect(0, 0, widthReal, heightReal)
			ctx.restore()
		}

		// 图片
		if (url) {
			self.loadImg(
				url,
				function({ image, width, height }) {
					// 背景图片
					ctx.drawImage(image, 0, 0, width, height, 0, 0, widthReal, heightReal)

					self._drawMsg()
				},
				function() {
					console.log('the award image load error.')
				}
			)
		} else {
			self._drawMsg()
		}
	}
	_drawMsg() {
		const { awardMsg, fontColor } = this.config
		if (!awardMsg) return
		const { ctx, widthReal, heightReal } = this.cDisplayer
		let { font, fontSize } = this
		ctx.font = font

		let msgWidth = ctx.measureText(awardMsg).width,
			x = (widthReal - msgWidth) / 2,
			y = (heightReal - fontSize) / 2

		ctx.fillStyle = fontColor
		ctx.textAlign = 'start'
		ctx.textBaseline = 'top'
		ctx.fillText(awardMsg, x, y, widthReal)
	}
	loadImg(url = '', success = () => {}, fail = () => {}) {
		const img = new Image()
		img.setAttribute('crossorigin', 'anonymous')

		img.src = `${url}?timestamp=${Date.now()}`
		img.onload = () => {
			success({
				image: img,
				width: img.width,
				height: img.height
			})
		}
		img.onerror = () => {
			fail()
			console.error('Image loading fail.')
		}
	}
	/**
	 * 清除覆盖层所有像素,支持动画消除
	 */
	clear() {
		const { canvas } = this.cCover,
			{ duration } = this.config
		if (duration >= 0) {
			// 先使用CSS opacity清除，再使用canvas清除
			const transition = preStyle('transition')
			canvas.style[transition] = `all ${duration / 1000}s linear`
			canvas.style.opacity = '0'
			setTimeout(() => {
				this._clearAll()
			}, duration)
		} else {
			this._clearAll()
		}
	}
	/**
	 * 清除覆盖层所有像素，无动画直接清除
	 */
	_clearAll() {
		const { canvas } = this.cCover,
			transition = preStyle('transition')
		canvas.style[transition] = 'none'

		this.isDone = false
		this.lock = true
		this.config.onSuccess()
	}
	/**
	 * 判断刮开百分比
	 */
	_complete() {
		const { percent } = this.config,
			currPercent = this._pixelPercent()

		// 消完
		if (currPercent >= percent) {
			this.isDone = true
			this.clear()
		}

		this.config.onProgress(currPercent)
	}
	_pixelPercent() {
		const { ctx } = this.cCover,
			pixelData = ctx.getImageData(0, 0, this.width, this.height).data,
			pixelLen = pixelData.length

		let transPixels = []
		for (let i = 0; i < pixelLen; i += 4) {
			if (pixelData[i + 3] < 128) {
				transPixels.push(pixelData[i + 3])
			}
		}

		return ((transPixels.length / (pixelLen / 4)) * 100).toFixed(2)
	}
	_drawPoint({ x, y, radius }) {
		const { ctx } = this.cCover
		// , { prevX, prevY } = this.point

		ctx.save()
		// 柔顺线条
		if (this.config.mode === 'default') ctx.beginPath()
		// ctx.moveTo(prevX, prevY);
		// ctx.lineTo(x, y)
		ctx.arc(x, y, radius, 0, 2 * Math.PI)
		if (this.config.mode === 'default') ctx.closePath()
		ctx.fill()
		ctx.restore()

		// this.point.prevX = x
		// this.point.prevY = y
		// console.log(x, y)
	}
	_getPostion(touches) {
		if (!touches || (touches && !touches.clientX)) return { x: 0, y: 0, radius: 0 }

		const { radius } = this.config,
			{ pixelRatio } = this.cCover,
			{ top, left } = this.point

		let x = Math.abs(touches.clientX - left) * pixelRatio,
			y = Math.abs(touches.clientY - top) * pixelRatio
		x = x.toFixed(2)
		y = y.toFixed(2)
		if (!this.isDown) {
			this.point.prevX = x
			this.point.prevY = y
		}
		// console.log(touches, x, y)

		return { x, y, radius }
	}
	_event() {
		const { canvas } = this.cCover

		canvas.addEventListener('touchstart', this._eventDown.bind(this), { passive: false })
		canvas.addEventListener('touchmove', this._eventMove.bind(this), { passive: false })
		canvas.addEventListener('touchend', this._eventUp.bind(this), { passive: false })
		canvas.addEventListener('touchcancel', this._eventUp.bind(this), { passive: false })
		canvas.addEventListener('touchleave', this._eventUp.bind(this), { passive: false })
	}
	_eventUp(e) {
		e.preventDefault()
		if (this.lock) return

		const { ctx } = this.cCover
		ctx.globalCompositeOperation = 'source-over'

		this.isDown = false
	}
	_eventDown(e) {
		e.preventDefault()
		if (this.lock) return

		if (!this.isReady) {
			this.isReady = true
			this.config.onReady()
		}

		const { ctx } = this.cCover

		// 扇形涂鸦
		if (this.config.mode === 'sector') ctx.beginPath() // 从触屏屏幕为基准，画扇形路径

		ctx.globalCompositeOperation = 'destination-out' // 消除覆盖层像素

		// 复位手势当前位置
		const b = this.parent.getBoundingClientRect()
		this.point.left = b.left
		this.point.top = b.top
		this._drawPoint(this._getPostion(e.changedTouches[0]))

		this.isDown = true
	}
	_eventMove(e) {
		e.preventDefault()

		if (this.lock) return

		if (this.isDown && !this.isDone) {
			this._drawPoint(this._getPostion(e.changedTouches[0]))
			this._complete()
		}
	}
	_createCanvas() {
		const canvas = document.createElement('canvas'),
			ctx = canvas.getContext('2d'),
			{ width, height } = this,
			pixelRatio = getPixelRatio(ctx),
			widthReal = width * pixelRatio,
			heightReal = height * pixelRatio

		ctx.scale(pixelRatio, pixelRatio)
		canvas.setAttribute('width', widthReal)
		canvas.setAttribute('height', heightReal)
		canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%'

		this.pixelRatio = pixelRatio

		return {
			canvas,
			ctx,
			width,
			height,
			pixelRatio,
			widthReal,
			heightReal
		}
	}
	_createDOM() {
		const { width, height, unit, containerClass } = this.config,
			el = this.el,
			parent = document.createElement('div')
		let cCover = null,
			cDisplayer = null

		parent.style.cssText = `position:relative;margin:0 auto;text-align:center;width:${width}${unit};height:${height}${unit};overflow:hidden;`
		parent.className = containerClass
		cCover = this._createCanvas()
		cDisplayer = this._createCanvas()

		parent.appendChild(cDisplayer.canvas)
		parent.appendChild(cCover.canvas)
		el.appendChild(parent)

		this.parent = parent
		this.cCover = cCover
		this.cDisplayer = cDisplayer
	}
	_params() {
		let font = this.config.font
		let fontSize = font.match(/(\d+)px/g)[0]

		fontSize = fontSize.replace('px', '') * this.pixelRatio
		fontSize = Number(fontSize.toFixed(1))

		this.font = font.replace(/(\d+)px/g, `${fontSize}px`)
		this.fontSize = fontSize
	}
	_init() {
		if (!this.el) return new Error('the.el is not found.')
		this._createDOM()
		this.setAward()
		this.setCover()
		this._event()
		this._params()
	}
}

export default Scratchers
