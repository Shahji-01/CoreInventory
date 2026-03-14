const DashboardService = require('../services/dashboardService');
const { success } = require('../utils/apiResponse');

// GET /api/dashboard
const getDashboard = async (req, res) => {
  const result = await DashboardService.getDashboardData();
  return success(res, result);
};

module.exports = { getDashboard };
