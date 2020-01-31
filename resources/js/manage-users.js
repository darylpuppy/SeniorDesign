var bucketName = "workforce-planning-tool-prototype";
var bucketRegion = "us-east-2";
var IdentityPoolId = "us-east-2:d7dc0ae9-baf2-4777-ad5c-cfc3ad132b90";

AWS.config.update({
  region: bucketRegion,
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IdentityPoolId
  })
});

var s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  params: { Bucket: bucketName }
});

//Stuff for manage-users.html
// Set options to use in ititializing the grid
var gridOptions = {
  animateRows: true,
  rowSelection: 'multiple',

  // defines default column properties that are inherited
  // by default by any new columns
  defaultColDef: {
    editable: true,
    resizable: true,
    filter: true,
    sortable: true,
    width: 150,
  },

  columnDefs:[
    {
    headerName: "Email",
    field: "Email",
    colId: "Email"
    },
    {
    headerName: "Password",
    field: "Password",
    colId: "Password"
    },
    {
    headerName: "Permission",
    field: "Permission",
    colId: "Permission"
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

function loadUserInfo(){
  file = s3.getObject({
    Bucket: bucketName,
    Key: "users.json"
  }, function (err, data) {
      if(err) {
        console.log("Error retrieving file");
        return false;
      }
      else{
        rowData = data.Body.toString();
        gridOptions.api.updateRowData({add: JSON.parse(rowData)});
      }
  })
}

function saveChangesToUserInfo(){
  // get the grid data as a csv, convert to json and save to s3
  var newRowData = gridOptions.api.getDataAsCsv();
  newRowData = convertCSV(newRowData);
  newRowData = JSON.parse(newRowData);
  // something is adding an extra blank user to the list, so we remove it here
  newRowData.length--;

  var upload = new AWS.S3.ManagedUpload({
    params: {
      Bucket: bucketName,
      Key: "users.json",
      Body: JSON.stringify(newRowData),
      ACL: "public-read"
    }
  });

  var promise = upload.promise();

  promise.then(
    function(data) {
      alert("Successfully updated the user file");
    },
    function(err) {
      return alert("There was an error updating the user file: ", err.message);
    }
  );
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
