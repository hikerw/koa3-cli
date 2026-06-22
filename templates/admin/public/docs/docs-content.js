/* ============================================
   Koa3 CLI 文档内容数据文件
   修改此文件来更新文档内容和导航菜单
   ============================================ */

/**
 * 导航菜单配置
 * 修改此配置来调整侧边栏导航
 */
const DOCS_NAVIGATION = [
  {
    title: '指南',
    items: [
      { id: 'home', label: '首页' },
      { id: 'getting-started', label: '快速开始' },
      { id: 'project-structure', label: '项目结构' },
      { id: 'configuration', label: '配置说明' },
      { id: 'development', label: '开发指南' }
    ]
  },
  {
    title: 'API',
    items: [
      { id: 'api-readme', label: 'API 文档' },
      { id: 'api-user', label: '用户接口' }
    ]
  }
];

/**
 * 文档内容配置
 * 修改此配置来更新文档内容
 */
const DOCS_CONTENT = {
  'home': {
    title: 'Koa3 CLI',
    subtitle: '基于 Koa3 的脚手架项目',
    description: '2025年4月28日，Node.js 生态圈迎来了一场重磅升级——Koa.js 3.0 正式发布！自2017年启动开发计划，历经8年长跑，由 Express 原班人马打造的经典轻量级 Web 框架，终于以全新姿态回归视野。Koa 3.0 不仅是一次版本号的跃迁，更是 Node.js 现代化进程的重要里程碑。',
    actionButton: {
      text: '快速开始 →',
      target: 'getting-started'
    },
    features: [
      { icon: '🚀', title: '轻量高效', description: '基于 Koa3，性能优异，代码简洁' },
      { icon: '📁', title: '清晰结构', description: '规范统一，易于维护' },
      { icon: '🔧', title: '多环境配置', description: '支持 development/production 环境配置' },
      { icon: '🏗️', title: 'MVC 架构', description: 'Controller/Service/Model 分层清晰' },
      { icon: '🔌', title: '中间件支持', description: '灵活的中间件系统，易于扩展' },
      { icon: '✅', title: '错误处理', description: '统一的错误处理机制' }
    ]
  },
  'getting-started': {
    title: '快速开始',
    sections: [
      {
        type: 'h2',
        content: '安装依赖'
      },
      {
        type: 'code',
        language: 'bash',
        content: 'npm install'
      },
      {
        type: 'h2',
        content: '启动项目'
      },
      {
        type: 'h3',
        content: '开发环境'
      },
      {
        type: 'p',
        content: '使用 nodemon 自动重启：'
      },
      {
        type: 'code',
        language: 'bash',
        content: 'npm run dev'
      },
      {
        type: 'h3',
        content: '生产环境'
      },
      {
        type: 'code',
        language: 'bash',
        content: 'npm start'
      },
      {
        type: 'h2',
        content: '访问应用'
      },
      {
        type: 'p',
        content: '启动成功后，你可以访问：'
      },
      {
        type: 'list',
        items: [
          '<strong>首页</strong>: http://localhost:3000',
          '<strong>API 示例</strong>: http://localhost:3000/api/user',
          '<strong>文档</strong>: http://localhost:3000/index.html'
        ]
      },
      {
        type: 'h2',
        content: '环境配置'
      },
      {
        type: 'p',
        content: '项目支持多环境配置，通过 <code>NODE_ENV</code> 环境变量控制：'
      },
      {
        type: 'list',
        items: [
          '<code>development</code> 或 <code>local</code>: 加载 <code>config.local.js</code>',
          '<code>production</code>: 加载 <code>config.prod.js</code>',
          '默认: 加载 <code>config.default.js</code>'
        ]
      },
      {
        type: 'p',
        content: '可以通过 <code>.env</code> 文件配置环境变量（参考 <code>env.example</code>）。'
      },
      {
        type: 'h2',
        content: '下一步'
      },
      {
        type: 'list',
        items: [
          '了解 <a href="#" onclick="showContent(\'project-structure\'); return false;">项目结构</a>',
          '查看 <a href="#" onclick="showContent(\'configuration\'); return false;">配置说明</a>',
          '阅读 <a href="#" onclick="showContent(\'development\'); return false;">开发指南</a>'
        ]
      }
    ]
  },
  // 其他内容可以继续添加...
  // 为了简化，这里只展示结构，实际使用时可以将完整的 HTML 内容放在这里
};

/**
 * 渲染导航菜单
 */
function renderNavigation() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  let html = '';
  DOCS_NAVIGATION.forEach(group => {
    html += '<div class="sidebar-group">';
    html += `<div class="sidebar-group-title">${group.title}</div>`;
    group.items.forEach(item => {
      const isActive = item.id === 'home' ? 'active' : '';
      html += `<a href="#" class="sidebar-link ${isActive}" onclick="showContent('${item.id}'); return false;">${item.label}</a>`;
    });
    html += '</div>';
  });
  sidebar.innerHTML = html;
}

/**
 * 渲染文档内容
 * 注意：由于内容较长，这里提供一个简化的渲染函数
 * 实际使用时，可以将完整的 HTML 内容直接放在 HTML 文件中，或者使用模板引擎
 */
function renderContent() {
  // 这个方法可以根据 DOCS_CONTENT 配置动态生成内容
  // 但为了简单和性能，建议直接在 HTML 中写内容
  // 这里只是提供一个结构示例
}

// 页面加载时渲染导航
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderNavigation);
} else {
  renderNavigation();
}
