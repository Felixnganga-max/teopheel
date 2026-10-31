// frontend/src/data/data.js
export const branches = [
  { id: 1, name: 'Naivasha Road', location: 'Naivasha Road, Nairobi', color: '#3182CE' },
  { id: 2, name: 'Kikuyu', location: 'Kikuyu, Nairobi', color: '#38A169' },
  { id: 3, name: 'Uthiru (87)', location: 'Uthiru 87, Nairobi', color: '#D69E2E' },
  { id: 4, name: 'Loresho', location: 'Loresho, Nairobi', color: '#9F7AEA' },
];

export const products = [
  { id: 1, name: '6kg Cylinder', kg: 6, buyPrice: 1200, sellPrice: 1600 },
  { id: 2, name: '9kg Cylinder', kg: 9, buyPrice: 1600, sellPrice: 2100 },
  { id: 3, name: '12kg Cylinder', kg: 12, buyPrice: 2000, sellPrice: 2600 },
  { id: 4, name: '19kg Cylinder', kg: 19, buyPrice: 2800, sellPrice: 3600 },
];

export let hqStock = [
  { productId: 1, quantity: 100 },
  { productId: 2, quantity: 80 },
  { productId: 3, quantity: 60 },
  { productId: 4, quantity: 40 },
];

export let branchStock = [
  { branchId: 1, productId: 1, quantity: 15 },
  { branchId: 1, productId: 2, quantity: 12 },
  { branchId: 1, productId: 3, quantity: 8 },
  { branchId: 1, productId: 4, quantity: 5 },
  { branchId: 2, productId: 1, quantity: 10 },
  { branchId: 2, productId: 2, quantity: 8 },
  { branchId: 2, productId: 3, quantity: 6 },
  { branchId: 2, productId: 4, quantity: 4 },
  { branchId: 3, productId: 1, quantity: 12 },
  { branchId: 3, productId: 2, quantity: 10 },
  { branchId: 3, productId: 3, quantity: 7 },
  { branchId: 3, productId: 4, quantity: 3 },
  { branchId: 4, productId: 1, quantity: 8 },
  { branchId: 4, productId: 2, quantity: 6 },
  { branchId: 4, productId: 3, quantity: 5 },
  { branchId: 4, productId: 4, quantity: 2 },
];

export const customers = [
  {
    id: 1,
    name: 'Jane Wanjiku',
    phone: '0712345678',
    location: 'Naivasha Road, Nairobi',
    firstOrderDate: '2025-03-10',
    totalOrders: 4,
    lastOrderDate: '2025-06-15',
  },
  {
    id: 2,
    name: 'Peter Ochieng',
    phone: '0723456789',
    location: 'Kikuyu, Nairobi',
    firstOrderDate: '2025-04-22',
    totalOrders: 7,
    lastOrderDate: '2025-06-16',
  },
  {
    id: 3,
    name: 'Grace Muthoni',
    phone: '0734567890',
    location: 'Uthiru 87, Nairobi',
    firstOrderDate: '2025-05-01',
    totalOrders: 2,
    lastOrderDate: '2025-06-10',
  },
  {
    id: 4,
    name: 'David Kamau',
    phone: '0745678901',
    location: 'Loresho, Nairobi',
    firstOrderDate: '2025-06-01',
    totalOrders: 1,
    lastOrderDate: '2025-06-01',
  },
  {
    id: 5,
    name: 'Mary Akinyi',
    phone: '0756789012',
    location: 'Naivasha Road, Nairobi',
    firstOrderDate: '2025-06-12',
    totalOrders: 3,
    lastOrderDate: '2025-06-17',
  },
];

