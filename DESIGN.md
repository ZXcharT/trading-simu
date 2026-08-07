---
name: OneChart 交易模拟器
description: A continuous strategy-risk workbench for assumptions, risk limits, and probability evidence.
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
  accent: "#557da8"
  accent-fill: "#e8eef4"
  risk: "#c94742"
  gain: "#14715c"
  warm: "#996421"
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
  dark-accent: "#8eacd2"
  dark-accent-fill: "#1d2a3a"
  dark-risk: "#e06a64"
  dark-gain: "#48b89d"
  dark-warm: "#b99565"
typography:
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Noto Sans SC, sans-serif"
    fontSize: "28px"
    fontWeight: 710
    lineHeight: 1.15
    letterSpacing: "-0.04em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Noto Sans SC, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Noto Sans SC, sans-serif"
    fontSize: "11px"
    fontWeight: 650
  wordmark:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Noto Sans SC, sans-serif"
    fontSize: "16px"
    fontWeight: 730
  nav:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Noto Sans SC, sans-serif"
    fontSize: "12px"
    fontWeight: 500
  section:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Noto Sans SC, sans-serif"
    fontSize: "13px"
    fontWeight: 680
  compact:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Noto Sans SC, sans-serif"
    fontSize: "10px"
    fontWeight: 500
  quiet:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Noto Sans SC, sans-serif"
    fontSize: "9px"
    fontWeight: 500
  micro:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Noto Sans SC, sans-serif"
    fontSize: "8.5px"
    fontWeight: 500
  auxiliary:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Noto Sans SC, sans-serif"
    fontSize: "9.5px"
    fontWeight: 500
  detail:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Noto Sans SC, sans-serif"
    fontSize: "17px"
    fontWeight: 680
  status:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Noto Sans SC, sans-serif"
    fontSize: "18px"
    fontWeight: 680
  metric:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Noto Sans SC, sans-serif"
    fontSize: "30px"
    fontWeight: 680
  mobile-title:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Noto Sans SC, sans-serif"
    fontSize: "23px"
    fontWeight: 710
  mobile-metric:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Noto Sans SC, sans-serif"
    fontSize: "27px"
    fontWeight: 680
  summary-value:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Noto Sans SC, sans-serif"
    fontSize: "20px"
    fontWeight: 700
  summary-risk:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Noto Sans SC, sans-serif"
    fontSize: "26px"
    fontWeight: 700
  mobile-summary-risk:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Noto Sans SC, sans-serif"
    fontSize: "25px"
    fontWeight: 700
rounded:
  control: "0px"
  surface: "0px"
spacing:
  gutter-desktop: "24px"
  gutter-compact: "16px"
  gutter-mobile: "14px"
  rail-padding: "18px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "9px 12px"
    height: "38px"
  chart:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.surface}"
    height: "500px"
---

# Design System: OneChart 交易模拟器

## Overview

**Creative North Star: “The Risk Decision Bench / 风险决策工作台”**

页面是一张连续的风险工作台，不是模拟器控制台、入口问卷或卡片墙。参数、运行状态、风险结论、档位比较和图表证据遵循同一因果顺序；用户无需理解内部计算模式即可完成判断。

OneChart 家族的中性纸面、方角、细规则线和紧凑排版保持不变。策略色只标识档位，风险与收益色只解释数据。计算复杂度通过进度、取消、过期结果和最近有效结果表达，而不是用动画或装饰掩盖等待。

**Key Characteristics:**
- 直接进入，单一连续工作流。
- 结论先于图表，高级信息按需展开。
- 计算状态和数据口径始终可见。
- 桌面与移动分别组织，不缩放桌面结构。

## Colors

中性色负责结构，语义色只负责数据与状态。`accent` 用于计算进度、焦点和当前档位；`risk`、`gain`、`warm` 分别表示负向风险、正向状态与结果过期/边界提醒。

**The Semantic Color Rule.** 普通容器、结构边框和导航不使用策略色。去掉彩色数据后，页面层级仍必须成立。

## Typography

