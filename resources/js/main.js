
pageSize = 0; // default

// Set options to use in ititializing the grid
var gridOptions = {
  animateRows: true,
  rowSelection: 'multiple',
  pagination: false,
  enterMovesDownAfterEdit: false,
  stopEditingWhenGridLosesFocus: true,
	paginationAutoPageSize: true,
  onGridReady: gridReady,

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

var allData, pivotColumn, columnDefs, baseColumnOptions = [], aggregationProperty, initialValues, groupProps;

initGrid(gridOptions);

// Initialize the grid with column definitions and row data
function initGrid() {
  // Find the grid div element in index.html
  var eGridDiv = document.querySelector('#grid');
  var tableHeader = document.querySelector('#tableHeader');

  // Create the grid passing in the div to use together with the columns & data we want to use
  new agGrid.Grid(eGridDiv, gridOptions);


  // Download the chosen plan's data and load into grid
  var location = window.location.href;
  loadPlan(localStorage.getItem('planToLoad'), location.endsWith("grid.html"));
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
  gridOptions.columnApi.autoSizeColumns();
  updatePlanList();
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

function moveForward(){
	if (this.selectedPivot < this.pivotColumn.types.length - 1){
		this.selectedPivot++;
		this.savePlan();
		updatePivotValue();
    }
}

function moveBackward(){
	if (this.selectedPivot > 0){
		this.selectedPivot--;
		this.savePlan();
		updatePivotValue();
	}
}

function updatePivotValue(){
	gridOptions.api.setRowData(this.allData[this.selectedPivot].pageData);
	$("#pivotValue").text(this.pivotColumn.types[this.selectedPivot]);
}

function addRow() {
  // Calculate the number of "pages" for the grid
  // For application, these probably represent months
  //numOfPages = (numOfRows()) / pageSize;
  t = 0;

  // Create a random ID number for the row, consistent across pages
  var newRow = {
    ID: randRange(10000000, 99999999)
  };
  // Add a new row to each page at incrementing index (see below)
  index = i ; // to insert at same relative pos. for each page
  addRowAtIndex(index, newRow);


  // Increment the number of rows to show per page and update grid
}

//iterates through pivot columns to add rows to each pivot
function addRowAtIndex(index, newRow) {
  gridOptions.api.updateRowData({add: [newRow], addIndex: index});
  
  temp = this.selectedPivot;
  for (this.selectedPivot = 0; this.selectedPivot < this.pivotColumn.types.length; this.selectedPivot++){
    updatePivotValue();
    gridOptions.api.updateRowData({add: [newRow], addIndex: index});
    console.log('Added Rows');
    this.savePlanButton(false);
    
  }
  this.selectedPivot = temp;
  updatePivotValue();  
}

function removeRowAtIndex(targetIndex) {
  //console.log("Attempting Removing row "+targetIndex);
  let temp = 0;
  gridOptions.api.forEachNode( function(rowNode, index) {
    if(temp == targetIndex) {
        //console.log("Removing row "+index);
        gridOptions.api.updateRowData({remove: [rowNode.data]});
    }
    temp++
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

  // Get the index for the selected row
  var index = row.childIndex;
  console.log("Row is at index: "+ index);

  console.log("Removing row "+index);

  temp = this.selectedPivot;
  for (this.selectedPivot = 0; this.selectedPivot < this.pivotColumn.types.length; this.selectedPivot++){
    updatePivotValue();
    removeRowAtIndex(index);
    console.log('removed Rows');
    this.savePlanButton(false);
    gridOptions.api.refreshCells();
  }
  this.selectedPivot = temp;
  updatePivotValue();


  
  // Decrement the number of rows to show per page and update grid
  //gridOptions.api.paginationSetPageSize(Number(pageSize));
  

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
  return colDefs;
}

// Populate the grid with data passed in via a JSON file
function loadPlanData(file, isDataView) { //callback from downloadFile
	this.allData = file;
	if (isDataView){
		gridOptions.api.setRowData(this.allData[0].pageData);
	}
	else{
		this.aggregateData();
	}
}

function loadPlanDef(file, isDataView) { //callback from downloadFile
	this.columnDefs = file.columns;
	this.pivotColumn = file.pivotColumn;
	var editable = !file.readWriteUsers
		|| file.readWriteUsers.some((user) => user == "Everyone" || user == sessionStorage.getItem("email"));
	if (isDataView){
		for (var columnDef of this.columnDefs){
			delete columnDef.field;
			columnDef.valueGetter = function(params){
				return params.data[params.colDef.colID];
			};
			columnDef.valueSetter = function(params){
				var newVal;
				if (params.colDef.type == 0){
					try{
						newVal = Number(params.newValue);
						if (!Number.isInteger(newVal)){
							return false;
						}
					}
					catch(err){
						return false;
					}
				}
				else if (params.colDef.type == 1){
					try{
						newVal = Number(params.newValue);
						if (Number.isNaN(newVal)){
							return false;
						}
					}
					catch(err){
						return false;
					}
				}
				else if (params.colDef.type == 2){
					newVal = params.newValue;
				}
				else if (params.colDef.type == 3){
					newVal = params.newValue;
					if (!params.colDef.enums.some((val) => val == newVal)){
						return false;
					}
				}
				else{
					newVal = params.newValue;
				}
				params.data[params.colDef.colID] = newVal;
				return true;
			}

			columnDef.editable = editable;
		}
		gridOptions.api.setColumnDefs(this.columnDefs);
		$(tableHeader).text("Pivot Name " +  this.pivotColumn.name);
		this.selectedPivot = 0;
		$("#pivotValue").text(this.pivotColumn.types[this.selectedPivot]);
	}
	else{
		for(var column of this.pivotColumn.types){
			this.baseColumnOptions.push({
				editable: editable,
				resizable: true,
				filter: false,
				sortable: false,
				headerName: column,
				field: column,
				valueSetter: function(params){
					try{
						params.data[column] = Number(params.newValue);
						return true;
					}
					catch(err){
						return false;
					}
				},
				colID: column
			});
		}
		var $groupByDropdown = $(".groupBySelect");
		var $aggregateDropdown = $(".aggregationProperty");
		if (this.columnDefs.some((column) => column.field == "Count")){
				$aggregateDropdown.append($("<option />").val("Count").text("Count"));
		}
		for (var column of this.columnDefs){
			if (column.field == "Count"){
				continue;
			}
			if (column.type == "2" || column.type == "3"){
				$groupByDropdown.append($("<option />").val(column.headerName).text(column.headerName));
			}
			else if (column.type == "0" || column.type == "1"){
				$aggregateDropdown.append($("<option />").val(column.headerName).text(column.headerName));
			}
		}
		this.aggregateData();
		gridOptions.api.setColumnDefs(this.baseColumnOptions);
	}
}

function loadPlanProp(file) {
  pageSize = 1;
  gridOptions.api.paginationSetPageSize(Number(pageSize));
}

function randRange(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}

function saveChanges(){
	var currentValues = gridOptions.api.getModel().rowsToDisplay.map(row => row.data);
	var modifications = [];
	for (var i = 0;i < currentValues.length;i++){
		currentRow = currentValues[i];
		initialRow = initialValues[i];

	}
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

function groupArray(groupProps, allData, pivotColumn){
	summaryData = [];
	if (groupProps.length > 0){
		for (var pageData of this.allData){
			for (var row of pageData.pageData){
				var correspondingSummary = summaryData.find(summary => {
					for (var column of groupProps){
						if ((!!summary[column] && summary[column] != row[column]) && row[column] != "Undefined"){
							return false;
						}
					}
					return true;
				});
				if (!correspondingSummary){
					correspondingSummary = {};
					for (var column of groupProps){
						correspondingSummary[column] = row[column] ?? "Undefined";
					}
					summaryData.push(correspondingSummary);
				}
				correspondingSummary[pageData.pageName] = Number(row[this.aggregationProperty]) + (correspondingSummary[pageData.pageName] ?? 0);
			}
		}
		for (var column of this.pivotColumn.types){
			for (var row of summaryData){
				if (!row[column]){
					row[column] = 0;
				}
			}
		}
		return summaryData;
	}
	else{
		var summaryData = {};
		console.log(this.allData);
		for (pageData of this.allData){
			summaryData[pageData.pageName] = 0;
			for (rowData of pageData.pageData){
				summaryData[pageData.pageName] += Number(rowData[aggregationProperty]);
			}
		}
		return [summaryData];
	}
}

function groupData(){
	this.groupProps = $('.groupBySelect').map(function(idx, elem) {
		return $(elem).val();
	  }).get();

	if (this.groupProps[this.groupProps.length - 1] != "None"){
		var lastElement = $(".groupBySelect").last();
		var parent = $(lastElement).parent();
		$(lastElement).clone(true).insertAfter($(lastElement));
	}
	this.groupProps = this.groupProps.filter(group => group != "None");

	var columnOptions = this.groupProps.map((column) => {return {
		editable: false,
		resizable: true,
		filter: false,
		sortable: false,
		headerName: column,
		field: column,
		colID: column
	}}).concat(this.baseColumnOptions);
	
	this.savePlan();
	this.initialValues = this.groupArray(this.groupProps, this.allData, this.pivotColumn.types);
	gridOptions.api.setColumnDefs([])
	gridOptions.api.setColumnDefs(columnOptions);
	gridOptions.api.setRowData(JSON.parse(JSON.stringify(this.initialValues)));
}

function aggregateData(){
	if (!this.finishedLoading){
		this.finishedLoading = true;
		return;
	}
	aggregationProperty = $('.aggregationProperty').val();
	this.groupData();
}

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

function switchViewType(){
    localStorage.setItem("planToLoad", currentPlan);
	if (window.location.href.endsWith("plan-view.html")){
		location.href = './grid.html';
	}
	else{
		location.href = './plan-view.html';
	}
}
