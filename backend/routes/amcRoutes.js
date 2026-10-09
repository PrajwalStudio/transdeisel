const router = require('express').Router();
const { getMonthlyAmcVisits } = require('../controllers/amcController');

router.get('/monthly-visits', getMonthlyAmcVisits);

module.exports = router;
