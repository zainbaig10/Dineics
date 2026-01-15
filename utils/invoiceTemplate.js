export const generateInvoiceHTML = (order, restaurant) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice ${order.invoiceNumber}</title>
  <style>
    body {
      font-family: Arial;
      margin: 0;
      padding: 16px;
    }
    .center { text-align: center; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th, td {
      border-bottom: 1px dashed #ccc;
      padding: 6px;
      text-align: left;
    }
    .total {
      font-weight: bold;
      font-size: 16px;
    }
    @media print {
      body { margin: 0; }
    }
  </style>
</head>

<body>
  <div class="center">
    <h2>${restaurant.name}</h2>
    <p>${restaurant.address}</p>
    <p>Phone: ${restaurant.phone}</p>
  </div>

  <hr />

  <p>
    <b>Invoice:</b> ${order.invoiceNumber}<br/>
    <b>Date:</b> ${new Date(order.createdAt).toLocaleString()}<br/>
    <b>Payment:</b> ${order.paymentMode}
  </p>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Qty</th>
        <th>Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${order.items
        .map(
          (i) => `
        <tr>
          <td>${i.name}</td>
          <td>${i.quantity}</td>
          <td>${i.price}</td>
          <td>${i.total}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <hr />

  <p>Subtotal: ₹${order.subtotal}</p>
  ${
    order.taxAmount > 0
      ? `<p>${order.taxType}: ₹${order.taxAmount}</p>`
      : ""
  }
  <p class="total">Grand Total: ₹${order.grandTotal}</p>

  <hr />
  <p class="center">Thank you 🙏</p>

  <script>
    window.print();
  </script>
</body>
</html>
`;
};
