import http from '../http';

export function fetchMenus(params) {
  return http.get('/system/menus', { params });
}

export function fetchMenuTree() {
  return http.get('/system/menus/tree');
}

/** 当前登录用户可见的菜单树（后端按权限过滤） */
export function fetchCurrentUserMenus() {
  return http.get('/system/menus/current');
}

export function getMenu(id) {
  return http.get(`/system/menus/${id}`);
}

export function createMenu(data) {
  return http.post('/system/menus', data);
}

export function updateMenu(id, data) {
  return http.put(`/system/menus/${id}`, data);
}

export function deleteMenu(id) {
  return http.delete(`/system/menus/${id}`);
}
