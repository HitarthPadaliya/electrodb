const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');

// Assignment 11 Query 1 (Full Table JSON & XML)
router.get('/components', labController.getComponents);
router.get('/components.xml', labController.getComponentsXml);

// Assignment 10 Component Stored Procedure CRUD
router.post('/components', labController.createComponent);
router.patch('/components/:id', labController.updateComponent);
router.delete('/components/:id', labController.deleteComponent);

// Assignment 11 Query 3 (Aggregate JSON & XML)
router.get('/aggregate', labController.getAggregate);
router.get('/aggregate.xml', labController.getAggregateXml);

// Assignment 11 Query 4 (Filter JSON & XML)
router.get('/filter', labController.getFilter);
router.get('/filter.xml', labController.getFilterXml);

// Assignment 11 Query 5 (Join)
router.get('/join', labController.getJoin);

// Assignment 11 Query 6 (Subquery)
router.get('/subquery', labController.getSubquery);

// Assignment 11 Query 7 (Correlated Query)
router.get('/correlated-query', labController.getCorrelated);

// Assignment 10 Cursors
router.get('/cursors/all', labController.getCursorsAll);
router.get('/cursors/limited', labController.getCursorsLimited);

// Assignment 10 Sum
router.get('/sum', labController.getSum);

// Assignment 10 App Users CRUD
router.get('/users', labController.getAppUsers);
router.post('/users', labController.createAppUser);
router.patch('/users/:id', labController.updateAppUser);
router.delete('/users/:id', labController.deleteAppUser);

// Assignment 10 Audit Log
router.get('/audit-log', labController.getAuditLogs);

// Assignment 11 Views
router.get('/views/catalogue', labController.getViewCatalogue);
router.get('/views/counts', labController.getViewCounts);

// Assignment 11 Dashboard
router.get('/dashboard', labController.getDashboard);

// Assignment 11 Timing & Index Benchmark Report
router.get('/timing-report', labController.getTimingReport);

module.exports = router;
