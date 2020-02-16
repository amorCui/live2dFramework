/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { LogLevel } from '@framework/live2dcubismframework';

/**
 * Sample Appで使用する定数
 */
// 画面
export const ViewMaxScale = 2.0;
export const ViewMinScale = 0.8;

export const ViewLogicalLeft = -1.0;
export const ViewLogicalRight = 1.0;

export const ViewLogicalMaxLeft = -2.0;
export const ViewLogicalMaxRight = 2.0;
export const ViewLogicalMaxBottom = -2.0;
export const ViewLogicalMaxTop = 2.0;

// 相对路径
export const ResourcesPath = '../../Resources/';

// 模型背后的背景图片文件
export const BackImageName = 'back_class_normal.png';

// 齿轮
export const GearImageName = 'icon_gear.png';

// 退出按钮
export const PowerImageName = 'CloseNormal.png';

// 模型定义---------------------------------------------
// 模型所在的目录名称的数组
// 将目录名称与model3.json的名称匹配
export const ModelDir: string[] = ['Haru', 'Hiyori', 'Mark', 'Natori', 'Rice'];
export const ModelDirSize: number = ModelDir.length;

// 与外部定义文件（json）匹配
export const MotionGroupIdle = 'Idle'; // アイドリング
export const MotionGroupTapBody = 'TapBody'; // 当您轻拍身体

//与外部定义文件（json）匹配
export const HitAreaNameHead = 'Head';
export const HitAreaNameBody = 'Body';

// 运动优先级常数
export const PriorityNone = 0;
export const PriorityIdle = 1;
export const PriorityNormal = 2;
export const PriorityForce = 3;

// 调试日志显示选项
export const DebugLogEnable = true;
export const DebugTouchLogEnable = false;

// Framework来自的日志级别设置输出
export const CubismLoggingLevel: LogLevel = LogLevel.LogLevel_Verbose;

// 默认渲染目标尺寸
export const RenderTargetWidth = 1900;
export const RenderTargetHeight = 1000;
