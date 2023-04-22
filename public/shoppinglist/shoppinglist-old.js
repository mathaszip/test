const form = document.querySelector("#itemForm");
const backdrop = document.querySelector("#backdrop");
let refIndex = undefined;
let canClick = true;

document.addEventListener("DOMContentLoaded", (e) => {
  loadShoppinglist();
  setTimeout(() => {
    loadPrices();
  }, 1000);
});

function handleClick() {
    if (canClick) {
      // Perform button click logic here
      loadPrices();
      // Disable button for 1 minute
      canClick = false;
      setTimeout(() => {
        canClick = true;
      }, 60000);
    }
  }
  

function loadPrices() {
  const pricePromises = [];
  const cells = document.querySelectorAll(".cell3");
  cells.forEach(cell => {
    const item = cell.parentNode;
    const pricePromise = fetch(`/api/productPrice?query=${item.querySelector("td:first-child").textContent}`, {})
      .then(response => response.json())
      .then(data => {
        const price = data.suggestions[0].price;
        cell.textContent = price.toFixed(2) + " kr";
        cell.style.cursor = "pointer";
        cell.addEventListener("click", () => {
          window.open(data.suggestions[0].link, "_blank");
        });
        cell.addEventListener("mouseover", () => {
          cell.setAttribute("title", "Origin: '" + data.suggestions[0].title + "' -> Click to view details");
        });
        return price * item.querySelector(".cell2").textContent;
      })
      .catch(error => console.error(error));
    pricePromises.push(pricePromise);
  });
  Promise.all(pricePromises)
    .then(prices => {
      let total = 0;
      prices.forEach(price => {
        total += price;
      });
      const totalCell = document.querySelector("#total-cell");
      totalCell.textContent = total.toFixed(2) + " kr";
    })
    .catch(error => console.error(error));
}

function loadShoppinglist() {
  fetch("/api/shoppingList")
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error("response was not in the 200 range " + response.Error)
    })
    .then(data => {
      const table = document.createElement("table");
      const headerRow = document.createElement("tr");
      const header1 = document.createElement("th");
      header1.textContent = "Product";
      headerRow.appendChild(header1);

      const header2 = document.createElement("th");
      header2.textContent = "Quantity";
      headerRow.appendChild(header2);

      const header3 = document.createElement("th");
      header3.textContent = "Price";
      headerRow.appendChild(header3);

      const header4 = document.createElement("th");
      
      header4.textContent = "";
      headerRow.appendChild(header4);

      table.appendChild(headerRow);

      data.forEach(item => {
        const row = document.createElement("tr");
        const cell1 = document.createElement("td");
        cell1.textContent = item.name;
        row.appendChild(cell1);

        const cell2 = document.createElement("td");
        cell2.className = "cell2";
        cell2.textContent = item.quantity;
        row.appendChild(cell2);

        const cell3 = document.createElement("td");
        cell3.className = "cell3";

        if (canClick === true) {
            cell3.style.cursor = "pointer";
        }
        else {
            cell3.style.cursor = "default";
        }

        
        cell3.textContent = "Click to reload";

        cell3.addEventListener("click", handleClick);

        row.appendChild(cell3);

        const cell4 = document.createElement("td");
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.onclick = () => {
          fetch(`/api/shoppingList/${item.id}`, {
              method: 'DELETE'
            })
            .then(response => {
              if (response.ok) {
                loadShoppinglist();
              }
            })
            .catch(error => console.error(error));
        };
        cell4.appendChild(deleteButton);

        const addToInventory = document.createElement("button");
        addToInventory.textContent = "Add to inventory";
        addToInventory.onclick = () => {
          addNewItem(item.name, item.id);
        };
        cell4.appendChild(addToInventory);

        row.appendChild(cell4);
        table.appendChild(row);
      });

      const totalRow = document.createElement("tr");
      const totalCell1 = document.createElement("td");
      totalCell1.textContent = "Total";
      totalCell1.style.fontWeight = "bold";
      totalRow.appendChild(totalCell1);

      const totalCell2 = document.createElement("td");
      totalRow.appendChild(totalCell2);

      const totalCell3 = document.createElement("td");
      totalCell3.id = "total-cell";
      totalCell3.textContent = "0 kr";
      totalCell3.style.fontWeight = "bold";
      totalRow.appendChild(totalCell3);

      const totalCell4 = document.createElement("td");
      totalRow.appendChild(totalCell4);

      table.appendChild(totalRow);

      const tableContainer = document.getElementById("shoppinglist");
      tableContainer.innerHTML = "";
      tableContainer.appendChild(table);
    })
    .catch(error => console.error(error));
}

const addItemForm = document.getElementById('shoppinglist-form');
addItemForm.addEventListener('submit', function(event) {
  event.preventDefault();
  const formData = new FormData(addItemForm);
  const quantityInput = formData.get('shoppinglist-amount');
  const parsedQuantity = parseInt(quantityInput);
  let itemData = {};

  if (!isNaN(parsedQuantity) && parsedQuantity >= 0 && parsedQuantity <= 1000) {
    itemData = {
      name: formData.get('shoppinglist-input'),
      quantity: parsedQuantity
    };
  } else {
    alert("Please enter a number between 1 and 1000 for the quantity.");
    return;
  }

  fetch('/api/shoppingList', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(itemData)
    })
    .then(response => response.json())
    .then(data => {
        loadShoppinglist();
    })
    .catch(error => {
      console.error(error);
      loadShoppinglist();
    });
});

function addNewItemToPersonalList(itemId) {
  if (refIndex === undefined) {
    let data = {
      "location": form.location.value,
      "name": form.name.value,
      "expirationDate": form.expirationDate.value
    };
    fetch("/API/postlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })
      .then(response => {
        if (response.ok) {
          fetch(`/api/shoppingList/` + itemId, {
              method: 'DELETE'
            })
            .then(response => {
              if (response.ok) {
                loadShoppinglist();
              }
            })
        } else {
          throw new Error("Error adding item to personal list");
        }
      })
      .catch(error => {
        console.error(error);
        alert("Error adding item to personal list");
      });
  }
}

function addNewItem(itemName, itemId) {
  form.classList.toggle("visible");
  if (backdrop.style.display === "block") {
    backdrop.style.display = "none";
  } else {
    backdrop.style.display = "block";
  }

  document.getElementById("name").value = itemName;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    addNewItemToPersonalList(itemId);
    addNewItem();
  });
}

backdrop.addEventListener("click", (e) => {
  addNewItem();
  refIndex = undefined;
});