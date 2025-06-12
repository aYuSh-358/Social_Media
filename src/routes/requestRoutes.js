const express = require('express');
const router = express.Router();
const requestControllers = require('../controllers/requestControllers');


router.post('/sendRequest', requestControllers.sendRequest);
router.get('/viewRequests', requestControllers.viewRequests);
//router.post('/acceptRequest', requestControllers.acceptRequest);
router.put('/statusRequest/:id', requestControllers.statusRequest);




module.exports = router;