// Extended order schema with notification tracking
export let orders = [
  {
    id: 'ORD-001',
    customerName: 'Jane Wanjiku',
    customerPhone: '0712345678',
    location: 'Naivasha Road, Nairobi',
    branchId: 1,
    productId: 2,
    status: 'delivered',
    createdAt: '2025-06-17T08:30:00',
    amount: 2100,
    paid: true,
    paidAt: '2025-06-17T08:45:00',
    dispatchedAt: '2025-06-17T08:35:00',
    dispatchSmsSent: true,
    dispatchSmsSentAt: '2025-06-17T08:36:00',
    paymentLinkSent: true,
    paymentLinkScheduledAt: '2025-06-17T08:38:00',
    paymentLinkFailed: false,
    stkSent: false,
    paymentLinkClicked: true,
    deliveredAt: '2025-06-17T09:00:00',
  },
  {
    id: 'ORD-002',
    customerName: 'Mary Akinyi',
    customerPhone: '0756789012',
    location: 'Naivasha Road, Nairobi',
    branchId: 1,
    productId: 1,
    status: 'awaiting_payment',
    createdAt: '2025-06-17T10:15:00',
    amount: 1600,
    paid: false,
    paidAt: null,
    dispatchedAt: '2025-06-17T10:20:00',
    dispatchSmsSent: true,
    dispatchSmsSentAt: '2025-06-17T10:21:00',
    paymentLinkSent: false,
    paymentLinkScheduledAt: '2025-06-17T10:23:00',
    paymentLinkFailed: false,
    stkSent: false,
    paymentLinkClicked: false,
    deliveredAt: null,
  },
  {
    id: 'ORD-003',
    customerName: 'Peter Ochieng',
    customerPhone: null,
    location: 'Kikuyu, Nairobi',
    branchId: 2,
    productId: 3,
    status: 'dispatched',
    createdAt: '2025-06-17T11:00:00',
    amount: 2600,
    paid: false,
    paidAt: null,
    dispatchedAt: '2025-06-17T11:05:00',
    dispatchSmsSent: false,
    dispatchSmsSentAt: null,
    paymentLinkSent: false,
    paymentLinkScheduledAt: null,
    paymentLinkFailed: false,
    stkSent: false,
    paymentLinkClicked: false,
    deliveredAt: null,
  },
  {
    id: 'ORD-004',
    customerName: 'Grace Muthoni',
    customerPhone: '0734567890',
    location: 'Uthiru 87, Nairobi',
    branchId: 3,
    productId: 2,
    status: 'paid',
    createdAt: '2025-06-16T14:20:00',
    amount: 2100,
    paid: true,
    paidAt: '2025-06-16T14:40:00',
    dispatchedAt: '2025-06-16T14:25:00',
    dispatchSmsSent: true,
    dispatchSmsSentAt: '2025-06-16T14:26:00',
    paymentLinkSent: true,
    paymentLinkScheduledAt: '2025-06-16T14:28:00',
    paymentLinkFailed: true,
    stkSent: true,
    paymentLinkClicked: false,
    deliveredAt: null,
  },
  {
    id: 'ORD-005',
    customerName: 'David Kamau',
    customerPhone: '0745678901',
    location: 'Loresho, Nairobi',
    branchId: 4,
    productId: 4,
    status: 'delivered',
    createdAt: '2025-06-16T09:45:00',
    amount: 3600,
    paid: true,
    paidAt: '2025-06-16T10:00:00',
    dispatchedAt: '2025-06-16T09:50:00',
    dispatchSmsSent: true,
    dispatchSmsSentAt: '2025-06-16T09:51:00',
    paymentLinkSent: true,
    paymentLinkScheduledAt: '2025-06-16T09:53:00',
    paymentLinkFailed: false,
    stkSent: false,
    paymentLinkClicked: true,
    deliveredAt: '2025-06-16T10:15:00',
  },
];


export const salesAnalytics = {
  daily: {
    totalRevenue: 28400,
    totalMargin: 7100,
    totalOrders: 8,
    branches: [
      { branchId: 1, revenue: 9600, margin: 2400, orders: 3 },
      { branchId: 2, revenue: 7200, margin: 1800, orders: 2 },
      { branchId: 3, revenue: 6800, margin: 1700, orders: 2 },
      { branchId: 4, revenue: 4800, margin: 1200, orders: 1 },
    ],
  },
  weekly: {
    totalRevenue: 142000,
    totalMargin: 35500,
    totalOrders: 38,
    branches: [
      { branchId: 1, revenue: 42000, margin: 10500, orders: 12 },
      { branchId: 2, revenue: 36000, margin: 9000, orders: 10 },
      { branchId: 3, revenue: 34000, margin: 8500, orders: 9 },
      { branchId: 4, revenue: 30000, margin: 7500, orders: 7 },
    ],
  },
  monthly: {
    totalRevenue: 568000,
    totalMargin: 142000,
    totalOrders: 156,
    branches: [
      { branchId: 1, revenue: 168000, margin: 42000, orders: 45 },
      { branchId: 2, revenue: 144000, margin: 36000, orders: 38 },
      { branchId: 3, revenue: 136000, margin: 34000, orders: 36 },
      { branchId: 4, revenue: 120000, margin: 30000, orders: 37 },
    ],
  },
};

export const distributorDeliveries = [
  { id: 1, date: '2025-06-15', items: [{ productId: 1, quantity: 100 }, { productId: 2, quantity: 80 }], receivedBy: 'Admin' },
  { id: 2, date: '2025-06-10', items: [{ productId: 3, quantity: 60 }, { productId: 4, quantity: 40 }], receivedBy: 'Admin' },
];

// Inventory transactions
export let inventoryTransactions = [];

export function getInventoryTransactions(itemId) {
  return inventoryTransactions.filter(t => t.itemId === itemId);
}

export function recordTransaction(data) {
  const transaction = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    fromBranchName: getBranchName(data.fromBranchId),
    toBranchName: getBranchName(data.toBranchId),
    ...data,
  };
  inventoryTransactions.push(transaction);
  return transaction;
}

