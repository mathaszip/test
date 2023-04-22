const form = document.querySelector("#itemForm");
const backdrop = document.querySelector("#backdrop");
const addItemForm = document.getElementById('shoppinglist-form');
let refIndex = undefined;
let canClick = true;

document.addEventListener("DOMContentLoaded", (e) => {
  loadShoppinglist();
});

addItemForm.addEventListener('submit', function(event) {
  event.preventDefault();
  searchData = null; //Clear cached data
  searchList();
});

function loadShoppinglist() {
  fetch("/API/shoppingList/getList")
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

      const header3 = document.createElement("th");
      header3.textContent = "Price";
      headerRow.appendChild(header3);

      const header4 = document.createElement("th");

      header4.textContent = "";
      headerRow.appendChild(header4);

      table.appendChild(headerRow);

      let total = 0;

      data.forEach(item => {
        const row = document.createElement("tr");
        const cell1 = document.createElement("td");
        cell1.textContent = item.name;
        row.appendChild(cell1);

        const cell3 = document.createElement("td");
        cell3.className = "cell3";
        cell3.textContent = item.price.toFixed(2) + " kr";

        total += item.price;


        row.appendChild(cell3);



        const cell4 = document.createElement("td");

        const checkButton = document.createElement("input");
        checkButton.type = "checkbox";
        checkButton.className = "css-checkbox";
        checkButton.id = `checkbutton-${item.id}`;
        
        const label = document.createElement("label");
        label.htmlFor = checkButton.id;
        
        if (item.bought === true) {
          checkButton.checked = true;
        }
        
        checkButton.onclick = () => {
          fetch(`/API/shoppingList/checkItem/${item.id}`, {
            method: 'POST'
          })
          .then(response => {
            if (response.ok) {
              loadShoppinglist();
            }
          })
          .catch(error => console.error(error));
        };
        
        cell4.appendChild(checkButton);
        cell4.appendChild(label);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.onclick = () => {
          console.log(item.id); // add this line to check the item ID
          fetch(`/API/shoppingList/deleteItem/${item.id}`, {
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


      const totalCell3 = document.createElement("td");
      totalCell3.id = "total-cell";
      totalCell3.textContent = total.toFixed(2) + " kr";
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

let searchData = null;

function searchList() {
  const formData = new FormData(addItemForm);

  const itemData = {
    name: formData.get('shoppinglist-input')
  }

  if (searchData) {
    // Use cached data
    createTable(searchData);
  } else {
    // Set loading state
    const tableContainer = document.getElementById("shoppinglist-search");
    tableContainer.innerHTML = '<p>Loading...</p>';

    // Fetch new data
    fetch(`/API/shoppingList/getProductPrices?query=${itemData.name}`)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error("Response was not in the 200 range " + response.Error)
      })
      .then(data => {
        searchData = data;
        createTable(data);
      })
      .catch(error => {
        console.error(error);
      });
  }
}

function createTable(data) {
  // Remove old table
  const tableContainer = document.getElementById("shoppinglist-search");
  while (tableContainer.firstChild) {
    tableContainer.removeChild(tableContainer.firstChild);
  }

  // Create table element
  const table = document.createElement("table");

  // Create header row
  const headerRow = document.createElement("tr");
  const header1 = document.createElement("th");
  header1.textContent = "Product name";
  headerRow.appendChild(header1);

  const header2 = document.createElement("th");
  header2.textContent = "Price";
  headerRow.appendChild(header2);

  const header3 = document.createElement("th");
  header3.textContent = "Image";
  headerRow.appendChild(header3);

  const header4 = document.createElement("th");
  header4.textContent = "";
  headerRow.appendChild(header4);

  // Add header row to table
  table.appendChild(headerRow);

  // Loop through data and create rows
  data.suggestions.forEach(item => {
    const rowData = {
      name: item.title,
      price: item.price
    };

    const row = document.createElement("tr");
    const cell1 = document.createElement("td");
    cell1.textContent = item.title;
    cell1.style.cursor = "pointer";
    cell1.addEventListener("click", () => {
      window.open(item.link, "_blank");
    });
    row.appendChild(cell1);

    const cell2 = document.createElement("td");
    cell2.textContent = item.price.toFixed(2) + " kr";
    row.appendChild(cell2);

    const cell3 = document.createElement("td");
    const img = document.createElement("img");
    img.src = item.img;
    cell3.appendChild(img);
    row.appendChild(cell3);

    const cell4 = document.createElement("td");
    const addButton = document.createElement("button");
    addButton.textContent = "Add";
    addButton.onclick = () => {
      fetch('/API/shoppingList/addNewItem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rowData)
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('There was an error adding the item to the shopping list.');
          }
          // Remove old table
          while (table.firstChild) {
            table.removeChild(table.firstChild);
          }
          // Clear cached data
          searchData = null;

          loadShoppinglist();
        })
        .catch(error => {
          console.error(error);
        });
    };
    cell4.appendChild(addButton);
    row.appendChild(cell4);

    table.appendChild(row);
  })

  // Append table to the DOM
  tableContainer.appendChild(table);
}

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