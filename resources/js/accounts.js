
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

// Permissions
// R = Regular Users
// S = Super User
function getNewAccountInfo(){
  var accountForm = document.getElementById("createAccount");

  if(accountForm.elements["password1"].value != accountForm.elements["password2"].value){
    alert("The passwords do not match");
    return false;
  }
  var userObject = {}
  userObject["Email"] = accountForm.elements["email"].value;
  userObject["Password"] = accountForm.elements["password1"].value;
  userObject["Permission"] = "R";
  var jsonObject = JSON.stringify(userObject);

  if(appendToUsersFile(jsonObject)){
    return true;
  }
  return false;
}

function appendToUsersFile(user){
  file = s3.getObject({
    Bucket: bucketName,
    Key: "users.json"
  }, function (err, data) {
      if(err) {
        return false;
      } else {
        data = data.Body.toString();
        userList = JSON.parse(data);
        userJSON = JSON.parse(user);

        // check if the user already exists by looping through the userList and comparing email values
        for(var i = 0; i < userList.length; i++){
          if(userList[i]["Email"] === userJSON.email){
            alert("This user already exists.");
            return false;
          }
        }

        userList.push(userJSON);
        // upload the updated user file
        var upload = new AWS.S3.ManagedUpload({
          params: {
            Bucket: bucketName,
            Key: "users.json",
            Body: JSON.stringify(userList),
            ACL: "public-read"
          }
        });

        var promise = upload.promise();

        promise.then(
          function(data) {
            alert("Successfully created user.");
            window.location.href = "login.html";
            return true;
          },
          function(err) {
            return alert("There was an error creating your user: ", err.message);
            return false;
          }
        );
      }
  })
  return false;
}
/*
window.onloadstart = function logOut(){

  loginForm = document.getElementById("loginForm");
  loginForm.elements["email"] = this.undefined
  loginForm.elements["password"] = this.undefined
  checkCredentials()
  sessionStorage.setItem('email', undefined);
  sessionStorage.setItem('permission','R');
}
*/

// check if the username and password match in the users.json file
function checkCredentials(){
  // download the users.json file from the S3 bucket
  file = s3.getObject({
    Bucket: bucketName,
    Key: "users.json"
  }, function (err, data){
      if(err){
        alert("Error retrieving users file: ", err.message);
        return false;
      }
      else {
        data = data.Body.toString();
        userList = JSON.parse(data);

        var loginForm = document.getElementById("loginForm");

        // iterate through the user objects in users.json and find the username and password match
        for(var i = 0; i < userList.length; i++){
          if(userList[i]["Email"] === loginForm.elements["email"].value){
            if(userList[i]["Password"] === loginForm.elements["password"].value){
              // set the username and permission to check what the user can do
              sessionStorage.setItem('email', loginForm.elements["email"].value);
              sessionStorage.setItem('permission', userList[i]["Permission"]);
              window.location.href = "view-plans.html";
              return true;
            }
          }
        }
        alert("Username or password does not exist");
        return false;
      }
  })
  return false;
}