// ----- HELPERS -----
export function getProduct(id) {
  return products.find((p) => p.id === id);
}

export function getBranch(id) {
  return branches.find((b) => b.id === id);
}

export function getBranchName(id) {
  const branch = branches.find((b) => b.id === id);
  return branch ? branch.name : 'Unknown';
}

export function getBranchStock(branchId, productId) {
  const item = branchStock.find((s) => s.branchId === branchId && s.productId === productId);
  return item ? item.quantity : 0;
}

export function getHqStock(productId) {
  const item = hqStock.find((s) => s.productId === productId);
  return item ? item.quantity : 0;
}

export function getCustomerByPhone(phone) {
  return customers.find((c) => c.phone === phone);
}

export function generateOrderId() {
  const num = orders.length + 1;
  return `ORD-${String(num).padStart(3, '0')}`;
}

export function addOrder(order) {
  orders = [order, ...orders];
  return order;
}

export function updateOrder(orderId, updates) {
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx !== -1) {
    orders[idx] = { ...orders[idx], ...updates };
    return orders[idx];
  }
  return null;
}

export function updateOrderStatus(orderId, updates) {
  return updateOrder(orderId, updates);
}

export function dispatchToBranch(branchId, productId, quantity) {
  const hq = hqStock.find((s) => s.productId === productId);
  if (hq) hq.quantity -= quantity;

  const branch = branchStock.find((s) => s.branchId === branchId && s.productId === productId);
  if (branch) {
    branch.quantity += quantity;
  } else {
    branchStock.push({ branchId, productId, quantity });
  }
}

export function receiveFromDistributor(items) {
  items.forEach(({ productId, quantity }) => {
    const hq = hqStock.find((s) => s.productId === productId);
    if (hq) {
      hq.quantity += quantity;
    } else {
      hqStock.push({ productId, quantity });
    }
  });
}

export function deductBranchStock(branchId, productId) {
  const branch = branchStock.find((s) => s.branchId === branchId && s.productId === productId);
  if (branch && branch.quantity > 0) {
    branch.quantity -= 1;
  }
}

// ----- NEW ORDER NOTIFICATION HELPERS -----
export function setOrderPhone(orderId, phone) {
  const order = updateOrder(orderId, {
    customerPhone: phone,
    dispatchSmsSent: true,
    dispatchSmsSentAt: new Date().toISOString(),
  });
  
  // Schedule payment link for 2 minutes later
  if (order) {
    schedulePaymentLink(orderId);
  }
  
  return order;
}

export function schedulePaymentLink(orderId) {
  const order = getOrderById(orderId);
  if (!order) return;
  
  const scheduledAt = new Date(Date.now() + 120000).toISOString();
  updateOrder(orderId, {
    paymentLinkScheduledAt: scheduledAt,
  });
  
  // Simulate 2-minute delay (using 3 seconds for demo)
  setTimeout(() => {
    const currentOrder = getOrderById(orderId);
    if (!currentOrder || currentOrder.paid) return;
    
    // 85% success rate for demo
    const success = Math.random() > 0.15;
    if (success) {
      updateOrder(orderId, {
        paymentLinkSent: true,
        paymentLinkSentAt: new Date().toISOString(),
        paymentLinkFailed: false,
      });
    } else {
      updateOrder(orderId, {
        paymentLinkFailed: true,
        paymentLinkSent: false,
      });
    }
  }, 3000); // 3 seconds for demo (real would be 120000)
}

export function sendStkPush(orderId) {
  return updateOrder(orderId, {
    stkSent: true,
    paymentLinkFailed: false,
  });
}

export function simulatePaymentCallback(orderId) {
  const order = getOrderById(orderId);
  if (!order) return null;
  
  const updated = updateOrder(orderId, {
    paid: true,
    paidAt: new Date().toISOString(),
    paymentLinkClicked: true,
    status: 'delivered',
    deliveredAt: new Date().toISOString(),
  });
  
  return updated;
}

export function getOrderById(id) {
  return orders.find((o) => o.id === id);
}

export function addBranch(name, location) {
  const newBranch = {
    id: branches.length + 1,
    name,
    location,
    color: ['#E53E3E', '#DD6B20', '#ED64A6', '#4299E1', '#48BB78', '#ECC94B', '#9F7AEA', '#FC8181'][branches.length % 8],
  };
  branches.push(newBranch);
  
  // Add stock for this branch
  products.forEach(product => {
    branchStock.push({ branchId: newBranch.id, productId: product.id, quantity: 0 });
  });
  
  return newBranch;
}

// Inventory data for the Inventory page
export const inventory = products.map(product => ({
  id: product.id,
  name: product.name,
  stock: branches.map(branch => ({
    branchId: branch.id,
    quantity: getBranchStock(branch.id, product.id)
  }))
}));