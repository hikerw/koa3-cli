module.exports = function registerMaterialsRoutes(router) {
  const materialController = require('../../controller/material');
  const materialGroupController = require('../../controller/materialGroup');

  // 素材分组
  router.get('/api/material-groups', materialGroupController.list);
  router.post('/api/material-groups', materialGroupController.create);
  router.put('/api/material-groups/:id', materialGroupController.update);
  router.delete('/api/material-groups/:id', materialGroupController.delete);

  // 素材管理（upload / 秒传 须在 :id 之前）
  router.post('/api/materials/bulk-delete', materialController.bulkDelete);
  router.post('/api/materials/bulk-group', materialController.bulkGroup);
  router.get('/api/materials', materialController.list);
  router.post('/api/materials/check-hash', materialController.checkHash);
  router.post('/api/materials/instant', materialController.instant);
  router.post('/api/materials/upload', materialController.upload);
  router.get('/api/materials/:id', materialController.detail);
  router.post('/api/materials', materialController.create);
  router.put('/api/materials/:id', materialController.update);
  router.delete('/api/materials/:id', materialController.delete);
};

