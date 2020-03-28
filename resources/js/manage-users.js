var bucketName = "2020group11seniordesign";
var bucketRegion = "us-west-2";
var IdentityPoolId = "us-west-2:f9be604f-1168-4dbf-966c-28d18cce854f";

AWS.config.region = bucketRegion; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IdentityPoolId,
});

var s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  params: { Bucket: bucketName }
});

// function to act as a class
function MyCellRenderer () {}

// gets called once before the renderer is used
MyCellRenderer.prototype.init = function(params) {
    // create the cell
    this.eGui = document.createElement('div');
    this.eGui.innerHTML = '<button class="delete-btn blue ghost">Delete User</button>';
	this.eButton = this.eGui.querySelector('.delete-btn');
	this.eButton.rowNodeId = params.node.id;

    // add event listener to button
    this.eventListener = function() {
		var row = gridOptions.api.getRowNode(this.rowNodeId);
		gridOptions.api.updateRowData({remove: [row.data]});
    };
    this.eButton.addEventListener('click', this.eventListener);
};

// gets called once (assuming destroy hasn't been called first) when grid ready to insert the element
MyCellRenderer.prototype.getGui = function() {
    return this.eGui;
};

// gets called whenever the user gets the cell to refresh
MyCellRenderer.prototype.refresh = function(params) {
    // return true to tell the grid we refreshed successfully
    return true;
};

// gets called when the cell is removed from the grid
MyCellRenderer.prototype.destroy = function() {
    // do cleanup, remove event listener from button
    if (this.eButton) {
        // check that the button element exists as destroy() can be called before getGui()
        this.eButton.removeEventListener('click', this.eventListener);
    }    
};

//Stuff for manage-users.html
// Set options to use in ititializing the grid
var gridOptions = {
  animateRows: true,
  rowSelection: 'multiple',

  frameworkComponents: {
  	  myCellRenderer: MyCellRenderer
  },

  // defines default column properties that are inherited
  // by default by any new columns
  defaultColDef: {
    editable: true,
    resizable: true,
    filter: true,
    sortable: true,
    width: 150
  },

  columnDefs:[
    {
		headerName: "Email",
		field: "Email",
		colId: "Email",
		editable: false
    },
    {
		headerName: "Permission",
		field: "Permission",
		colId: "Permission"
    },
	{
		field: "Delete User",
		cellRenderer: MyCellRenderer
	}
  ]
};

initGrid(gridOptions);

function initGrid() {
  //Find the grid div element in index.html
  var eGridDiv = document.querySelector('#grid');

  //Create the grid passing in the div to use together with the columns & data we want to use
  new agGrid.Grid(eGridDiv, gridOptions);

  //Download a the users from s3 and load into grid
  loadUserInfo();
}

var rowData = [];
var originalPermissions;

function loadUserInfo(){
	if (sessionStorage.getItem("permission") == 'S'){
	  file = s3.getObject({
		Bucket: bucketName,
		Key: "permissions.json"
	  }, function (err, data) {
		  if(err) {
			return false;
		  }
		  else{
			rowData = JSON.parse(data.Body.toString());
			for (let user of rowData){
				if (user.Permission != "S"){
					user.Permission = "R";
				}
			}
			gridOptions.api.updateRowData({add: JSON.parse(JSON.stringify(rowData))});
		  }
	  });
	}
	else{
		$("#tableContainer").remove();
	}
}

function uploadPassword(newPassword){
	var passwordPromise;
	if (newPassword != ""){
		file = s3.getObject({
			Bucket: bucketName,
			Key: "users.json"
		}, function (err, data) {
			if(err) {
				return false;
			}
			else{
				var users = JSON.parse(data.Body.toString());
				username = sessionStorage.getItem("email");
				for (let user of users){
					if (user.Email === username){
						user.Password = newPassword;
					}
				}
				passwordPromise = new AWS.S3.ManagedUpload({
					params: {
						Bucket: bucketName,
						Key: "users.json",
						Body: JSON.stringify(users),
						ACL: "public-read"
					}
				}).promise();
			}
		});
		file.on('success', function(response){
			return passwordPromise;
		});
	}
	else{
		return undefined;
	}
}

function saveChangesToUserInfo(){
	var newPassword = $("#password").val();
	var passwordPromise = uploadPassword(newPassword);
	var promise;
  
	if (sessionStorage.getItem("permission") == 'S'){
		// get the grid data as a csv, convert to json and save to s3
		var newRowData = gridOptions.api.getDataAsCsv();
		newRowData = convertCSV(newRowData);
		newRowData = JSON.parse(newRowData);
		// something is adding an extra blank user to the list, so we remove it here
		newRowData.length--;

		for (let i = 0;i < newRowData.length;i++){
			origRow = rowData[i];
			newRow  = newRowData[i];
			if (newRow.Permission != origRow.Permission){
				var upload = new AWS.S3.ManagedUpload({
					params: {
						Bucket: bucketName,
						Key: "permissions.json",
						Body: JSON.stringify(newRowData),
						ACL: "public-read"
					}
				});

				promise = upload.promise();
			}
		}
		
		Promise.all([passwordPromise, promise]).then(
			function(data) {
				alert("Successfully updated the user file");
				this.returnToPlans();
			},
			function(err) {
				return alert("There was an error updating the user file: ", err.message);
			}
		);

	}
}

function returnToPlans(){
  location.href = './view-plans.html';
}

// Converts a CSV file (with header) to a JSON file
function convertCSV(csv) {
  Papa.parse(csv.toString(), {
    header: true,
    newline: "}",
    complete: function(results) {
      csv = results.data;
    }
  });
  return JSON.stringify(csv, null, '\t');
}
