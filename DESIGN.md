---
name: OneChart 策略模拟器
description: A dense strategy-risk instrument for Monte Carlo evidence and risk sizing.
colors:
  ground: "#f3f4f6"
  paper: "#ffffff"
  panel: "#fbfbfc"
  panel-muted: "#f7f8f9"
  ink: "#13161a"
  text: "#30363e"
  muted: "#6e7783"
  quiet: "#939aa4"
  line: "#e0e3e7"
  line-strong: "#cfd4da"
  row-hover: "#f7f8fa"
  accent: "#557da8"
  accent-fill: "#e8eef4"
  risk: "#c94742"
  gain: "#14715c"
  warm: "#996421"
  analysis: "#7257a5"
  dark-ground: "#0f1216"
  dark-paper: "#15191e"
  dark-panel: "#181d23"
  dark-panel-muted: "#1b2027"
  dark-ink: "#f0f2f5"
  dark-text: "#c9d0d8"
  dark-muted: "#8f99a5"
  dark-quiet: "#7e8894"
  dark-line: "#282f38"
  dark-line-strong: "#39424d"
  dark-row-hover: "#1a2027"
  dark-accent: "#8eacd2"
  dark-accent-fill: "#1d2a3a"
  dark-risk: "#e06a64"
  dark-gain: "#48b89d"
  dark-warm: "#b99565"
  dark-analysis: "#b6a0dc"
typography:
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Noto Sans SC, sans-serif"
    fontSize: "28px"
    fontWeight: 710
    lineHeight: 1.15
    letterSpacing: "-0.04em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Noto Sans SC, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Noto Sans SC, sans-serif"
    fontSize: "11px"
    fontWeight: 650
rounded:
  control: "0px"
  surface: "0px"
spacing:
  layout-gutter-desktop: "24px"
  layout-gutter-compact: "16px"
  layout-gutter-mobile: "14px"
  rail-padding: "18px"
  surface-padding: "18px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "9px 12px"
    height: "38px"
  button-theme:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.control}"
    padding: "0 9px"
    height: "30px"
  mode-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "8px 6px"
  chart-frame:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.surface}"
    padding: "42px 12px 10px"
    height: "520px"
---

# Design System: OneChart 策略模拟器

## Overview

**Creative North Star: “The Strategy Risk Bench / 策略风险工作台”**

OneChart 的策略模拟器是高密度、连续的操作表面：参数、诊断、策略比较和概率证据并列呈现，如同一张连续仪器台，而非卡片墙。它服务于策略风险理解；清晰的数据关系与可操作反馈建立可信度，不借终端化装饰或夸张语气。

浅色是默认工作环境；深色为低环境光下的同一信息层级。中性纸面、方角、细规则线承担结构；策略、风险、收益和分析色只承担数据意义。

**Key Characteristics:**
- 连续工作表的结构，信息高密度但不拥挤。
- 色彩是语义，而非表面装饰。
- 所有形状方正，深度只由背景、规则线和留白建立。
- 与 OneChart 导航、主题行为和命名保持一致。

## Colors

冷静的中性色构成工作环境；`accent` 指示选择与焦点，`risk`、`gain`、`warm`、`analysis` 只编码各自的策略或结果语义。深色 token 是同角色的低环境光映射，不另建一套视觉语言。

### Primary
- **Instrument Accent:** 当前选择、诊断边线与轻量激活填充；保持局部使用，避免将其扩展为装饰性大面积背景。

### Secondary
- **Risk and Gain:** 风险/劣势与正向结果的明确语义标记；仅用于数据、状态和值的解读。
- **Warm and Analysis:** 阶段性策略与概率分析的辅助语义，不能替代中性结构线。

### Neutral
- **Ground, Paper and Panel:** 依次建立页面基底、主要工作面和次级数据面。
- **Ink, Text, Muted and Quiet:** 从关键决策文本到说明性标签的层级。
- **Line and Line Strong:** 所有常规分区、表格化单元与导航边界的结构语言。

**The Semantic Color Rule.** 不用策略或风险色填充普通容器；当去掉彩色数值后，界面的层级仍必须由中性背景、细线和排版成立。

## Typography

**Display Font:** 系统 UI 字体栈（`-apple-system`、`BlinkMacSystemFont`、`Segoe UI`，中文由 `PingFang SC` 与 `Noto Sans SC` 补充）。

**Body Font:** 同一系统 UI 字体栈。

**Character:** 紧凑、稳定、可扫读。文本和数值使用同一字体体系；数值通过 `font-variant-numeric: tabular-nums` 对齐，而不借等宽终端字体营造专业感。

### Hierarchy
- **Title**（710，28px，1.15，-0.04em）：页面主标题；640px 以下为 23px。
- **Section title**（680，14px）：参数 rail 的标题。
- **Body**（400，11px，1.55）：诊断带和说明文本。
- **Dense label**（650，11px）：导航、控制、卡片标题与图表标签。
- **Quiet label**（500，9–10px）：辅助提示、分区说明和图表交互提示。

**The Evidence-First Type Rule.** 小标签用于建立扫描节奏；关键数字应依靠对齐、字重与上下文突出，而不是放大为宣传式主视觉。

## Layout

