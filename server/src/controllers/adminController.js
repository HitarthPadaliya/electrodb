/**
 * Account administration. Reached only through a DBA-guarded router.
 */
const adminService = require('../services/adminService');

async function listUsers(req, res, next) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ data: await adminService.listAccounts(req.query) });
  } catch (err) {
    next(err);
  }
}

async function getUser(req, res, next) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ data: await adminService.getAccount(req.params.userId) });
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    res.status(201).json({ data: await adminService.createAccount(req.body || {}) });
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    res.json({ data: await adminService.updateAccount(req.user, req.params.userId, req.body || {}) });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, getUser, createUser, updateUser };