使用系统 UI 字体栈，中文由 PingFang SC 和 Noto Sans SC 补充。标题为 28px/710，移动端 23px；正文 14px；高密度标签通常 9–11px。数值使用 tabular numerals，不用等宽字体模拟终端感。

**The Evidence-First Type Rule.** 最大字号留给页面标题和唯一风险结论；其他统计通过位置、对齐和字重形成层级。

## Layout

页面最大内宽 1560px，gutter 在桌面、1287px 以下和 640px 以下分别为 24、16、14px。导航高 58px。

桌面主区为 300px 参数 rail 与弹性结果区。结果区依次是运行状态、三列结论、风险档位、成对图表和高级详情。1180px 以下参数 rail 收为270px、图表改为单列；992px 以下参数进入底部抽屉；640px 以下结论改为单列，风险档位横向滚动，图表高360px。

移动默认阅读顺序固定为：运行状态 → 当前结论 → 风险档位 → 图表 → 高级详情。参数入口 sticky，不遮挡数据。

## Elevation & Depth

没有静态装饰阴影。层级来自 ground、paper、panel 的明度差，1px规则线和留白。焦点使用2px ink outline和2px offset。

**The Flat Instrument Rule.** 需要分区时优先使用纸面层级和规则线，不抬升容器。

## Shapes

按钮、输入、结论区、风险档位、图表、抽屉和状态控件全部为0px圆角。仅状态点和原生range thumb允许圆形。

## Components

### Parameter Rail
按“策略参数 / 收益目标与风险边界”分组。标签和值同排，range独占下一行。策略参数下直接显示数学期望、盈亏平衡胜率和凯利上限。模拟固定使用2,000次深度精度，只显示事实说明，不提供精度选择器。

### Run State
运行状态收在参数栏底部，与“深度模拟”说明同一基线，进度线紧贴其下；结果区不得为“计算完成”单独占用整行。计算中仅在同处显示取消入口，并保留上一次完整结果。移动端将状态同步到“调整参数”入口。

### Decision Summary
三列依次为策略状态、当前风险结论和仓位交接。每列采用紧凑结论条：标签在左、主值在右，次级证据收在下方，禁止为主值预留空白大块。标题行和主数据内部不使用分割线，依靠对齐、字重与间距建立层级；只保留大区块和列之间的结构边界。建议风险上限是唯一大数字；测试风险、风险上限来源和收益目标可达性为次级证据。收益目标不得显示为风险限制因素。负期望时禁用买点交接。

### Risk Ladder
默认展示围绕建议上限形成的五档风险，凯利理论档提供八档高级比较。一次运行缓存两组共享随机路径的结果，切换必须即时且不触发Worker。单笔风险百分比是每个档位的主数字，不能降为辅助小字。档位是连续数据单元，不是独立浮动卡片。

### Charts
默认只绘制各档中位数，控制ECharts主线程负担。选中单档后自动显示最低样本、P10/P50/P90、最高样本和30条样本路径；返回总览后自动隐藏样本，不提供手动显隐按钮。资金路径提示使用单曲线命中，不允许轴悬停一次展示全部路径。尺度、区间概率和重置保留可见控制，双击只作为尺度快捷方式。

### Mobile Drawer
992px以下参数rail改为底部抽屉，最大高88vh。sticky入口占据文档空间，不覆盖风险档位。

## Do's and Don'ts

### Do:
- **Do** 让参数草稿、已提交参数和结果状态可区分。
- **Do** 先显示风险结论，再显示风险档位与证据图表。
- **Do** 将统计样本数与可视曲线数分开控制。
- **Do** 使用“回调买点 / 启动买点”，隐藏内部兼容键。
- **Do** 保持主题、尺度、档位选择、两组基准切换和区间刷选不触发重新模拟。

### Don't:
- **Don't** 增加入口问答、技术模式名或裸露的B1/B2。
- **Don't** 使用情绪化统计文案、emoji、渐变、玻璃、彩色圆角卡片或装饰阴影。
- **Don't** 在滑杆input事件中提交完整模拟。
- **Don't** 在风险总览绘制随机样本路径，也不要提供手动显隐开关。
- **Don't** 让过期job覆盖当前结果或让半成品替换last-good结果。
