/**
 * SMM Panel API Service
 * 
 * Works with dynamic panel configurations from the database.
 */

const axios = require('axios');

/**
 * Internal request helper
 */
async function apiRequest(panel, params) {
  try {
    const response = await axios.post(
      panel.apiUrl,
      new URLSearchParams({ key: panel.apiKey, ...params }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 30000 }
    );
    return { success: true, data: response.data };
  } catch (error) {
    const msg = error.response?.data?.error || error.message;
    return { success: false, error: msg };
  }
}

/**
 * Place an order on the SMM panel
 * @param {Object} panel - Panel configuration object from DB
 * @param {string} link - Social media post URL
 * @param {string} serviceId - Panel service ID
 * @param {number} quantity - Number of views/likes to order
 * @returns {{ success, orderId, data }}
 */
async function placeOrder(panel, link, serviceId, quantity) {
  const result = await apiRequest(panel, {
    action: 'add',
    service: serviceId,
    link,
    quantity: String(Math.max(1, Math.round(quantity))),
  });

  if (result.success && result.data?.order) {
    return { success: true, orderId: String(result.data.order), data: result.data };
  }

  // In dev/demo mode - return simulated success if API fails (useful for local testing without real keys)
  if (process.env.NODE_ENV !== 'production' && (!panel.apiUrl || panel.apiUrl.includes('example'))) {
    const mockId = `MOCK-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
    return { success: true, orderId: mockId, data: { order: mockId, mock: true } };
  }

  return { success: false, error: result.error || 'Unknown API error', orderId: null };
}

/**
 * Check the status of a previously placed order
 */
async function checkOrderStatus(panel, smmOrderId) {
  if (smmOrderId?.startsWith('MOCK-')) {
    return { success: true, data: { status: 'Completed', remains: 0, charge: '0.001', currency: 'USD' } };
  }
  return await apiRequest(panel, { action: 'status', order: smmOrderId });
}

module.exports = {
  placeOrder,
  checkOrderStatus,
};
