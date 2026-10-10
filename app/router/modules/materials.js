module.exports = function registerMaterialsRoutes(router) {
  const permit = require('../../middleware/requirePermission');
  const materialController = require('../../controller/material');
  const materialGroupController = require('../../controller/materialGroup');

  // 素材分组
  router.get('/api/material-groups', permit('material-group:read'), materialGroupController.list);
  router.post('/api/material-groups', permit('material-group:create'), materialGroupController.create);
  router.put('/api/material-groups/:id', permit('material-group:update'), materialGroupController.update);
  router.delete('/api/material-groups/:id', permit('material-group:delete'), materialGroupController.delete);

  // 素材管理（upload / 秒传 须在 :id 之前）
  router.post('/api/materials/bulk-delete', permit('material:delete'), materialController.bulkDelete);
  router.post('/api/materials/bulk-group', permit('material:update'), materialController.bulkGroup);
  router.get('/api/materials', permit('material:read'), materialController.list);
  router.post('/api/materials/check-hash', permit('material:upload'), materialController.checkHash);
  router.post('/api/materials/instant', permit('material:upload'), materialController.instant);
  router.post('/api/materials/upload', permit('material:upload'), materialController.upload);
  router.get('/api/materials/:id', permit('material:read'), materialController.detail);
  router.post('/api/materials', permit('material:create'), materialController.create);
  router.put('/api/materials/:id', permit('material:update'), materialController.update);
  router.delete('/api/materials/:id', permit('material:delete'), materialController.delete);
};

