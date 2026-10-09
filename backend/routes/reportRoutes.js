const router = require('express').Router();
const { getEquipmentHistory, getPMDueReport, getCallCategoryVisits, getCallCategoryDetails } = require('../controllers/reportController');

router.get('/equipment-history', getEquipmentHistory);
router.get('/pm-due', getPMDueReport);
router.get('/call-categories', getCallCategoryVisits);
router.get('/call-categories/details', getCallCategoryDetails);

module.exports = router;
