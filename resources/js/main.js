
pageSize = 0; // default

// Set options to use in ititializing the grid
var gridOptions = {
  animateRows: true,
  rowSelection: 'multiple',
  pagination: true,
  enterMovesDownAfterEdit: false,
  stopEditingWhenGridLosesFocus: true,
  paginationPageSize: pageSize,
  onGridReady: gridReady,
  onCellValueChanged: cellValueChanged,

  // defines default column properties that are inherited
  // by default by any new columns
  defaultColDef: {
    editable: true,
    resizable: true,
  },

  columnDefs:[{
    headerName: "Plan Name",
    field: "planName",
    colId: "planName",
  }]
};

initGrid(gridOptions);

// Initialize the grid with column definitions and row data
function initGrid() {
  // Find the grid div element in index.html
  var eGridDiv = document.querySelector('#grid');
  var tableHeader = document.querySelector('#tableHeader');
  //var name = document.getElementById('#newPlanName').value;
  var name2 = 'aziz';
  $(tableHeader).text("Pivot Name " + name2 );

  // Create the grid passing in the div to use together with the columns & data we want to use
  new agGrid.Grid(eGridDiv, gridOptions);


  // Download the chosen plan's data and load into grid
  loadPlan(localStorage.getItem('planToLoad'));
  localStorage.clear();
}

function loadPlanNames(plans){
  for(i = 0; i < plans.length; i++){
    var rowData = '[{"planName": "' + plans[i] + '"}]';
    gridOptions.api.updateRowData({add: JSON.parse(rowData)});
  }
}

// Executes after data is finished being loaded into grid
function gridReady() {
  console.log("Data successfully loaded into grid");
  gridOptions.columnApi.autoSizeColumns();
  updatePlanList();
}

// Executes after a cell is edited, used to check if
// propogate mode is enabled and if so, automatically
// edits all rows in that position for all pages
function cellValueChanged(event) {
  propagateForwardMode = document.getElementById("propagateForward").checked;
  propagateBackwardMode = document.getElementById("propagateBackward").checked;

  // Gets the name of the column that was edited and that row's index in the grid
  colEdited = event.column.colId;
  editIndex = event.node.childIndex;

  console.log("Edit index: "+editIndex);

  // Propagate cell edits forward if enabled
  if(propagateForwardMode) {
    // For indexes *ahead* of the edited cell, propagate changes if the ID datavalues match
    gridOptions.api.forEachNode( function(rowNode, index) {
      if(rowNode.data.ID == event.data.ID && index >= editIndex) {
          rowNode.data[colEdited] = event.data[colEdited];
      }
    });
  }

  // Propagate cell edits backward if enabled
  if(propagateBackwardMode) {
    // For indexes *behind* the edited cell, propagate changes if the ID datavalues match
    gridOptions.api.forEachNode( function(rowNode, index) {
      if(rowNode.data.ID == event.data.ID && index <= editIndex) {
          rowNode.data[colEdited] = event.data[colEdited];
      }
    });
  }
}

// Gets all rows across pages at a relative location, representing
// one entity across what would likely be dates (whatever is being
// represented by pages).
function getRowAcrossPages(row) {
  // Get the index for the selected row
  var index = row.childIndex;
  console.log("Row is at index: "+index);

  // Find the "relative" row location for each page and remove rows
  // from page 1 onward
  index = index % pageSize;
}

function numOfRows() {
  rows = 0;
  gridOptions.api.forEachNode(function(rowNode, index) {
    rows = rows + 1;
  });
  return rows;
}

function addRow() {
  // Calculate the number of "pages" for the grid
  // For application, these probably represent months
  numOfPages = (numOfRows()) / pageSize;
  t = 0;

  // Create a random ID number for the row, consistent across pages
  var newRow = {
    ID: randRange(10000000, 99999999)
  };

  // Add a new row to each page at incrementing index (see below)
  for(i = 1; i <= numOfPages; i++) {
    index = (pageSize * i) + t; // to insert at same relative pos. for each page
    addRowAtIndex(index, newRow);
    t += 1; // increment at each page to account for the new row
  }
  // Increment the number of rows to show per page and update grid
  pageSize += 1;
  gridOptions.api.paginationSetPageSize(Number(pageSize));
}

// When multiple pages exist, must add row at same relative
// index for each page
function addRowAtIndex(index, newRow) {
  gridOptions.api.updateRowData({add: [newRow], addIndex: index});
}

function getRowAtIndex(targetIndex, callback) {
  gridOptions.api.forEachNode( function(rowNode, index) {
    if(targetIndex == index) {
        callback(rowNode);
    }
  });
}

function removeRowAtIndex(targetIndex) {
  gridOptions.api.forEachNode( function(rowNode, index) {
    if(rowNode.index == targetIndex) {
        console.log("Removing row "+index);
        gridOptions.api.updateRowData({remove: [rowNode.data]});
    }
  });
}

// Callback function to receive the selected node for removal
function getSelectedRowToRemove(callback) {
  var selectedRow = gridOptions.api.getSelectedNodes();
  callback(selectedRow);
}

