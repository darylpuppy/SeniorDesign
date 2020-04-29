const planEditedID = "Planned For";

// Specify credentials needed to put/get on S3 bucket
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


//stores plan json files in here
var importedJsonPlan = {
  planName: null,
  JsonData: null,
  JsonDefs: null,
  JsonProp: null
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

function downloadPlanData(planName, callback, isDataView) {
  var fileName = planName + "Data.json";
  var folderName = planName;
  var folderKey = "plans/" + encodeURIComponent(folderName) + "/"; //specifies folder
  var fileKey = folderKey + fileName;

  downloadFile(fileName, fileKey, callback, isDataView)
}

function downloadPlanDef(planName, callback, isDataView) {
  var fileName = planName + "Def.json";
  var folderName = planName;
  var folderKey = "plans/" + encodeURIComponent(folderName) + "/"; //specifies folder
  var fileKey = folderKey + fileName;

  downloadFile(fileName, fileKey, callback, isDataView);
}

function downloadPlanProp(planName, callback) {
  var fileName = "properties.json";
  var folderName = planName;
  var folderKey = "plans/" + encodeURIComponent(folderName) + "/";
  var fileKey = folderKey + fileName;

  downloadFile(fileName, fileKey, callback);
}

// Save plan of specified name
function savePlan() {
	var planName = document.getElementById("planName").value

	// Specified if user selects 'save as', otherwise save with current name
	if(planName == "") {
	planName = getCurrentPlan();
	}

	if (!window.location.href.endsWith("grid.html")){
		finalValues = JSON.parse(convertCSV(exportCSV()));
		for (var i = 0;i < this.finalValues.length;i++){
			var finalRow = this.finalValues[i];
			var initialRow = this.initialValues[i];

			for (var column in finalRow){
				if (finalRow[column] != initialRow[column]){
					var correspondingPage = this.allData.find((page) => page.pageName == column);	//All of these variables are in main.js
					var correspondingRow = correspondingPage.pageData.find((row) => {
						if (!row.ID || row.ID != this.planEditedID){
							return false;
						}
						for (var groupProp of this.groupProps){
							if (row[groupProp] != finalRow[groupProp]){
								return false;
							}
						}
						return true;
					});

					if (correspondingRow == null){
						correspondingRow = {ID: planEditedID};
						for (var groupProp of this.groupProps){
							correspondingRow[groupProp] = finalRow[groupProp];
						}
						correspondingPage.pageData.push(correspondingRow);
					}
					correspondingRow[aggregationProperty] = (correspondingRow[aggregationProperty] ?? 0) + Number(finalRow[column]) - Number(initialRow[column]);
				}
			}
		}
	}

	var colDef = getColumnDefs();
	colDef = JSON.stringify(colDef, null, '\t');
		
	// Create a new file with the name of the plan and row/column data
	// ROW DATA
	planDataName = planName + "Data.json";
	var rowDataFile = new File([JSON.stringify(this.allData)], planDataName);
	var rowDataFileName = rowDataFile.name;

	// COLUMN DEFS
	colDefName = planName + "Def.json";
	var colDefFile = new File([colDef], colDefName);
	var colDefFileName = colDefFile.name;

	// PROPERTIES FILE
	var propFileName = "properties.json";
	var properties = {pageSize: getPageSize()};
	var propFile = new File([JSON.stringify(properties)], propFileName);

	var folderKey = "plans/" + encodeURIComponent(planName) + "/"; //specifies plan folder to upload to
	var rowDataFileKey = folderKey + rowDataFileName;
	var colDefFileKey = folderKey + colDefFileName;
	var propFileKey = folderKey + propFileName;

	// Uploads row data and column defs to S3
	uploadFile(rowDataFile, rowDataFileKey);
	uploadFile(propFile, propFileKey);

	// Closes save as modal if showing
	closeSaveAs();
}

function savePlanButton(notification) {
  var planName = document.getElementById("planName").value

  // Specified if user selects 'save as', otherwise save with current name
  if(planName == "") {
    planName = getCurrentPlan();
  }

  // Converts the grid's data to a CSV, then to a JSON for export
  var rowData = exportCSV();
  rowData = JSON.parse(convertCSV(rowData));
  var currentPage = this.allData.find((page) => page.pageName == this.pivotColumn.types[this.selectedPivot]);	//All of these variables are in main.js
  currentPage.pageData = rowData;

  var colDef = getColumnDefs();
  colDef = JSON.stringify(colDef, null, '\t');

  // Create a new file with the name of the plan and row/column data
  // ROW DATA
  planDataName = planName + "Data.json";
  var rowDataFile = new File([JSON.stringify(this.allData)], planDataName);
  var rowDataFileName = rowDataFile.name;

  // COLUMN DEFS
  colDefName = planName + "Def.json";
  var colDefFile = new File([colDef], colDefName);
  var colDefFileName = colDefFile.name;

  // PROPERTIES FILE
  var propFileName = "properties.json";
  var properties = {pageSize: getPageSize()};
  var propFile = new File([JSON.stringify(properties)], propFileName);

  var folderKey = "plans/" + encodeURIComponent(planName) + "/"; //specifies plan folder to upload to
  var rowDataFileKey = folderKey + rowDataFileName;
  var colDefFileKey = folderKey + colDefFileName;
  var propFileKey = folderKey + propFileName;

  // Uploads row data and column defs to S3
  uploadFile(rowDataFile, rowDataFileKey);
  uploadFile(propFile, propFileKey);

  // Closes save as modal if showing
  closeSaveAs();
  if(notification == true)
    alert("Plan Saved");
}

function openSaveAs() {
  document.getElementById("saveAsForm").style.display="block";
}

window.onclick = function(event) {
  var modal = document.getElementById("saveAsForm");
  if(event.target == modal) {
    closeForm();
  }
}

function closeSaveAs() {
  document.getElementById("saveAsForm").style.display="none";
}

// Load a plan of specified name
function loadPlan(planName, isDataView) {
  setCurrentPlan(planName);
  downloadPlanData(planName, loadPlanData, isDataView); //in file.js, loadPlanData() is callback
  downloadPlanDef(planName, loadPlanDef, isDataView);
  downloadPlanProp(planName, loadPlanProp, isDataView);
}

// Load a plan from the selected plan in list
function loadPlanFromList() {
  var planList = document.getElementById("planList");
  var selectedPlan = planList.options[planList.selectedIndex].value;
  loadPlan(selectedPlan);
}

// Upload a file to the S3 bucket
function uploadFile(file, fileKey, folderName) {
  // Use S3 ManagedUpload class as it supports multipart uploads
  var upload = new AWS.S3.ManagedUpload({
    params: {
      Bucket: bucketName,
      Key: fileKey,
      Body: file,
      ACL: "public-read"
    }
  });

  var promise = upload.promise();

  promise.then(
    function(data) {
      console.log("Successfully uploaded file.");
    },
    function(err) {
      return alert("There was an error uploading your file: ", err.message);
    }
  );
}

function downloadFile(fileName, fileKey, callback, isDataView) {
  console.log(fileName);
  console.log(fileKey);
  file = s3.getObject({
    Bucket: bucketName,
    Key: fileKey
  }, function (err, data) {
      if(err) {
        console.log("Error retrieving file");
        return "derp";
      } else {
        console.log("File retrieved");
        data = data.Body.toString();
        callback(JSON.parse(data), isDataView);
      }
  })
}



function downloadFileImporting(fileName, fileKey, callback, isDataView) {
  console.log(fileName);
  console.log(fileKey);
  file = s3.getObject({
    Bucket: bucketName,
    Key: fileKey
  }, function (err, data) {
      if(err) {
        console.log("Error retrieving file");
        return "derp";
      } else {
        console.log("File retrieved");
        data = data.Body.toString();
        callback(JSON.parse(data), isDataView);
        //return(JSON.parse(data));
      }
  })
}


function importPlan(){//import plan
  importPlanName = localStorage.getItem('planToLoad');
  importedJsonPlan.planName = importPlanName;
  ImportJson()
}

function ImportJson(temp){//import plan data
  var fileName = importedJsonPlan.planName + "Data.json";
  var folderName = importedJsonPlan.planName;
  var folderKey = "plans/" + encodeURIComponent(folderName) + "/"; //specifies folder 
  var fileKey = folderKey + fileName;

  downloadFileImporting(fileName, fileKey, ImportDef, true);
}


function ImportDef(importPlanJsonData){//import plan defs

  importedJsonPlan.JsonData = importPlanJsonData;//saves import plan data
  var fileName = importedJsonPlan.planName + "Def.json";
  var folderName = importedJsonPlan.planName;
  var folderKey = "plans/" + encodeURIComponent(folderName) + "/"; //specifies folder 
  var fileKey = folderKey + fileName;

  downloadFileImporting(fileName, fileKey, Importprop, true);
}

function Importprop(importPlanJsonDef){//import plan props
  
  importedJsonPlan.JsonDefs = importPlanJsonDef;//saves import plan defs
  var fileName = "properties.json";
  var folderName = importedJsonPlan.planName;
  var folderKey = "plans/" + encodeURIComponent(folderName) + "/"; //specifies folder 
  var fileKey = folderKey + fileName;

  downloadFileImporting(fileName, fileKey, parseImport, true);
}


function parseImport(importPlanJsonProp){

  importPlanName = localStorage.getItem('planToLoad');
  importedJsonPlan.JsonProp = importPlanJsonProp;//saves import plan props

  //=====================================================

  pivotColumnName = importedJsonPlan.JsonDefs.pivotColumn.name;
  var currentPageName = importedJsonPlan.JsonData;
  var currentPageData = currentPageName[0].pageData;
  csvCurrentPageName = currentPageName[0].pageName

  //gets the column names
  let csvString = pivotColumnName + ',';

  var obj = currentPageData[0];
  for (var key in obj){
      var attrName = key;
      csvString = csvString + attrName + ',';

  }
  csvString = csvString.slice(0, -1);
  csvString = csvString + '\n' ;

  //done getting columns names...time to get rows information

  for (j = 0; j < currentPageName.length; j++){
    csvCurrentPageName = currentPageName[j].pageName;
    currentPageData = currentPageName[j].pageData;

    //gets the row entries per row per page
    for (var i = 0; i < currentPageData.length; i++){
    csvString = csvString + csvCurrentPageName + ',';
    obj = currentPageData[i];
    for (var key in obj){
        var attrName = key;
        var attrValue = obj[key];
        csvString = csvString + attrValue + ',';
    }
    csvString = csvString.slice(0, -1);
    csvString = csvString + '\n';
    }
  }
  var csvData  = Papa.parse(csvString);
  console.log(csvData);
  console.log("Plan coverted to CSV complete");
  //Papa.unparse(csvData.data);
  downloadImportedCSV(Papa.unparse(csvData.data));


}

function downloadImportedCSV(csv){
  /*
  const blob = new Blob([csvData], {type:'text/csv'});
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  console.log(url);
  a.setAttribute('hidden','');
  a.setAttribute('download',  'download.csv');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  console.log(importedJsonPlan.planName + "downloaded");

  */
  var csvData = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
  var csvURL =  null;
  let csvFileName = importedJsonPlan.planName + '.csv';
  if (navigator.msSaveBlob)
  {
      csvURL = navigator.msSaveBlob(csvData, csvFileName);
  }
  else
  {
      csvURL = window.URL.createObjectURL(csvData);
  }

  var tempLink = document.createElement('a');
  tempLink.href = csvURL;
  tempLink.setAttribute('download', csvFileName);
  tempLink.click();

}



function parseImportJsonData(){
  console.log('inside parseImportJsonData');
}

function parseImportJsonDef(){
  console.log('inside parseImportJsonDef');
}

//drag and drop event
var dropzone;
function setup(){
  dropzone = select('#dropzone');
  //tableContainer = select('#tableContainer');
  dropzone.style('opacity', .0);
  dropzone.dragOver(highlight);
  dropzone.dragLeave(unhighlight);
  dropzone.drop(gotFile, unhighlight);

}


//opens and retrieves and file from the drag and drop
function gotFile(file) {
  console.log("opening file: " + file.name);
  console.log(file.data);

  var handleCSVData;

  function handleData(data){
    handleCSVData = data;
    handleCSVData.name = file.name;
    console.log(handleCSVData);
  }
  loadTable(file.data, (data) => handleData(data), 'header');
}



//parse and handle data in this function so the table can preload
function handleData(data){
  handleCSVData = data;
  console.log(handleCSVData);
}

function highlight() {
  dropzone.style('opacity', .25);
  dropzone.style('z-index', 1000);

}

function unhighlight() {
  dropzone.style('opacity', .0);
  dropzone.style('z-index', 1);
}


function exportPlan(){
  console.log('exportPlan');

}







/*

//////// Unused functions for creating/viewing folders and deleting files ////////

function createFolder(folderName) {
  //folderName = "Vacation 2020"
  folderName = prompt("Please enter a folder name", "new folder");
  folderName = folderName.trim();
  if (!folderName) {
    return alert("Folder names must contain at least one non-space character.");
  }
  if (folderName.indexOf("/") !== -1) {
    return alert("Folder names cannot contain slashes.");
  }
  var folderKey = encodeURIComponent(folderName) + "/";
  s3.headObject({ Key: folderKey }, function(err, data) {
    if (!err) {
      return alert("Folder already exists.");
    }
    if (err.code !== "NotFound") {
      return alert("There was an error creating your folder: " + err.message);
    }
    s3.putObject({ Key: folderKey }, function(err, data) {
      if (err) {
        return alert("There was an error creating your folder: " + err.message);
      }
      alert("Successfully created folder.");
      viewFolder(folderName);
    });
  });
}

function viewFolders(folderName) {
  var folderFilesKey = encodeURIComponent(folderName) + "//";
  s3.listObjects({ Prefix: folderFilesKey }, function(err, data) {
    if (err) {
      return alert("There was an error viewing your folder: " + err.message);
    }
    // 'this' references the AWS.Response instance that represents the response
    var href = this.request.httpRequest.endpoint.href;
    var bucketUrl = href + bucketName + "/";

    var files = data.Contents.map(function(file) {
      var fileKey = file.Key;
      var fileUrl = bucketUrl + encodeURIComponent(fileKey);
      return getHtml([
        "<span>",
        "<div>",
        '<img style="width:128px;height:128px;" src="' + fileUrl + '"/>',
        "</div>",
        "<div>",
        "<span onclick=\"deleteFile('" +
          folderName +
          "','" +
          fileKey +
          "')\">",
        "X",
        "</span>",
        "<span>",
        fileKey.replace(folderFilesKey, ""),
        "</span>",
        "</div>",
        "</span>"
      ]);
    });
    var message = files.length
      ? "<p>Click on the X to delete the file</p>"
      : "<p>You do not have any files in this folder. Please add files.</p>";
    var htmlTemplate = [
      "<h2>",
      "Folder: " + folderName,
      "</h2>",
      message,
      "<div>",
      getHtml(files),
      "</div>",
      '<input id="fileupload" type="file" accept="image/*">',
      '<button id="addFile" onclick="addFile(\'' + folderName + "')\">",
      "Add File",
      "</button>",
      '<button onclick="listFolders()">',
      "Back To Folders",
      "</button>"
    ];
    document.getElementById("file").innerHTML = getHtml(htmlTemplate); //app?
  });
}
*/

/*
function deleteFile(folderName, fileKey) {
  s3.deleteObject({ Key: fileKey }, function(err, data) {
    if (err) {
      return alert("There was an error deleting your file: ", err.message);
    }
    alert("Successfully deleted file.");
    viewFolder(folderName);
  });
}

function deleteFolder(folderName) {
  var folderKey = encodeURIComponent(folderName) + "/";
  s3.listObjects({ Prefix: folderKey }, function(err, data) {
    if (err) {
      return alert("There was an error deleting your folder: ", err.message);
    }
    var objects = data.Contents.map(function(object) {
      return { Key: object.Key };
    });
    s3.deleteObjects(
      {
        Delete: { Objects: objects, Quiet: true }
      },
      function(err, data) {
        if (err) {
          return alert("There was an error deleting your folder: ", err.message);
        }
        alert("Successfully deleted folder.");
        listFolders();
      }
    );
  });
}
*/
