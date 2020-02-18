/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import {
	Live2DCubismFramework as live2dcubismframework,
	Option as Csm_Option
} from '@framework/live2dcubismframework';
import Csm_CubismFramework = live2dcubismframework.CubismFramework;
import { LAppView } from './lappview';
import { LAppPal } from './lapppal';
import { LAppTextureManager } from './lapptexturemanager';
import { LAppLive2DManager } from './lapplive2dmanager';
import * as LAppDefine from './lappdefine';

export let canvas: HTMLCanvasElement = null;
export let s_instance: LAppDelegate = null;
export let gl: WebGLRenderingContext = null;
export let frameBuffer: WebGLFramebuffer = null;

/**
 * 应用程序类。
 * Cubism SDK的管理。
 */
export class LAppDelegate {
	/**
	 * 单例模式返回类的实例
	 * 如果未创建任何实例，请在内部创建一个实例。
	 *
	 * @return 类的实例
	 */
	public static getInstance(): LAppDelegate {
		if (s_instance == null) {
			s_instance = new LAppDelegate();
		}

		return s_instance;
	}

	/**
	 * 释放类实例（单例）。
	 */
	public static releaseInstance(): void {
		if (s_instance != null) {
			s_instance.release();
		}

		s_instance = null;
	}

	/**
	 * 初始化APP的必要项目。
	 */
	public initialize(): boolean {
		// 创建画布
		canvas = document.createElement('canvas');
		canvas.width = LAppDefine.RenderTargetWidth;
		canvas.height = LAppDefine.RenderTargetHeight;

		// 初始化webgl上下文
		// @ts-ignore
		gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

		if (!gl) {
			alert('Cannot initialize WebGL. This browser does not support.');
			gl = null;

			document.body.innerHTML =
				'This browser does not support the <code>&lt;canvas&gt;</code> element.';

			// webgl初始化失败
			return false;
		}

		// 将画布添加到DOM
		document.body.appendChild(canvas);

		if (!frameBuffer) {
			frameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
		}

		// 透過設定
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		const supportTouch: boolean = 'ontouchend' in canvas;

		if (supportTouch) {
			// 注册touch相关的回调函数
			canvas.ontouchstart = onTouchBegan;
			canvas.ontouchmove = onTouchMoved;
			canvas.ontouchend = onTouchEnded;
			canvas.ontouchcancel = onTouchCancel;
		} else {
			// 鼠标相关的回调函数注册
			canvas.onmousedown = onClickBegan;
			canvas.onmousemove = onMouseMoved;
			canvas.onmouseup = onClickEnded;
		}

		// AppView初始化
		this._view.initialize();

		// Cubism SDK初始化
		this.initializeCubism();

		return true;
	}

	/**
	 * 释放
	 */
	public release(): void {
		this._textureManager.release();
		this._textureManager = null;

		this._view.release();
		this._view = null;

		// 释放资源
		LAppLive2DManager.releaseInstance();

		// Cubism SDK 释放
		Csm_CubismFramework.dispose();
	}

	/**
	 * 実行処理。
	 */
	public run(): void {
		// 主循环
		const loop = (): void => {
			// 检查实例是否存在
			if (s_instance == null) {
				return;
			}

			// 时间更新
			LAppPal.updateTime();

			// 画面初始化
			gl.clearColor(0.0, 0.0, 0.0, 1.0);

			// 启用深度测试
			gl.enable(gl.DEPTH_TEST);

			// 附近物体遮挡远处物体
			gl.depthFunc(gl.LEQUAL);

			// 清除颜色和深度缓冲区
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

			gl.clearDepth(1.0);

			//为此上下文启用特定的WebGL功能。
			//激活计算片段颜色的混合
			//穿透？
			gl.enable(gl.BLEND);
			//gl.SRC_ALPHA          --->将所有颜色乘以源alpha值。
			//gl.ONE_MINUS_SRC_ALPHA--->将所有颜色乘以1减去源alpha值。
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

			// render
			this._view.render();

			// 递归循环调用
			requestAnimationFrame(loop);
		};
		loop();
	}

	/**
	 * 注册着色器。
	 */
	public createShader(): WebGLProgram {
		// 编译顶点着色器
		const vertexShaderId = gl.createShader(gl.VERTEX_SHADER);

		if (vertexShaderId == null) {
			LAppPal.printMessage('failed to create vertexShader');
			return null;
		}

		const vertexShader: string =
			'precision mediump float;' +
			'attribute vec3 position;' +
			'attribute vec2 uv;' +
			'varying vec2 vuv;' +
			'void main(void)' +
			'{' +
			'   gl_Position = vec4(position, 1.0);' +
			'   vuv = uv;' +
			'}';

		gl.shaderSource(vertexShaderId, vertexShader);
		gl.compileShader(vertexShaderId);

		// 编译片段着色器
		const fragmentShaderId = gl.createShader(gl.FRAGMENT_SHADER);

		if (fragmentShaderId == null) {
			LAppPal.printMessage('failed to create fragmentShader');
			return null;
		}

		const fragmentShader: string =
			'precision mediump float;' +
			'varying vec2 vuv;' +
			'uniform sampler2D texture;' +
			'void main(void)' +
			'{' +
			'   gl_FragColor = texture2D(texture, vuv);' +
			'}';

		gl.shaderSource(fragmentShaderId, fragmentShader);
		gl.compileShader(fragmentShaderId);

		// 创建着色器程序对象
		const programId = gl.createProgram();
		gl.attachShader(programId, vertexShaderId);
		gl.attachShader(programId, fragmentShaderId);

		gl.deleteShader(vertexShaderId);
		gl.deleteShader(fragmentShaderId);

		// 将着色器用于链接
		gl.linkProgram(programId);

		gl.useProgram(programId);

		return programId;
	}

