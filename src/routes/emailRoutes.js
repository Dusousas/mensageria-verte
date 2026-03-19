const { Router } = require('express');
const { body } = require('express-validator');
const apiKeyMiddleware = require('../middlewares/apiKey');
const { sendEmailHandler } = require('../controllers/emailController');

const router = Router();

const validateBody = [
  body('type').notEmpty().withMessage("Campo 'type' obrigatório"),
  body('to').isEmail().withMessage("Campo 'to' deve ser um email válido"),
  body('subject').notEmpty().withMessage("Campo 'subject' obrigatório"),
  body('data').isObject().withMessage("Campo 'data' deve ser um objeto"),
];

router.post('/', apiKeyMiddleware, validateBody, sendEmailHandler);

module.exports = router;
