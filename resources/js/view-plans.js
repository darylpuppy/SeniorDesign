
// Set options to use in ititializing the grid
var gridOptions = {
  animateRows: true,
  rowSelection: 'single',
  pagination: true,
  paginationPageSize: 50,

  // defines default column properties that are inherited
  // by default by any new columns
  defaultColDef: {
    editable: true,
    resizable: true,
    filter: true,
    sortable: true,
    width: 450,
  },

  columnDefs:[{
    headerName: "Plan Name",
    field: "planName",
    colId: "planName"
  }]
};

// these variables are for creating plans
var planToLoad = "";
var planToDelete = "";
var planNameToCreate = "";
var columnDefinitions = [];
var rowDefinitions = [];
var emptyRow = {};

// the first 4 columns are hard coded
var idDef = {
  "editable": true,
  "resizable": true,
  "filter": false,
  "sortable": false,
  "headerName": "ID",
  "field": "ID",
  "colID": "ID"
};
var countDef = {
  "editable": true,
  "resizable": true,
  "filter": false,
  "sortable": false,
  "headerName": "Count",
  "field": "Count",
  "colID": "Count"
};
// delete these two maybe
var typeDef = {
  "editable": true,
  "resizable": true,
  "filter": false,
  "sortable": false,
  "headerName": "Type",
  "field": "Type",
  "colID": "Type"
};
var locationDef = {
  "editable": true,
  "resizable": true,
  "filter": false,
  "sortable": false,
  "headerName": "Location",
  "field": "Location",
  "colID": "Location"
}

emptyRow["ID"] = randRange(10000000, 99999999);
emptyRow["Count"] = "";
emptyRow["Location"] = "";
emptyRow["Type"] = "";

columnDefinitions.push(idDef);
columnDefinitions.push(countDef);
columnDefinitions.push(locationDef);
columnDefinitions.push(typeDef);

rowDefinitions.emptyRow = emptyRow;

initGrid(gridOptions);

// Initialize the grid with column definitions and row data
function initGrid() {
  // Find the grid div element in index.html
  var eGridDiv = document.querySelector('#grid');

  // Create the grid passing in the div to use together with the columns & data we want to use
  new agGrid.Grid(eGridDiv, gridOptions);

  // Download a the plan names from s3 and load into grid
  downloadPlanDefs();
}

// create handler function
function cellClicked(event) {
    planToLoad = event.value;
    planToDelete = event.value;
    console.log(planToLoad);
    localStorage.setItem("planToLoad", planToLoad);
}
// add the handler function
gridOptions.api.addEventListener('cellClicked', cellClicked);

// Create new plan
$('#createNewPlan').click(function() {
  $('#newPlan').toggle('normal', function() {
    if ($('#newPlan').is(":visible")) {
      console.log("Creating new plan");
    } else {
      console.log("Creating new plan");
    }
  });
});

$(".addCol").click(function() {
    $("#columnForm > p:first-child").clone(true).insertBefore("#columnForm > p:last-child");
    return false;
});

$(".removeCol").click(function() {
    $(this).parent().remove();
});

$(".addPage").click(function() {
    $("#pagesForm > p:first-child").clone(true).insertBefore("#pagesForm > p:last-child");
    return false;
});

$(".removePage").click(function() {
    $(this).parent().remove();
});

function createNewPlan() {
    if(sessionStorage.getItem("permission") === "S"){
      // getting all the plan data from the html form
      var columnElements = document.getElementById("columnForm").elements;
      var pageElements = document.getElementById("pagesForm").elements;
      planNameToCreate = document.getElementById("newPlanName").value;
      // creating a JSON object out of columnDefinitions, will have to tweak
      // after implementing pages
      for(var i = 0 ; i < columnElements.length; i++) {
          if(columnElements.item(i).value) {
            var columnInfo = {
              "editable": true,
          		"resizable": true,
          		"filter": false,
          		"sortable": false,
              "headerName": columnElements.item(i).value,
              "field": columnElements.item(i).value,
              "colID": columnElements.item(i).value
            };
            columnDefinitions.push(columnInfo);
            emptyRow[columnElements.item(i).value] = "";
          }
      }
      // Eliminate remove buttons and add page button from total element count
      numOfPages = (pageElements.length/2)-1;
      // Creates an empty row on each page
      for(var i = 0 ; i < numOfPages; i++) {
          rowDefinitions.push(emptyRow); // add an empty row to each page
      }
      rowDefinitions = JSON.stringify(rowDefinitions);
      columnDefinitions = JSON.stringify(columnDefinitions);

      uploadNewPlan(rowDefinitions, columnDefinitions);
    }
    else {
      alert("You do not have permission to create a plan");
    }
}

function manageUsers(){
    location.href = './manage-users.html';
}

function deletePlan(){
  if(sessionStorage.getItem("permission") === "S"){
    var rowToDelete = gridOptions.api.getSelectedRows();
    deletePlanFolder(planToDelete, rowToDelete);
  }
  else {
    alert("You do not have permission to delete plans");
  }

}

function setCurrentPlan(newCurrentPlan) {
  currentPlan = newCurrentPlan;
}

function getPlanNameToCreate() {
  return planNameToCreate;
}

function getColumnDefinitions(){
  return columnDefinitions;
}

function getEmptyRow(){
  return rowDefinitions;
}

function randRange(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}