	/**
	 * 获取视图信息。
	 */
	public getView(): LAppView {
		return this._view;
	}

	public getTextureManager(): LAppTextureManager {
		return this._textureManager;
	}

	/**
	 * 构造函数
	 */
	constructor() {
		this._captured = false;
		this._mouseX = 0.0;
		this._mouseY = 0.0;
		this._isEnd = false;

		this._cubismOption = new Csm_Option();
		this._view = new LAppView();
		this._textureManager = new LAppTextureManager();
	}

	/**
	 * Cubism SDK初始化
	 */
	public initializeCubism(): void {
		// setup cubism
		this._cubismOption.logFunction = LAppPal.printMessage;
		this._cubismOption.loggingLevel = LAppDefine.CubismLoggingLevel;
		Csm_CubismFramework.startUp(this._cubismOption);

		// initialize cubism
		Csm_CubismFramework.initialize();

		// load model
		LAppLive2DManager.getInstance();

		LAppPal.updateTime();

		this._view.initializeSprite();
	}

	_cubismOption: Csm_Option; // Cubism SDK Option
	_view: LAppView; // 查看信息
	_captured: boolean; // 点击
	_mouseX: number; // 鼠标X坐标
	_mouseY: number; // 鼠标Y坐标
	_isEnd: boolean; // App结束？
	_textureManager: LAppTextureManager; // 纹理管理
}

/**
 * 单击时调用。
 */
function onClickBegan(e: MouseEvent): void {
	if (!LAppDelegate.getInstance()._view) {
		LAppPal.printMessage('view notfound');
		return;
	}
	LAppDelegate.getInstance()._captured = true;

	const posX: number = e.pageX;
	const posY: number = e.pageY;

	LAppDelegate.getInstance()._view.onTouchesBegan(posX, posY);
}

/**
 * 当鼠标指针移动时调用。
 */
function onMouseMoved(e: MouseEvent): void {
	if (!LAppDelegate.getInstance()._captured) {
		return;
	}

	if (!LAppDelegate.getInstance()._view) {
		LAppPal.printMessage('view notfound');
		return;
	}

	const rect = (e.target as Element).getBoundingClientRect();
	const posX: number = e.clientX - rect.left;
	const posY: number = e.clientY - rect.top;

	LAppDelegate.getInstance()._view.onTouchesMoved(posX, posY);
}

/**
 * 点击完成后调用。
 */
function onClickEnded(e: MouseEvent): void {
	LAppDelegate.getInstance()._captured = false;
	if (!LAppDelegate.getInstance()._view) {
		LAppPal.printMessage('view notfound');
		return;
	}

	const rect = (e.target as Element).getBoundingClientRect();
	const posX: number = e.clientX - rect.left;
	const posY: number = e.clientY - rect.top;

	LAppDelegate.getInstance()._view.onTouchesEnded(posX, posY);
}

/**
 * 触摸时调用。
 */
function onTouchBegan(e: TouchEvent): void {
	if (!LAppDelegate.getInstance()._view) {
		LAppPal.printMessage('view notfound');
		return;
	}

	LAppDelegate.getInstance()._captured = true;

	const posX = e.changedTouches[0].pageX;
	const posY = e.changedTouches[0].pageY;

	LAppDelegate.getInstance()._view.onTouchesBegan(posX, posY);
}

/**
 * 触摸并移动时调用
 */
function onTouchMoved(e: TouchEvent): void {
	if (!LAppDelegate.getInstance()._captured) {
		return;
	}

	if (!LAppDelegate.getInstance()._view) {
		LAppPal.printMessage('view notfound');
		return;
	}

	const rect = (e.target as Element).getBoundingClientRect();

	const posX = e.changedTouches[0].clientX - rect.left;
	const posY = e.changedTouches[0].clientY - rect.top;

	LAppDelegate.getInstance()._view.onTouchesMoved(posX, posY);
}

/**
 * 触摸结束时调用。
 */
function onTouchEnded(e: TouchEvent): void {
	LAppDelegate.getInstance()._captured = false;

	if (!LAppDelegate.getInstance()._view) {
		LAppPal.printMessage('view notfound');
		return;
	}

	const rect = (e.target as Element).getBoundingClientRect();

	const posX = e.changedTouches[0].clientX - rect.left;
	const posY = e.changedTouches[0].clientY - rect.top;

	LAppDelegate.getInstance()._view.onTouchesEnded(posX, posY);
}

/**
 * 取消触摸时调用。
 */
function onTouchCancel(e: TouchEvent): void {
	LAppDelegate.getInstance()._captured = false;

	if (!LAppDelegate.getInstance()._view) {
		LAppPal.printMessage('view notfound');
		return;
	}

	const rect = (e.target as Element).getBoundingClientRect();

	const posX = e.changedTouches[0].clientX - rect.left;
	const posY = e.changedTouches[0].clientY - rect.top;

	LAppDelegate.getInstance()._view.onTouchesEnded(posX, posY);
}
