/* ============================================
   Koa3 CLI 文档 JavaScript 逻辑文件
   修改此文件来调整文档的交互行为
   ============================================ */

/**
 * 显示指定的内容区域
 * @param {string} id - 内容区域的 ID
 */
function showContent(id) {
  // 隐藏所有内容
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');
  });

  // 显示选中的内容
  const target = document.getElementById(id);
  if (target) {
    target.classList.add('active');
  }

  // 更新侧边栏活动状态
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.remove('active');
  });
  if (event && event.target) {
    event.target.classList.add('active');
  }

  // 滚动到顶部
  window.scrollTo(0, 0);

  // 移动端关闭侧边栏
  if (window.innerWidth <= 959) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

/**
 * 显示首页
 */
function showHome() {
  showContent('home');
  const firstLink = document.querySelectorAll('.sidebar-link')[0];
  if (firstLink) {
    firstLink.classList.add('active');
  }
}

/**
 * 切换侧边栏显示/隐藏（移动端）
 */
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  // 点击外部关闭侧边栏（移动端）
  document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.querySelector('.menu-toggle');

    if (window.innerWidth <= 959 &&
      sidebar &&
      sidebar.classList.contains('open') &&
      !sidebar.contains(e.target) &&
      menuToggle &&
      !menuToggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });

  // 初始化 Prism 代码高亮
  if (typeof Prism !== 'undefined' && Prism.plugins && Prism.plugins.autoloader) {
    Prism.plugins.autoloader.languages_path = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/';
  }
});