内容采用最多 1560px 的居中内框；外层导航满宽，内框宽度为视口减两侧 gutter。gutter 在桌面、1287px 以下和 640px 以下分别切换为 `layout-gutter-desktop`、`layout-gutter-compact`、`layout-gutter-mobile`。

导航高 58px。标题区之后是固定参数 rail 与主分析区：桌面为 300px rail 加弹性主区，二者无间隙并以垂直细线相接。诊断带、策略比较单元和图表在主区内连续堆叠；两张图表成对排列且共享边界。1180px 以下 rail 收为 270px，诊断带和成对图表改为单列；图表高度降为 460px。

992px 以下主体变为单列，参数 rail 改为底部抽屉；参数入口保持 sticky。统计单元先为两列，再在 640px 以下收为一列。640px 以下导航分为品牌行和可横向滚动的链接行，图表高度为 360px。页面不可产生横向溢出。

## Elevation & Depth

没有静态阴影。深度来自 ground、paper、panel 的明度层级，配合 1px 规则线、边界和留白；hover 仅改变中性行背景，激活策略单元使用轻量 accent fill。焦点采用 2px ink outline 和 2px offset，避免光晕或浮起效果。

**The Flat Instrument Rule.** 不为容器添加装饰性阴影；如果一个区域需要区分，应先使用纸面层级、规则线或空间，而非抬升它。

## Shapes

所有容器、按钮、输入、模式切换、主题按钮、策略单元、图表框和移动抽屉均使用 `0px` 角半径。细线与直角形成连续仪器台的几何语言。range 控件保留原生可操作性；不将其改造成装饰性胶囊轨道。

## Components

### Navigation
- **Character:** 家族级、安静的定位条，而非产品横幅。
- **Structure:** 58px 高、paper 背景和强规则线底边；wordmark 后有 1px 分隔标记，链接为横向可滚动行。
- **State:** 当前链接以 ink 文本和 2px 底线标记；hover 只加深文本。
- **Theme button:** 方角边框按钮，包含太阳/月亮 SVG 和“深色/浅色”标签；主题状态由 `onechart-theme` 存储，并写入 `html[data-theme]`。

### Mode Switch
- **Character:** 紧凑的二分选择器。
- **Shape:** 方角、强规则线外框，相邻选项以 1px 线隔开。
- **State:** 激活项为 ink 底、paper 字；非激活项透明且使用 muted 字。

### Range Parameters
- **Character:** 参数 rail 中的连续校准控件。
- **Structure:** 标签与当前值在同一行，值使用 tabular numerals；range 高 16px，轨道使用 ink 作为浏览器 `accent-color`。
- **Focus:** 遵循全局可见 outline，不添加装饰 glow。

### Primary Button
- **Character:** 直接执行模拟的实体控制。
- **Shape:** 方角，最小高 38px。
- **Color:** ink 背景、paper 文字、ink 边框；hover 和 active 不位移、不投影。

### Diagnostic Band
- **Character:** 参数之后的证据入口，不是通知卡片。
- **Structure:** paper 表面、无圆角；诊断单元用一条 accent 左线，逆向推算与其通过中性规则线分隔。
- **Responsive:** 992px 以下可收起详情，提示保持在单元底部。

### Strategy Comparison Unit
- **Character:** 可点击的横向数据 rail，支持比较而非装饰性卡片陈列。
- **Structure:** panel 背景、无圆角、相邻单元以细线分隔；每格至少 112px 高，状态色以底部 2px 线表达。
- **State:** hover 改为 row-hover；激活项使用 accent-fill，风险数值保留 risk 语义色。

### Chart Frame
- **Character:** 一对平等、连续的分析视口。
- **Structure:** paper 背景、无圆角；桌面双列且中间只用强规则线分开。标题位于左上，交互提示位于右上。
- **Behavior:** 资金路径支持单击锁定、双击尺度切换；结果分布支持拖动框选概率区间。1180px 以下顺序堆叠。

### Mobile Drawer
- **Character:** 参数 rail 在窄屏的同一工作面延续。
- **Structure:** 992px 以下从底部进入，最大高 88vh，paper 背景、方角、顶部边框且无阴影；遮罩为低透明 ground 色。
- **Entry:** sticky 参数入口为方角实心主按钮；关闭按钮为方角轮廓控制。

## Do's and Don'ts

### Do:
- **Do** 保持参数、诊断、策略比较和图表证据的连续阅读顺序。
- **Do** 使用既有中性 token 建立面、线和文本层级，再使用语义色解释策略或风险。
- **Do** 在 1287px、1180px、992px 和 640px 按既有断点调整 gutter、结构与移动入口。
- **Do** 保持 system/PingFang/Noto Sans SC 字体体系、28px 桌面标题与 11px 高密度标签语言。
- **Do** 用 `onechart-theme` 与 `html[data-theme]` 维持与 OneChart 家族一致的主题切换。

### Don't:
- **Don't** 使用终端 cosplay、emoji、渐变、玻璃、彩色圆角卡片或装饰性阴影。
- **Don't** 以静态阴影制造层级，或把连续仪器台拆成松散卡片墙。
- **Don't** 将策略、风险、收益或分析色作为普通结构边框和大面积容器背景。
- **Don't** 改变移动端 sticky 参数入口和底部抽屉这一既有参数访问方式。
