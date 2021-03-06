
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

function downloadPlanDefs(){
  // Loads list of plans to load from
  plans = [];
  s3.listObjects({ Prefix: "plans/" }, function(err, data) { //function() is a callback (ASYNC!!!)
    if (err) {
      return alert("There was an error getting the list of plans");
    }
    plans = [];
    var items = (data.Contents.length);

    for(i=1; i<items; i+=1) {
      planName = data.Contents[i].Key;
      if(planName.endsWith("/")){
        // Trim path out of plan name ('plan/' is first 6 chars, '/' is last char)
        planName = planName.substring(6, planName.length-1);
        plans.push(planName);
      }
    }
    loadPlanNames(plans, 0);
  });
}

function loadPlanNames(plans, index){
	downloadPlanDef(plans[index], (planDef) => {
		if (!planDef.readWriteUsers
			|| planDef.readWriteUsers.some((user) => user == "Everyone" || user == sessionStorage.getItem("email"))
			|| planDef.readOnlyUsers.some((user) => user == "Everyone" || user == sessionStorage.getItem("email"))){

			var rowData = '[{"planName": "' + plans[index] + '"}]';
			gridOptions.api.updateRowData({add: JSON.parse(rowData)});
		}
		if (index < plans.length - 1){
			loadPlanNames(plans, index + 1);
		}
	})
}

// Save plan of specified name
function uploadNewPlan(rowData, colDef) {
  var planNameToCreate = getPlanNameToCreate();
  var folderKey = "plans/" + encodeURIComponent(planNameToCreate) + "/";

  s3.headObject({ Key: folderKey }, function(err, data) {
    if (!err) {
      return alert("Plan already exists.");
    }
    if (err.code !== "NotFound") {
      return alert("There was an error creating your plan: " + err.message);
    }
    s3.putObject({ Key: folderKey }, function(err, data) {
      if (err) {
        return alert("There was an error creating your plan: " + err.message);
      }
      alert("Successfully created plan.");
      var newPlanRow = '[{"planName": "' + planNameToCreate + '"}]';
      gridOptions.api.updateRowData({add: JSON.parse(newPlanRow)});
	  uploadPlanData(rowData, colDef, folderKey);
    });
  });
}

function uploadPlanData(rowData, colDef, folderKey){
	// Create a new file with the name of the plan
	var rowDataName = planNameToCreate + "Data.json";
	var rowDataFile = new File([rowData], rowDataName);
	var rowDataFileName = rowDataFile.name;

	var colDefName = planNameToCreate + "Def.json";
	var colDefFile = new File([colDef], colDefName);
	var colDefFileName = colDefFile.name;

	// PROPERTIES FILE
	var propFileName = "properties.json";
	var properties = {pageSize: 1};
	var propFile = new File([JSON.stringify(properties)], propFileName);

	var columnDefKey = folderKey + encodeURIComponent(colDefName);
	var rowDataKey = folderKey + encodeURIComponent(rowDataName);
	var propFileKey = folderKey + encodeURIComponent(propFileName);

	// Uploads row data, column defs, and properties file to S3
	uploadFile(rowDataFile, rowDataKey);
	uploadFile(colDefFile, columnDefKey);
	uploadFile(propFile, propFileKey);
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
      //alert("Successfully uploaded file.");
    },
    function(err) {
      //return alert("There was an error uploading your plan: ", err.message);
    }
  );
}

function deletePlanFolder(folderName, rowToDelete) {
  var folderKey = "plans/" + encodeURIComponent(folderName) + "/";
  s3.listObjects({ Prefix: folderKey }, function(err, data) {
    if (err) {
      //return alert("There was an error deleting your plan: ", err.message);
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
          //return alert("There was an error deleting your plan: ", err.message);
        }
        //alert("Successfully deleted the plan.");
        gridOptions.api.updateRowData({remove: rowToDelete});
      }
    );
  });
}