// Removes a selected row across all pages
// WARNING: Currently does not work properly, disabled.
function removeRow(selectedRow) {
  
  var row;
  getSelectedRowToRemove(function(selectedRow) {
    row = selectedRow[0]; // Since row selection is set to singlular, we only want the first
  })                      // element in the list of selected rows
  
  //console.log(selectedRow)
  // Get the index for the selected row
  var index = row.childIndex;
  
  console.log("Row is at index: "+index);

  // Find the "relative" row location for each page and remove rows
  // from page 1 onward
  //index = index % pageSize;
  

  // Calculate number of *full* pages in the plan
  numOfPages = Math.floor((numOfRows()) / pageSize);


  for(i = 1; i <= numOfPages; i++) {
    console.log("deleting rows " + index)
    console.log("deleting rowID " + selectedRow)
    //console.log("row Data: " + selectedRow.data)
    removeRowAtIndex(index);
    index = (index + pageSize + i);
    
  }

  // Decrement the number of rows to show per page and update grid
  pageSize -= 1;
  gridOptions.api.paginationSetPageSize(Number(pageSize));
  gridOptions.api.refreshCells();
  
}

function editHeaderName() {
  // Gets the header to edit and the new name from input fields
  var headerList = document.getElementById("headerList");
  var selectedHeader = headerList.options[headerList.selectedIndex].value;
  var newName = document.getElementById("newHeader").value;

  //Preserves all data under the old headername to resave after changes
  savedData = [];
  gridOptions.api.forEachNode(function(rowNode, index) {
    console.log(rowNode.data[selectedHeader]);
    savedData.push(rowNode.data[selectedHeader]);
  });

  var col = gridOptions.columnApi.getColumn(selectedHeader);
  col.colDef.headerName=newName;
  col.colDef.field=newName;

  updateColumnList(); // reloads list of columns in the editor widget

  gridOptions.api.refreshHeader();

  // Reloads data from old header name into new header name and refreshes cells
  gridOptions.api.forEachNode(function(rowNode, index) {
    rowNode.data[newName] = savedData[index];
    console.log("For node" + index);
    console.log(rowNode.data[newName]);
  });

  gridOptions.api.refreshCells();
}

// Exports the grid's row data as a CSV string
function exportCSV() {
  return gridOptions.api.getDataAsCsv();
}

// Returns list of column definitions
function getColumnDefs() {
  var columns = gridOptions.columnApi.getAllColumns();
  colDefs = [];
  columns.forEach(function(col) {
    colDefs.push(col.colDef);
  });
  //console.log(colDefs);
  return colDefs;
}

// Populate the grid with data passed in via a JSON file
function loadPlanData(file) { //callback from downloadFile
  gridOptions.api.setRowData(JSON.parse(file));
}

function loadPlanDef(file) { //callback from downloadFile
  gridOptions.api.setColumnDefs(JSON.parse(file).columns);
}

function loadPlanProp(file) {
  props = JSON.parse(file);
  pageSize = props.pageSize;
  gridOptions.api.paginationSetPageSize(Number(pageSize));
}

function randRange(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}

// Grid toggle button
$('#toggleGrid').click(function() {
  $('#tableContainer').toggle('slow', function() {
    if ($('#tableContainer').is(":visible")) {
      console.log("Grid unhidden!");
    } else {
      console.log("Grid hidden!");
    }
  });
});

// Superuser controls toggle button
$('#toggleSuperuserControls').click(function() {
  $('#superuserControls').toggle(200, function() {
    if ($('#superuserControls').is(":visible")) {
      updateColumnList();
      console.log("Super user controls visible");
    } else {
      console.log("Super user controls hidden");
    }
  });
});

function updatePlanList() {
  // Loads list of plans to load from
  plans = [];
  s3.listObjects({ Prefix: "plans/" }, function(err, data) { //function() is a callback (ASYNC!!!)
    if (err) {
      return alert("There was an error getting the list of plans");
    }
    plans = [];
    var items = (data.Contents.length);
    //i=0 is root folder name "plans/", so we exclude. Every 4th entry after is
    //a folder that represents a saved plan
    for(i=1; i<items; i+=4) {
      planName = data.Contents[i].Key;

      // Trim path out of plan name ('plan/' is first 6 chars, '/' is last char)
      planName = planName.substring(6, planName.length-1);
      plans.push(planName);
    }

    // Populates the list with the plans retrieved from s3.listObjects API call
    $('#planList').empty();
    $.each(plans, function(i, p) {
        $('#planList').append($('<option></option>').val(p).html(p));
    });
  });
}

// Loads column headers into colHeaders and puts into dropdown list selectHeader
function updateColumnList() {
  var columns = gridOptions.columnApi.getAllColumns();
  $('#headerList').empty();
  colHeaders = [];
  columns.forEach(function(col) {
    colHeaders.push(col.colDef.headerName);
  });
  $.each(colHeaders, function(i, p) {
      $('#headerList').append($('<option></option>').val(p).html(p));
  });
}

function setCurrentPlan(newCurrentPlan) {
  currentPlan = newCurrentPlan;
}

function getCurrentPlan() {
  return currentPlan;
}

function getPageSize() {
  return pageSize;
}
