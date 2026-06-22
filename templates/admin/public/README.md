# 文档维护说明

本文档已拆分为模块化结构，方便后期修改和维护。

## 文件结构

```
public/
├── index.html          # 主 HTML 文件（文档结构和内容）
├── docs.css           # 样式文件（修改外观）
├── docs.js            # JavaScript 逻辑文件（修改交互行为）
├── docs-content.js    # 内容配置文件（修改导航菜单）
└── README.md          # 本说明文件
```

## 如何修改文档

### 1. 修改样式（外观）

编辑 `docs.css` 文件来调整文档的外观样式，包括：
- 颜色主题
- 字体大小和样式
- 布局和间距
- 响应式设计

**示例：** 修改主题色
```css
/* docs.css */
.navbar-brand {
  color: #3eaf7c;  /* 修改为你想要的颜色 */
}
```

### 2. 修改交互行为

编辑 `docs.js` 文件来调整文档的交互行为，包括：
- 页面切换逻辑
- 侧边栏行为
- 移动端响应

**示例：** 添加新的交互功能
```javascript
// docs.js
function customFunction() {
  // 你的自定义逻辑
}
```

### 3. 修改导航菜单

编辑 `docs-content.js` 文件中的 `DOCS_NAVIGATION` 配置来更新导航菜单：

```javascript
// docs-content.js
const DOCS_NAVIGATION = [
  {
    title: '指南',
    items: [
      { id: 'home', label: '首页' },
      { id: 'getting-started', label: '快速开始' },
      // 添加新的导航项
      { id: 'new-page', label: '新页面' }
    ]
  }
];
```

### 4. 修改文档内容

编辑 `index.html` 文件中对应的 `<div id="xxx" class="content-section">` 部分来更新文档内容。

**示例：** 修改"快速开始"页面的内容
```html
<!-- index.html -->
<div id="getting-started" class="content-section">
  <h1>快速开始</h1>
  <!-- 在这里修改内容 -->
</div>
```

### 5. 添加新页面

1. 在 `index.html` 中添加新的内容区域：
```html
<div id="new-page" class="content-section">
  <h1>新页面标题</h1>
  <p>新页面内容...</p>
</div>
```

2. 在 `docs-content.js` 中添加导航项（见上面的示例）

## 文件说明

### index.html
- **作用**：包含文档的 HTML 结构和所有文档内容
- **修改位置**：找到对应的 `content-section` div，修改其中的 HTML 内容

### docs.css
- **作用**：定义文档的所有样式
- **修改位置**：直接修改 CSS 规则

### docs.js
- **作用**：处理文档的交互逻辑
- **修改位置**：修改或添加 JavaScript 函数

### docs-content.js
- **作用**：配置导航菜单结构
- **修改位置**：修改 `DOCS_NAVIGATION` 数组

## 注意事项

1. **保持 ID 一致**：确保 `docs-content.js` 中的导航 ID 与 `index.html` 中的 `content-section` ID 一致
2. **代码高亮**：代码块使用 Prism.js，确保 `class="language-xxx"` 正确
3. **响应式设计**：修改样式时注意移动端的显示效果
4. **浏览器兼容性**：使用现代浏览器支持的 CSS 和 JavaScript 特性

## 快速修改指南

- **改颜色** → 编辑 `docs.css`
- **改布局** → 编辑 `docs.css`
- **改内容** → 编辑 `index.html`
- **改导航** → 编辑 `docs-content.js`
- **改功能** → 编辑 `docs.js`

## 文件加载顺序

文档按以下顺序加载：
1. HTML 结构（index.html）
2. CSS 样式（docs.css）
3. 导航配置（docs-content.js）
4. 交互逻辑（docs.js）

确保所有文件都在 `public` 目录下，并且路径正确。
