
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const productForm = document.getElementById("productForm");
  const productName = document.getElementById("productName");
  const productPrice = document.getElementById("productPrice");
  const productSearch = document.getElementById("productSearch");
  const productList = document.getElementById("productList");
  const productMessage = document.getElementById("productMessage");

  if (
    !productForm ||
    !productName ||
    !productPrice ||
    !productSearch ||
    !productList ||
    !productMessage
  ) {
    console.error("Menu page: Required HTML elements are missing.");
    return;
  }

  // Temporary demo data. Firebase integration will replace this array.
  let products = [];
  let nextProductId = 1;

  function formatMoney(amount) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  function showMessage(message, isError = false) {
    productMessage.textContent = message;
    productMessage.classList.toggle("text-danger", isError);
    productMessage.classList.toggle("text-success", !isError);
  }

  function renderProducts() {
    const searchTerm = productSearch.value.trim().toLowerCase();

    const filteredProducts = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm)
    );

    productList.replaceChildren();

    if (filteredProducts.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");

      cell.colSpan = 3;
      cell.textContent = products.length === 0
        ? "No menu items yet. Add your first item above."
        : "No matching items found.";

      row.appendChild(cell);
      productList.appendChild(row);
      return;
    }

    filteredProducts.forEach(product => {
      const row = document.createElement("tr");

      const nameCell = document.createElement("td");
      nameCell.textContent = product.name;

      const priceCell = document.createElement("td");
      priceCell.textContent = formatMoney(product.price);

      const actionCell = document.createElement("td");
      const deleteButton = document.createElement("button");

      deleteButton.type = "button";
      deleteButton.className = "btn btn-danger btn-sm";
      deleteButton.textContent = "Delete";
      deleteButton.setAttribute(
        "aria-label",
        `Delete ${product.name}`
      );

      deleteButton.addEventListener("click", () => {
        const confirmed = window.confirm(
          `Delete "${product.name}" from this demo menu?`
        );

        if (!confirmed) return;

        products = products.filter(item => item.id !== product.id);
        showMessage("Menu item deleted from this demo.");
        renderProducts();
      });

      actionCell.appendChild(deleteButton);
      row.append(nameCell, priceCell, actionCell);
      productList.appendChild(row);
    });
  }

  productForm.addEventListener("submit", event => {
    event.preventDefault();

    const name = productName.value.trim();
    const price = Number(productPrice.value);

    if (!name) {
      showMessage("Please enter the item name.", true);
      productName.focus();
      return;
    }

    if (
      !Number.isFinite(price) ||
      price <= 0 ||
      price > 1000000
    ) {
      showMessage("Enter a valid price greater than zero.", true);
      productPrice.focus();
      return;
    }

    const duplicate = products.some(
      product => product.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
      showMessage("This item already exists in the menu.", true);
      productName.focus();
      return;
    }

    products.push({
      id: nextProductId++,
      name,
      price
    });

    productForm.reset();
    showMessage("Item added to the demo menu.");
    renderProducts();
    productName.focus();
  });

  productSearch.addEventListener("input", renderProducts);

  renderProducts();
});
