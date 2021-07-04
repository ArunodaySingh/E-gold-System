const express = require('express');
const homepage = require('./Pages/homepage');
const { getlogin, postlogin } = require('./Pages/login');
const plan1 = require('./Pages/plan1');
const plan3 = require('./Pages/plan3');
const { getregister, postregister } = require('./Pages/userregister');
const admin = require('./Pages/admin');
const adminlogin = require('./Pages/adminlogin');
const formwithid = require('./Pages/formwithid');
const scheme1 = require('./Pages/1stscheme');
const { getreset, postreset } = require('./Pages/reset');
const getkyc = require('./Pages/kyc');
const router = express.Router();

router.route('/').get(homepage);
router.route('/login').get(getlogin).post(postlogin);
router.route('/chooseplan1').get(plan1);
router.route('/plan3').get(plan3);
router.route('/register').get(getregister).post(postregister);
router.route('/admin').get(admin);
router.route('/adminlogin').post(adminlogin);
router.route('/reset').get(getreset).post(postreset);
router.route('/1stplan').get(scheme1);
router.route('/form/:title').get(formwithid);
router.route('/kyc').get(getkyc);

module.exports = router;