
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const productSelect = document.getElementById("productSelect");
  const customItemFields = document.getElementById("customItemFields");
  const customItemName = document.getElementById("customItemName");
  const customItemPrice = document.getElementById("customItemPrice");
  const itemQuantity = document.getElementById("itemQuantity");
  const customerName = document.getElementById("customerName");
  const billItems = document.getElementById("billItems");
  const billTotal = document.getElementById("billTotal");
  const printInvoice = document.getElementById("printInvoice");
  const addItemButton = document.getElementById("addItemButton");
  const printBillButton = document.getElementById("printBillButton");
  const clearBillButton = document.getElementById("clearBillButton");

  const requiredElements = [
    productSelect,
    customItemFields,
    customItemName,
    customItemPrice,
    itemQuantity,
    customerName,
    billItems,
    billTotal,
    printInvoice,
    addItemButton,
    printBillButton,
    clearBillButton
  ];

  if (requiredElements.some(element => !element)) {
    console.error("Billing page: One or more required HTML elements are missing.");
    return;
  }

  let cart = [];

  function formatMoney(amount) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  function getTotal() {
    return cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }

  function showCustomFields() {
    const customSelected = productSelect.value === "Others";
    customItemFields.hidden = !customSelected;

    customItemName.required = customSelected;
    customItemPrice.required = customSelected;

    if (customSelected) {
      customItemName.focus();
    }
  }

  function renderCart() {
    billItems.replaceChildren();

    if (cart.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "bill-empty";
      emptyMessage.textContent = "No items added yet.";
      billItems.appendChild(emptyMessage);
    } else {
      cart.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "cart-row";

        const details = document.createElement("div");
        const name = document.createElement("div");
        const description = document.createElement("div");

        name.className = "cart-name";
        name.textContent = item.name;

        description.className = "cart-detail";
        description.textContent =
          `${item.quantity} × ${formatMoney(item.price)}`;

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "btn btn-danger btn-sm";
        removeButton.textContent = "Remove";
        removeButton.setAttribute("aria-label", `Remove ${item.name}`);

        removeButton.addEventListener("click", () => {
          cart.splice(index, 1);
          renderCart();
        });

        details.append(name, description, removeButton);

        const price = document.createElement("div");
        price.className = "cart-price";
        price.textContent = formatMoney(item.price * item.quantity);

        row.append(details, price);
        billItems.appendChild(row);
      });
    }

    billTotal.textContent = formatMoney(getTotal());
  }

  function addItem() {
    const quantity = Number(itemQuantity.value);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
      alert("Enter a quantity between 1 and 999.");
      itemQuantity.focus();
      return;
    }

    let name = "";
    let price = 0;

    if (productSelect.value === "Others") {
      name = customItemName.value.trim();
      price = Number(customItemPrice.value);

      if (!name) {
        alert("Enter the item name.");
        customItemName.focus();
        return;
      }

      if (
        !Number.isFinite(price) ||
        price <= 0 ||
        price > 1000000
      ) {
        alert("Enter a valid item price.");
        customItemPrice.focus();
        return;
      }
    } else {
      const selectedOption = productSelect.selectedOptions[0];

      if (!selectedOption || !selectedOption.dataset.price) {
        alert("Please select a food item.");
        productSelect.focus();
        return;
      }

      name = selectedOption.value;
      price = Number(selectedOption.dataset.price);
    }

    const existingItem = cart.find(
      item => item.name === name && item.price === price
    );

    if (existingItem) {
      if (existingItem.quantity + quantity > 999) {
        alert("Maximum quantity per item is 999.");
        return;
      }

      existingItem.quantity += quantity;
    } else {
      cart.push({ name, price, quantity });
    }

    itemQuantity.value = "1";

    if (productSelect.value === "Others") {
      customItemName.value = "";
      customItemPrice.value = "";
      customItemFields.hidden = true;
      customItemName.required = false;
      customItemPrice.required = false;
      productSelect.value = "";
    }

    renderCart();
  }

  function clearBill() {
    if (cart.length > 0 && !window.confirm("Clear this bill?")) {
      return;
    }

    cart = [];
    customerName.value = "";
    itemQuantity.value = "1";
    productSelect.value = "";
    customItemName.value = "";
    customItemPrice.value = "";
    customItemFields.hidden = true;
    customItemName.required = false;
    customItemPrice.required = false;
    printInvoice.replaceChildren();

    renderCart();
  }

  function createInvoice() {
    if (cart.length === 0) {
      alert("Add at least one item before generating an invoice.");
      productSelect.focus();
      return;
    }

    const invoiceNumber = `DEMO-${Date.now()}`;
    const invoiceDate = new Date().toLocaleString("en-IN");
    const total = getTotal();
    const customer = customerName.value.trim() || "Walk-in customer";

    printInvoice.replaceChildren();

    const heading = document.createElement("h1");
    heading.textContent = "[Restaurant Name]";

    const subtitle = document.createElement("p");
    subtitle.textContent = "Invoice";

    const metadata = document.createElement("div");
    metadata.className = "invoice-meta";

    const invoiceNumberRow = document.createElement("div");
    invoiceNumberRow.textContent = `Invoice No: ${invoiceNumber}`;

    const dateRow = document.createElement("div");
    dateRow.textContent = `Date: ${invoiceDate}`;

    const customerRow = document.createElement("div");
    customerRow.textContent = `Customer: ${customer}`;

    metadata.append(invoiceNumberRow, dateRow, customerRow);

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    ["Item", "Qty", "Price", "Amount"].forEach(label => {
      const th = document.createElement("th");
      th.textContent = label;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);

    const tbody = document.createElement("tbody");

    cart.forEach(item => {
      const row = document.createElement("tr");

      [
        item.name,
        String(item.quantity),
        formatMoney(item.price),
        formatMoney(item.price * item.quantity)
      ].forEach(value => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });

      tbody.appendChild(row);
    });

    table.append(thead, tbody);

    const totalElement = document.createElement("div");
    totalElement.className = "invoice-total";
    totalElement.textContent = `Total: ${formatMoney(total)}`;

    const thanks = document.createElement("p");
    thanks.textContent = "Thank you. Please visit again.";

    printInvoice.append(
      heading,
      subtitle,
      metadata,
      table,
      totalElement,
      thanks
    );

    window.print();
  }

  productSelect.addEventListener("change", showCustomFields);
  addItemButton.addEventListener("click", addItem);
  printBillButton.addEventListener("click", createInvoice);
  clearBillButton.addEventListener("click", clearBill);

  renderCart();
});
