
// Set options to use in ititializing the grid
var gridOptions = {
  animateRows: true,
  rowSelection: 'single',
  pagination: false,
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
var planDefinition = {pivotColumn: {}, columns: [], readWriteUsers: [], readOnlyUsers: [], columns: []};
var rowDefinitions = [];
var emptyRow = {};
var users;

// the first 4 columns are hard coded
var idDef = {
  "editable": true,
  "resizable": true,
  "filter": false,
  "sortable": false,
  "headerName": "ID",
  "field": "ID",
  "colID": "ID",
  "type": 0
};

var defaultNameCol = {
  "editable": true,
  "resizable": true,
  "filter": false,
  "sortable": false,
  "headerName": "Name",
  "field": "Name",
  "colID": "Name",
  "type": 2,
  "enums": 'Text'
};

var defaultLeaderCol = {
  "editable": true,
  "resizable": true,
  "filter": false,
  "sortable": false,
  "headerName": "Leader",
  "field": "Leader",
  "colID": "Leader",
  "type": 2,
  "enums": 'Text'
};

var defaultLocationCol = {
  "editable": true,
  "resizable": true,
  "filter": false,
  "sortable": false,
  "headerName": "Location",
  "field": "Location",
  "colID": "Location",
  "type": 2,
  "enums": 'Text'
};

var defaultTypeCol = {
  "editable": true,
  "resizable": true,
  "filter": false,
  "sortable": false,
  "headerName": "Type",
  "field": "Type",
  "colID": "Type",
  "type": 3,
  "enums": ['EMP', 'CON']
};

var defaultCountCol = {
  "editable": true,
  "resizable": true,
  "filter": false,
  "sortable": false,
  "headerName": "Count",
  "field": "Count",
  "colID": "Count",
  "type": 1,
  "enums": 'Integer'
};



emptyRow["ID"] = randRange(10000000, 99999999);

planDefinition.columns.push(idDef);

rowDefinitions.emptyRow = emptyRow;

initGrid(gridOptions);
loadUserDropdown();

function loadUserDropdown(){
	file = s3.getObject({
		Bucket: bucketName,
		Key: "users.json"
	}, function (err, data){
		if(err){
			alert("Error retrieving users file: ", err.message);
			console.log(err);
			return false;
		}
		else {
			data = data.Body.toString();
			userList = JSON.parse(data);
			this.users = userList.map(user => user.Email);

			var $userDropdown = $(".readWriteUserSelect");
			$userDropdown.append($("<option />").val("Everyone").text("Everyone"));
			for (var user of this.users){
				$userDropdown.append($("<option />").val(user).text(user));
			}
			
			$userDropdown = $(".readOnlyUserSelect");
			$userDropdown.append($("<option />").val("Everyone").text("Everyone"));
			for (var user of this.users){
				$userDropdown.append($("<option />").val(user).text(user));
			}
			return false;
		}
	});
}

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

$(".addFirstSibling").click(function() {
	var parent = $(this).parent();
	var siblings = $(this).siblings();
    $(this).siblings().first().clone(true).insertBefore($(this));
    return false;
});

$(".removeParent").click(function() {
    $(this).parent().remove();
});

$(".addPage").click(function() {
    $("#pagesForm > p:first-child").clone(true).insertBefore("#pagesForm > p:last-child");
    return false;
});

$(".removePage").click(function() {
    $(this).parent().remove();
});

$(".toggleEnums").click(function(){
	var enumEditor = $(this).siblings("span")[0];
	if (enumEditor.style.display === "none"){
		enumEditor.style.display = "inline-table";
	}
	else{
		enumEditor.style.display = "none";
	}
});

$(".typeSelect").change(function(){
	var value = $(this).val();
	if (value == "enum"){
		$(this).siblings(".toggleEnums").css("display", "inline");
	}
	else{
		var siblings = $(this).siblings(".enumOnly");
		$(this).siblings(".enumOnly").css("display", "none");
	}
})

function createNewPlan() {
    if(sessionStorage.getItem("permission") === "S"){
		// getting all the plan data from the html form
		var columns = $("#columnForm > .colInfo");
		var pivotValues = $(".pivotValue");
		var readWriteUsers = $(".readWriteUserSelect");
		var readOnlyUsers = $(".readOnlyUserSelect");
		planNameToCreate = document.getElementById("newPlanName").value;
      
		this.planDefinition.columns.push(defaultNameCol);
		this.planDefinition.columns.push(defaultLeaderCol);
		this.planDefinition.columns.push(defaultLocationCol);
		this.planDefinition.columns.push(defaultTypeCol);
		this.planDefinition.columns.push(defaultCountCol);

		// creating a JSON object out of columnDefinitions, will have to tweak
		// after implementing pages
		for(var i = 0 ; i < columns.length; i++) {
			var column = columns[i];
			var types = [];
			if ($(columns[i]).children(".typeSelect").first().val() === "enum"){
				var enumVals = $(column).find(".enumName");
				for (var j = 0;j < enumVals.length;j++){
					types.push($(enumVals[j]).val());
				}
			}

			if($(column).find(".colName").first().val()) {
				var columnInfo = {
					"editable": true,
					"resizable": true,
					"filter": false,
					"sortable": false,
					"headerName": $(column).find(".colName").first().val(),
					"field": $(column).find(".colName").first().val(),
					"colID": $(column).find(".colName").first().val(),
					"type": $(column).find(".typeSelect").first().find(":selected").index(),
					"enums": types
				};
				this.planDefinition.columns.push(columnInfo);
				emptyRow[$(column).find(".typeSelect").first().val()] = "";
			}
      }

	  for (var user of readWriteUsers){
	  	  this.planDefinition.readWriteUsers.push($(user).val());
	  }
	  for (var user of readOnlyUsers){
	  	  this.planDefinition.readOnlyUsers.push($(user).val());
	  }
		for (var column of this.planDefinition.columns){
			if (column.type == 0 || column.type == 1){
				emptyRow[column.field] = 0;
			}
			else{
				emptyRow[column.field] = "";
			}
		}

      this.planDefinition.pivotColumn.name = document.getElementById("pivotName").value; // save the name of the pivote value
	  this.planDefinition.pivotColumn.types = [];
	  var allData = [];
	  for (var pivotValue of pivotValues){
	  	  this.planDefinition.pivotColumn.types.push($(pivotValue).val());
		  allData.push({pageName: $(pivotValue).val(), pageData: [emptyRow]})
	  }
      allData = JSON.stringify(allData);
      this.planDefinition = JSON.stringify(planDefinition);

      uploadNewPlan(allData, planDefinition);
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
  return planDefinition;
}

function getEmptyRow(){
  return rowDefinitions;
}

function randRange(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}
